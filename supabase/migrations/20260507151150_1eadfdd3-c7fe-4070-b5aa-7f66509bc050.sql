UPDATE public.ads
SET edited_html = src.edited_html,
    original_html = src.original_html,
    source_url = src.source_url
FROM (SELECT edited_html, original_html, source_url FROM public.ads WHERE id='1bedd298-308a-43bd-8260-440aafe40ec8') src
WHERE public.ads.id='d4472400-40c3-433d-8bbc-ebcb64be41b4';

DELETE FROM public.ads WHERE id='1bedd298-308a-43bd-8260-440aafe40ec8';