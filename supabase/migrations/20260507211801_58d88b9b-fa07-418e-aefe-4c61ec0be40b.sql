UPDATE public.ad_screens
SET edited_html = regexp_replace(edited_html, 'Motorista encontrado', 'Parceiro encontrado', 'gi'),
    original_html = regexp_replace(original_html, 'Motorista encontrado', 'Parceiro encontrado', 'gi')
WHERE id = '7a4dbc0c-d0c5-42cd-a728-a7ef8883bda4';