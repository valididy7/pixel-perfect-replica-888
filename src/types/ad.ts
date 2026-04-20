export type AdStatus = "draft" | "active" | "archived";

export interface Ad {
  id: string;
  owner_id: string;
  title: string;
  price: string | null;
  slug: string;
  status: AdStatus;
  original_html: string | null;
  edited_html: string | null;
  thumbnail_url: string | null;
  source_url: string | null;
  view_count: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdField {
  id: string;
  label: string;
  value: string;
  selector: string;
  category: "info" | "description" | "seller" | "other";
  multiline?: boolean;
}

export interface ParseResult {
  fields: AdField[];
  imageUrls: string[];
}
