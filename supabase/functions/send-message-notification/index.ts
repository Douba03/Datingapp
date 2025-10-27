import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MessageNotificationRequest {
  recipient_id: string
  sender_id: string
  message_id: string
  match_id: string
  message_text: string
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
    const { recipient_id, sender_id, message_id, match_id, message_text }: MessageNotificationRequest = await req.json()

    if (!recipient_id || !sender_id || !message_id || !match_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: recipient_id, sender_id, message_id, match_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get sender's profile for personalized notification
    const { data: senderProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('first_name, photos')
      .eq('user_id', sender_id)
      .single()

    if (profileError) {
      console.error('Error fetching sender profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch sender profile' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get recipient's notification preferences
    const { data: preferences, error: prefsError } = await supabaseClient
      .from('notification_preferences')
      .select('message_notifications')
      .eq('user_id', recipient_id)
      .single()

    if (prefsError || !preferences?.message_notifications) {
      console.log(`Message notifications disabled for user ${recipient_id}`)
      return new Response(
        JSON.stringify({ message: 'Message notifications disabled', sent: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get recipient's push tokens
    const { data: pushTokens, error: tokensError } = await supabaseClient
      .rpc('get_user_push_tokens', { target_user_id: recipient_id })

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
      console.log(`No push tokens found for user ${recipient_id}`)
      return new Response(
        JSON.stringify({ message: 'No push tokens found', sent: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create personalized notification
    const senderName = senderProfile?.first_name || 'Someone'
    const truncatedMessage = message_text.length > 50 
      ? message_text.substring(0, 50) + '...' 
      : message_text

    const title = `💬 ${senderName}`
    const body = truncatedMessage

    // Send notifications to all active tokens
    const notifications = pushTokens.map((token: any) => ({
      to: token.expo_push_token,
      sound: 'default',
      title,
      body,
      data: {
        notification_type: 'message',
        message_id,
        sender_id,
        match_id,
        user_id: recipient_id,
        screen: 'chat',
        chat_id: match_id
      },
      priority: 'high',
      channelId: 'messages'
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
    const logEntries = pushTokens.map((token: any, index: number) => ({
      user_id: recipient_id,
      notification_type: 'message',
      title,
      body,
      expo_push_token: token.expo_push_token,
      sent_at: new Date().toISOString(),
      status: expoResult.data?.[index]?.status || 'unknown',
      error_message: expoResult.data?.[index]?.message || null,
      related_id: message_id
    }))

    // Insert notification logs
    const { error: logError } = await supabaseClient
      .from('notification_logs')
      .insert(logEntries)

    if (logError) {
      console.error('Error logging notifications:', logError)
    }

    // Update last_used_at for tokens
    const tokenUpdates = pushTokens.map((token: any) => ({
      expo_push_token: token.expo_push_token,
      last_used_at: new Date().toISOString()
    }))

    await supabaseClient
      .from('user_push_tokens')
      .upsert(tokenUpdates, { onConflict: 'expo_push_token' })

    return new Response(
      JSON.stringify({ 
        message: 'Message notification sent successfully',
        sent: notifications.length,
        tokens: pushTokens.length,
        sender_name: senderName,
        expo_response: expoResult
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in message notification function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
