import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SENDER_DOMAIN = 'notify.validacao-de-compra-olx.shop'
const FROM_NAME = 'OLX'
const FROM_ADDRESS = `noreply@${SENDER_DOMAIN}`

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function injectTracking(html: string, campaignId: string, trackBase: string): string {
  // Reescreve <a href="..."> pra passar pelo redirect de tracking
  let out = html.replace(/<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi, (match, pre, href, post) => {
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return match
    }
    const tracked = `${trackBase}/click?c=${campaignId}&u=${encodeURIComponent(href)}`
    return `<a ${pre}href="${tracked}"${post}>`
  })

  // Adiciona pixel de tracking de abertura no final do body
  const pixel = `<img src="${trackBase}/open?c=${campaignId}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0" />`
  if (/<\/body>/i.test(out)) {
    out = out.replace(/<\/body>/i, `${pixel}</body>`)
  } else {
    out += pixel
  }
  return out
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')

  if (!lovableApiKey) {
    return jsonResponse({ error: 'Email gateway not configured' }, 500)
  }

  // Autentica o usuário do painel
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ error: 'Missing auth' }, 401)

  const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userError } = await supabaseAuth.auth.getUser()
  if (userError || !userData.user) return jsonResponse({ error: 'Unauthorized' }, 401)

  const userId = userData.user.id

  let body: {
    recipientEmail: string
    subject: string
    html: string
    previewText?: string
    spamScore?: number
    spamWarnings?: unknown
    adId?: string | null
  }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400)
  }

  if (!body.recipientEmail || !body.subject || !body.html) {
    return jsonResponse({ error: 'recipientEmail, subject and html are required' }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Cria a campanha com status pending
  const { data: campaign, error: insertError } = await supabase
    .from('email_campaigns')
    .insert({
      owner_id: userId,
      ad_id: body.adId ?? null,
      recipient_email: body.recipientEmail,
      subject: body.subject,
      html: body.html,
      preview_text: body.previewText ?? null,
      spam_score: body.spamScore ?? null,
      spam_warnings: body.spamWarnings ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (insertError || !campaign) {
    return jsonResponse({ error: insertError?.message ?? 'Failed to create campaign' }, 500)
  }

  // Base URL pro tracking
  const trackBase = `${supabaseUrl}/functions/v1/email-track`
  const finalHtml = injectTracking(body.html, campaign.id, trackBase)

  // Envia via Lovable Email Gateway
  const sendUrl = 'https://api.lovable.app/v1/email/send'
  const sendRes = await fetch(sendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${lovableApiKey}`,
    },
    body: JSON.stringify({
      sender_domain: SENDER_DOMAIN,
      from: `${FROM_NAME} <${FROM_ADDRESS}>`,
      to: body.recipientEmail,
      subject: body.subject,
      html: finalHtml,
      purpose: 'transactional',
      idempotency_key: `custom-${campaign.id}`,
    }),
  })

  if (!sendRes.ok) {
    const errText = await sendRes.text()
    await supabase
      .from('email_campaigns')
      .update({ status: 'failed', send_error: errText.slice(0, 500) })
      .eq('id', campaign.id)
    return jsonResponse({ error: 'Send failed', details: errText, campaignId: campaign.id }, 502)
  }

  await supabase
    .from('email_campaigns')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', campaign.id)

  return jsonResponse({ success: true, campaignId: campaign.id })
})