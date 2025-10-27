import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LikeNotificationRequest {
  liked_user_id: string
  liker_id: string
  swipe_id: string
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
    const { liked_user_id, liker_id, swipe_id }: LikeNotificationRequest = await req.json()

    if (!liked_user_id || !liker_id || !swipe_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: liked_user_id, liker_id, swipe_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get liker's profile for personalized notification
    const { data: likerProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('first_name, photos')
      .eq('user_id', liker_id)
      .single()

    if (profileError) {
      console.error('Error fetching liker profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch liker profile' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get liked user's notification preferences
    const { data: preferences, error: prefsError } = await supabaseClient
      .from('notification_preferences')
      .select('like_notifications')
      .eq('user_id', liked_user_id)
      .single()

    if (prefsError || !preferences?.like_notifications) {
      console.log(`Like notifications disabled for user ${liked_user_id}`)
      return new Response(
        JSON.stringify({ message: 'Like notifications disabled', sent: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get liked user's push tokens
    const { data: pushTokens, error: tokensError } = await supabaseClient
      .rpc('get_user_push_tokens', { target_user_id: liked_user_id })

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
      console.log(`No push tokens found for user ${liked_user_id}`)
      return new Response(
        JSON.stringify({ message: 'No push tokens found', sent: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create personalized notification
    const likerName = likerProfile?.first_name || 'Someone'
    const title = "💖 Someone Liked You!"
    const body = `${likerName} liked your profile. Swipe right to see if it's a match!`

    // Send notifications to all active tokens
    const notifications = pushTokens.map((token: any) => ({
      to: token.expo_push_token,
      sound: 'default',
      title,
      body,
      data: {
        notification_type: 'like',
        swipe_id,
        liker_id,
        user_id: liked_user_id,
        screen: 'discover'
      },
      priority: 'normal',
      channelId: 'likes'
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
      user_id: liked_user_id,
      notification_type: 'like',
      title,
      body,
      expo_push_token: token.expo_push_token,
      sent_at: new Date().toISOString(),
      status: expoResult.data?.[index]?.status || 'unknown',
      error_message: expoResult.data?.[index]?.message || null,
      related_id: swipe_id
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
        message: 'Like notification sent successfully',
        sent: notifications.length,
        tokens: pushTokens.length,
        liker_name: likerName,
        expo_response: expoResult
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in like notification function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
