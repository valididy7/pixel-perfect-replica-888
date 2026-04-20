import { corsHeaders } from '@supabase/supabase-js/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fcRes = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['rawHtml'],
        onlyMainContent: false,
        waitFor: 1500,
      }),
    });

    const data = await fcRes.json();
    if (!fcRes.ok) {
      console.error('Firecrawl error:', data);
      return new Response(JSON.stringify({ error: data?.error || 'firecrawl failed' }), {
        status: fcRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html: string =
      data?.data?.rawHtml || data?.rawHtml || data?.data?.html || data?.html || '';

    // Injeta <base> para resolver assets relativos
    let finalHtml = html;
    if (html && !/<base\s/i.test(html)) {
      const origin = new URL(url).origin;
      finalHtml = html.replace(/<head[^>]*>/i, (m) => `${m}\n<base href="${origin}/">`);
    }

    return new Response(JSON.stringify({ html: finalHtml, sourceUrl: url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('scrape-url error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
