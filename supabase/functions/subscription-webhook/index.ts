// Supabase Edge Function for Apple/Google Subscription Webhooks
// Handles renewals, cancellations, refunds, and billing issues

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const url = new URL(req.url)
    const platform = url.searchParams.get('platform')

    if (platform === 'apple') {
      return await handleAppleWebhook(req, supabase)
    } else if (platform === 'google') {
      return await handleGoogleWebhook(req, supabase)
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid platform' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Apple App Store Server Notifications V2
async function handleAppleWebhook(req: Request, supabase: any) {
  const body = await req.json()
  
  // Apple sends a signed JWT - decode it
  const signedPayload = body.signedPayload
  if (!signedPayload) {
    return new Response(
      JSON.stringify({ error: 'Missing signedPayload' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Decode JWT payload (middle part)
  const parts = signedPayload.split('.')
  const payload = JSON.parse(atob(parts[1]))
  
  const notificationType = payload.notificationType
  const transactionInfo = payload.data?.signedTransactionInfo
  
  if (!transactionInfo) {
    console.log('No transaction info in notification')
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Decode transaction info
  const txParts = transactionInfo.split('.')
  const transaction = JSON.parse(atob(txParts[1]))
  
  const productId = transaction.productId
  const originalTransactionId = transaction.originalTransactionId
  const expiresDate = transaction.expiresDate ? new Date(transaction.expiresDate) : null

  console.log('Apple notification:', notificationType, productId, originalTransactionId)

  // Find user by transaction ID
  const { data: txRecord } = await supabase
    .from('purchase_transactions')
    .select('user_id')
    .eq('transaction_id', originalTransactionId)
    .single()

  if (!txRecord) {
    console.log('Transaction not found:', originalTransactionId)
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const userId = txRecord.user_id

  switch (notificationType) {
    case 'DID_RENEW':
    case 'SUBSCRIBED':
      // Subscription renewed or new subscription
      await supabase
        .from('users')
        .update({
          is_premium: true,
          premium_until: expiresDate?.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
      console.log('Subscription renewed for user:', userId)
      break

    case 'EXPIRED':
    case 'DID_FAIL_TO_RENEW':
      // Subscription expired or failed to renew
      await supabase
        .from('users')
        .update({
          is_premium: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
      console.log('Subscription expired for user:', userId)
      break

    case 'DID_CHANGE_RENEWAL_STATUS':
      // User turned off auto-renew (will expire at end of period)
      console.log('User changed renewal status:', userId)
      break

    case 'REFUND':
      // Refund issued - revoke premium
      await supabase
        .from('users')
        .update({
          is_premium: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
      console.log('Refund processed for user:', userId)
      break

    default:
      console.log('Unhandled notification type:', notificationType)
  }

  // Log the webhook event
  await supabase
    .from('webhook_events')
    .insert({
      platform: 'apple',
      event_type: notificationType,
      user_id: userId,
      payload: payload,
      processed_at: new Date().toISOString(),
    })

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Google Play Real-time Developer Notifications
async function handleGoogleWebhook(req: Request, supabase: any) {
  const body = await req.json()
  
  // Google sends a Pub/Sub message
  const message = body.message
  if (!message?.data) {
    return new Response(
      JSON.stringify({ error: 'Missing message data' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Decode base64 data
  const data = JSON.parse(atob(message.data))
  const subscriptionNotification = data.subscriptionNotification

  if (!subscriptionNotification) {
    console.log('Not a subscription notification')
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const notificationType = subscriptionNotification.notificationType
  const purchaseToken = subscriptionNotification.purchaseToken
  const subscriptionId = subscriptionNotification.subscriptionId

  console.log('Google notification:', notificationType, subscriptionId)

  // Find user by purchase token
  const { data: txRecord } = await supabase
    .from('purchase_transactions')
    .select('user_id')
    .eq('transaction_id', purchaseToken)
    .single()

  if (!txRecord) {
    console.log('Purchase token not found:', purchaseToken)
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const userId = txRecord.user_id

  // Google notification types:
  // 1 = RECOVERED, 2 = RENEWED, 3 = CANCELED, 4 = PURCHASED
  // 5 = ON_HOLD, 6 = IN_GRACE_PERIOD, 7 = RESTARTED
  // 12 = REVOKED, 13 = EXPIRED

  switch (notificationType) {
    case 1: // RECOVERED
    case 2: // RENEWED
    case 4: // PURCHASED
    case 7: // RESTARTED
      await supabase
        .from('users')
        .update({
          is_premium: true,
          premium_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
      console.log('Subscription active for user:', userId)
      break

    case 3:  // CANCELED
    case 12: // REVOKED
    case 13: // EXPIRED
      await supabase
        .from('users')
        .update({
          is_premium: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
      console.log('Subscription ended for user:', userId)
      break

    case 5: // ON_HOLD
    case 6: // IN_GRACE_PERIOD
      // Keep premium but log the issue
      console.log('Subscription payment issue for user:', userId)
      break

    default:
      console.log('Unhandled notification type:', notificationType)
  }

  // Log the webhook event
  await supabase
    .from('webhook_events')
    .insert({
      platform: 'google',
      event_type: String(notificationType),
      user_id: userId,
      payload: data,
      processed_at: new Date().toISOString(),
    })

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
