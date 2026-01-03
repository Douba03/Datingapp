// Supabase Edge Function for Apple/Google Receipt Validation
// This validates purchases server-side to prevent fraud

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Apple App Store endpoints
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt'
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt'

// Google Play API endpoint
const GOOGLE_PLAY_API = 'https://androidpublisher.googleapis.com/androidpublisher/v3'

interface ValidateRequest {
  platform: 'ios' | 'android'
  receipt: string // Base64 encoded receipt for iOS, purchase token for Android
  productId: string
  userId: string
}

interface AppleReceiptResponse {
  status: number
  receipt?: {
    in_app: Array<{
      product_id: string
      purchase_date_ms: string
      expires_date_ms?: string
      transaction_id: string
    }>
  }
  latest_receipt_info?: Array<{
    product_id: string
    purchase_date_ms: string
    expires_date_ms?: string
    transaction_id: string
  }>
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { platform, receipt, productId, userId }: ValidateRequest = await req.json()

    if (!platform || !receipt || !productId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let isValid = false
    let expiresAt: Date | null = null
    let transactionId: string | null = null

    if (platform === 'ios') {
      // Validate with Apple
      const result = await validateAppleReceipt(receipt, productId)
      isValid = result.isValid
      expiresAt = result.expiresAt
      transactionId = result.transactionId
    } else if (platform === 'android') {
      // Validate with Google
      const result = await validateGoogleReceipt(receipt, productId)
      isValid = result.isValid
      expiresAt = result.expiresAt
      transactionId = result.transactionId
    }

    if (isValid) {
      // Update user premium status in database
      const premiumUntil = expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_premium: true,
          premium_until: premiumUntil.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating user:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update user status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Log the transaction
      await supabase
        .from('purchase_transactions')
        .insert({
          user_id: userId,
          platform,
          product_id: productId,
          transaction_id: transactionId,
          expires_at: premiumUntil.toISOString(),
          validated_at: new Date().toISOString(),
        })
        .single()

      return new Response(
        JSON.stringify({ 
          success: true, 
          isPremium: true,
          expiresAt: premiumUntil.toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid receipt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Validation error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function validateAppleReceipt(receipt: string, productId: string): Promise<{
  isValid: boolean
  expiresAt: Date | null
  transactionId: string | null
}> {
  const sharedSecret = Deno.env.get('APPLE_SHARED_SECRET') || ''
  
  const payload = {
    'receipt-data': receipt,
    'password': sharedSecret,
    'exclude-old-transactions': true,
  }

  // Try production first
  let response = await fetch(APPLE_PRODUCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  let data: AppleReceiptResponse = await response.json()

  // Status 21007 means it's a sandbox receipt - retry with sandbox URL
  if (data.status === 21007) {
    response = await fetch(APPLE_SANDBOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    data = await response.json()
  }

  // Status 0 means valid
  if (data.status !== 0) {
    console.error('Apple receipt validation failed:', data.status)
    return { isValid: false, expiresAt: null, transactionId: null }
  }

  // Find the matching product in receipt
  const purchases = data.latest_receipt_info || data.receipt?.in_app || []
  const purchase = purchases.find(p => p.product_id === productId)

  if (!purchase) {
    console.error('Product not found in receipt')
    return { isValid: false, expiresAt: null, transactionId: null }
  }

  // Check if subscription is still active
  const expiresMs = purchase.expires_date_ms ? parseInt(purchase.expires_date_ms) : null
  const expiresAt = expiresMs ? new Date(expiresMs) : null
  
  if (expiresAt && expiresAt < new Date()) {
    console.log('Subscription expired')
    return { isValid: false, expiresAt, transactionId: purchase.transaction_id }
  }

  return {
    isValid: true,
    expiresAt,
    transactionId: purchase.transaction_id,
  }
}

async function validateGoogleReceipt(purchaseToken: string, productId: string): Promise<{
  isValid: boolean
  expiresAt: Date | null
  transactionId: string | null
}> {
  const packageName = Deno.env.get('ANDROID_PACKAGE_NAME') || 'com.qossai.malimatch'
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')
  
  if (!serviceAccountKey) {
    console.error('Google service account key not configured')
    return { isValid: false, expiresAt: null, transactionId: null }
  }

  try {
    // Parse service account key
    const credentials = JSON.parse(serviceAccountKey)
    
    // Get access token using service account
    const accessToken = await getGoogleAccessToken(credentials)
    
    // Verify subscription with Google Play
    const url = `${GOOGLE_PLAY_API}/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      console.error('Google Play API error:', await response.text())
      return { isValid: false, expiresAt: null, transactionId: null }
    }

    const data = await response.json()
    
    // Check subscription state
    // 0 = payment pending, 1 = payment received, 2 = free trial, 3 = pending deferred upgrade/downgrade
    const isActive = data.paymentState === 1 || data.paymentState === 2
    const expiresAt = data.expiryTimeMillis ? new Date(parseInt(data.expiryTimeMillis)) : null
    
    if (expiresAt && expiresAt < new Date()) {
      return { isValid: false, expiresAt, transactionId: data.orderId }
    }

    return {
      isValid: isActive,
      expiresAt,
      transactionId: data.orderId,
    }
  } catch (error) {
    console.error('Google validation error:', error)
    return { isValid: false, expiresAt: null, transactionId: null }
  }
}

async function getGoogleAccessToken(credentials: any): Promise<string> {
  // Create JWT for Google OAuth
  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const claim = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  // Encode JWT (simplified - in production use a proper JWT library)
  const encoder = new TextEncoder()
  const headerB64 = btoa(JSON.stringify(header))
  const claimB64 = btoa(JSON.stringify(claim))
  const signatureInput = `${headerB64}.${claimB64}`
  
  // Sign with private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToBinary(credentials.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(signatureInput)
  )
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
  const jwt = `${signatureInput}.${signatureB64}`

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

function pemToBinary(pem: string): ArrayBuffer {
  const base64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
