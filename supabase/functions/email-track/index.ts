import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// 1x1 GIF transparente
const PIXEL = Uint8Array.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
  0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
  0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
  0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
])

const PIXEL_HEADERS = {
  'Content-Type': 'image/gif',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const path = url.pathname.split('/').pop() || ''
  const campaignId = url.searchParams.get('c')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const ua = req.headers.get('user-agent') || null
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    null

  if (path === 'open' && campaignId) {
    await supabase.from('email_events').insert({
      campaign_id: campaignId,
      event_type: 'open',
      user_agent: ua,
      ip,
    })
    return new Response(PIXEL, { status: 200, headers: PIXEL_HEADERS })
  }

  if (path === 'click' && campaignId) {
    const target = url.searchParams.get('u') || '/'
    await supabase.from('email_events').insert({
      campaign_id: campaignId,
      event_type: 'click',
      url: target,
      user_agent: ua,
      ip,
    })
    return new Response(null, {
      status: 302,
      headers: { Location: target, 'Cache-Control': 'no-store' },
    })
  }

  return new Response('Not found', { status: 404 })
})