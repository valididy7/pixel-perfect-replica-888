import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_NAME = 'OLX'
const SENDER_DOMAIN = 'notify.validacao-de-compra-olx.shop'
const FROM_DOMAIN = 'validacao-de-compra-olx.shop'

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

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Autentica o usuário do painel
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ error: 'Missing auth' }, 401)

  const supabaseAuth = createClient(supabaseUrl, anonKey, {
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

  const normalizedEmail = body.recipientEmail.trim().toLowerCase()
  const { data: suppressed, error: suppressionError } = await supabase
    .from('suppressed_emails')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (suppressionError) {
    await supabase
      .from('email_campaigns')
      .update({ status: 'failed', send_error: 'Falha ao verificar bloqueio do destinatário' })
      .eq('id', campaign.id)
    return jsonResponse({ error: 'Failed to verify suppression status', campaignId: campaign.id }, 500)
  }

  if (suppressed) {
    await supabase
      .from('email_campaigns')
      .update({ status: 'failed', send_error: 'Este destinatário está bloqueado para recebimento' })
      .eq('id', campaign.id)
    await supabase.from('email_send_log').insert({
      message_id: campaign.id,
      template_name: 'custom-email',
      recipient_email: normalizedEmail,
      status: 'suppressed',
      error_message: 'Recipient is suppressed',
    })
    return jsonResponse({ error: 'Recipient is suppressed', campaignId: campaign.id }, 200)
  }

  let unsubscribeToken: string
  const { data: existingToken, error: tokenLookupError } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (tokenLookupError) {
    await supabase
      .from('email_campaigns')
      .update({ status: 'failed', send_error: 'Falha ao preparar cancelamento de inscrição' })
      .eq('id', campaign.id)
    return jsonResponse({ error: 'Failed to prepare email', campaignId: campaign.id }, 500)
  }

  if (existingToken && !existingToken.used_at) {
    unsubscribeToken = existingToken.token
  } else if (!existingToken) {
    unsubscribeToken = generateToken()
    const { error: tokenError } = await supabase
      .from('email_unsubscribe_tokens')
      .upsert({ token: unsubscribeToken, email: normalizedEmail }, { onConflict: 'email', ignoreDuplicates: true })

    if (tokenError) {
      await supabase
        .from('email_campaigns')
        .update({ status: 'failed', send_error: 'Falha ao criar token de cancelamento' })
        .eq('id', campaign.id)
      return jsonResponse({ error: 'Failed to prepare email', campaignId: campaign.id }, 500)
    }

    const { data: storedToken, error: storedTokenError } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (storedTokenError || !storedToken) {
      await supabase
        .from('email_campaigns')
        .update({ status: 'failed', send_error: 'Falha ao confirmar token de cancelamento' })
        .eq('id', campaign.id)
      return jsonResponse({ error: 'Failed to prepare email', campaignId: campaign.id }, 500)
    }

    unsubscribeToken = storedToken.token
  } else {
    await supabase
      .from('email_campaigns')
      .update({ status: 'failed', send_error: 'Destinatário cancelou inscrição anteriormente' })
      .eq('id', campaign.id)
    return jsonResponse({ error: 'Recipient is suppressed', campaignId: campaign.id }, 200)
  }

  await supabase.from('email_send_log').insert({
    message_id: campaign.id,
    template_name: 'custom-email',
    recipient_email: normalizedEmail,
    status: 'pending',
  })

  const { error: enqueueError } = await supabase.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: campaign.id,
      to: normalizedEmail,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: body.subject,
      html: finalHtml,
      text: htmlToText(finalHtml),
      purpose: 'transactional',
      label: 'custom-email',
      idempotency_key: `custom-${campaign.id}`,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    await supabase
      .from('email_campaigns')
      .update({ status: 'failed', send_error: 'Falha ao colocar e-mail na fila' })
      .eq('id', campaign.id)
    await supabase.from('email_send_log').insert({
      message_id: campaign.id,
      template_name: 'custom-email',
      recipient_email: normalizedEmail,
      status: 'failed',
      error_message: 'Failed to enqueue email',
    })
    return jsonResponse({ error: 'Failed to enqueue email', campaignId: campaign.id }, 500)
  }

  return jsonResponse({ success: true, queued: true, campaignId: campaign.id })
})