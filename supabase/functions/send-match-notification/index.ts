import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MatchNotificationRequest {
  user_id: string
  matched_user_id: string
  match_id: string
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
    const { user_id, matched_user_id, match_id }: MatchNotificationRequest = await req.json()

    if (!user_id || !matched_user_id || !match_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, matched_user_id, match_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get matched user's profile for personalized notification
    const { data: matchedProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('first_name, photos')
      .eq('user_id', matched_user_id)
      .single()

    if (profileError) {
      console.error('Error fetching matched user profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch matched user profile' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user's notification preferences
    const { data: preferences, error: prefsError } = await supabaseClient
      .from('notification_preferences')
      .select('match_notifications')
      .eq('user_id', user_id)
      .single()

    if (prefsError || !preferences?.match_notifications) {
      console.log(`Match notifications disabled for user ${user_id}`)
      return new Response(
        JSON.stringify({ message: 'Match notifications disabled', sent: 0 }),
        { 
          status: 200, 
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

    // Create personalized notification
    const firstName = matchedProfile?.first_name || 'Someone'
    const title = "🎉 It's a Match!"
    const body = `You and ${firstName} liked each other! Start chatting now.`

    // Send notifications to all active tokens
    const notifications = pushTokens.map((token: any) => ({
      to: token.expo_push_token,
      sound: 'default',
      title,
      body,
      data: {
        notification_type: 'match',
        match_id,
        matched_user_id,
        user_id,
        screen: 'chat',
        chat_id: match_id
      },
      priority: 'high',
      channelId: 'matches'
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
      user_id,
      notification_type: 'match',
      title,
      body,
      expo_push_token: token.expo_push_token,
      sent_at: new Date().toISOString(),
      status: expoResult.data?.[index]?.status || 'unknown',
      error_message: expoResult.data?.[index]?.message || null,
      related_id: match_id
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
        message: 'Match notification sent successfully',
        sent: notifications.length,
        tokens: pushTokens.length,
        matched_user: firstName,
        expo_response: expoResult
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in match notification function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
