import { supabase } from "@/integrations/supabase/client";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || "anuncio";
}

function randomSuffix(len = 4) {
  return Math.random().toString(36).slice(2, 2 + len);
}

export async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${randomSuffix()}`;
    const { data, error } = await supabase
      .from("ads")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}
