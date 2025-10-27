import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  user_id: string
  notification_type: 'match' | 'message' | 'like' | 'system'
  title: string
  body: string
  data?: Record<string, any>
  related_id?: string
}

interface PushToken {
  expo_push_token: string
  device_type: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse request body
    const { user_id, notification_type, title, body, data, related_id }: NotificationRequest = await req.json()

    if (!user_id || !notification_type || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user's push tokens
    const { data: pushTokens, error: tokensError } = await supabaseClient
      .rpc('get_user_push_tokens', { target_user_id: user_id })

    if (tokensError) {
      console.error('Error fetching push tokens:', tokensError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!pushTokens || pushTokens.length === 0) {
      console.log(`No push tokens found for user ${user_id}`)
      return new Response(
        JSON.stringify({ message: 'No push tokens found', sent: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send notifications to all active tokens
    const notifications = pushTokens.map((token: PushToken) => ({
      to: token.expo_push_token,
      sound: 'default',
      title,
      body,
      data: {
        ...data,
        notification_type,
        related_id,
        user_id
      },
      priority: 'high',
      channelId: 'default'
    }))

    // Send to Expo Push API
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notifications),
    })

    const expoResult = await expoResponse.json()

    // Log notification attempts
    const logEntries = pushTokens.map((token: PushToken, index: number) => ({
      user_id,
      notification_type,
      title,
      body,
      expo_push_token: token.expo_push_token,
      sent_at: new Date().toISOString(),
      status: expoResult.data?.[index]?.status || 'unknown',
      error_message: expoResult.data?.[index]?.message || null,
      related_id
    }))

    // Insert notification logs
    const { error: logError } = await supabaseClient
      .from('notification_logs')
      .insert(logEntries)

    if (logError) {
      console.error('Error logging notifications:', logError)
    }

    // Update last_used_at for tokens
    const tokenUpdates = pushTokens.map((token: PushToken) => ({
      expo_push_token: token.expo_push_token,
      last_used_at: new Date().toISOString()
    }))

    await supabaseClient
      .from('user_push_tokens')
      .upsert(tokenUpdates, { onConflict: 'expo_push_token' })

    return new Response(
      JSON.stringify({ 
        message: 'Notifications sent successfully',
        sent: notifications.length,
        tokens: pushTokens.length,
        expo_response: expoResult
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in notification function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
