import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdField } from "@/types/ad";
import { AdScreen, SCREEN_KIND_LABELS } from "@/types/screen";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Monitor, Save, Smartphone, Sparkles } from "lucide-react";
import { compressStoredHtml, decompressStoredHtml } from "@/lib/ad-html-storage";
import { parseAdHTML, rebuildHTMLWithEdits } from "@/lib/html-parser";
import { PreviewFrame } from "@/components/PreviewFrame";
import { FieldEditor } from "@/components/FieldEditor";
import { toast } from "sonner";
import { adminPath } from "@/lib/admin-route";

export default function ScreenEditorPage() {
  const { adId, screenId } = useParams<{ adId: string; screenId: string }>();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");
  const [fields, setFields] = useState<AdField[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [previewHtml, setPreviewHtml] = useState("");
  const [originalHtml, setOriginalHtml] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);

  const debounceRef = useRef<number | null>(null);
  const autoSaveRef = useRef<number | null>(null);

  const { data: screen, isLoading } = useQuery({
    queryKey: ["ad_screen", screenId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_screens")
        .select("*")
        .eq("id", screenId!)
        .single();
      if (error) throw error;
      return data as AdScreen;
    },
    enabled: !!screenId,
  });

  useEffect(() => {
    if (!screen) return;
    document.title = `${screen.title} — Tela vinculada`;
    const html = decompressStoredHtml(screen.edited_html || screen.original_html);
    setOriginalHtml(decompressStoredHtml(screen.original_html));
    setPreviewHtml(html);
    setTitle(screen.title);
    const parsed = parseAdHTML(html);
    setFields(parsed.fields);
    setImageUrls(parsed.imageUrls);
  }, [screen]);

  useEffect(() => {
    if (!originalHtml) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setPreviewHtml(rebuildHTMLWithEdits(originalHtml, fields, imageUrls));
    }, 300);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [fields, imageUrls, originalHtml]);

  const handleFieldChange = (fid: string, value: string) => {
    setFields((prev) => prev.map((f) => (f.id === fid ? { ...f, value } : f)));
    if (fid === "title") setTitle(value);
    setDirty(true);
  };
  const handleImageChange = (idx: number, value: string) => {
    setImageUrls((prev) => prev.map((u, i) => (i === idx ? value : u)));
    setDirty(true);
  };

  const handleSave = async (showToast = true) => {
    if (!screen || saving) return;
    setSaving(true);
    const html = rebuildHTMLWithEdits(originalHtml, fields, imageUrls);
    const { error } = await supabase
      .from("ad_screens")
      .update({
        title: title || screen.title,
        edited_html: compressStoredHtml(html),
      })
      .eq("id", screen.id);
    setSaving(false);
    if (error) { if (showToast) toast.error(error.message); return; }
    setSavedAt(new Date());
    setDirty(false);
    if (showToast) toast.success("Tela salva");
  };

  useEffect(() => {
    if (!dirty) return;
    if (autoSaveRef.current) window.clearTimeout(autoSaveRef.current);
    autoSaveRef.current = window.setTimeout(() => handleSave(false), 5000);
    return () => { if (autoSaveRef.current) window.clearTimeout(autoSaveRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, fields, imageUrls, title]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, imageUrls, title, originalHtml]);

  const savedLabel = useMemo(() => {
    if (saving) return "Salvando...";
    if (dirty) return "Edições não salvas";
    if (savedAt) return `Salvo às ${savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    return "";
  }, [saving, dirty, savedAt]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>;
  }

  if (!screen) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Tela não encontrada.</p>
        <Button onClick={() => navigate(adminPath(`/editor/${adId}`))} variant="secondary">Voltar ao editor</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" asChild>
            <Link to={adminPath(`/editor/${adId}`)}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-sm font-medium">{title || "Tela sem título"}</span>
          <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
            {SCREEN_KIND_LABELS[screen.kind] || screen.kind}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline font-mono-tabular">{savedLabel}</span>
          <div className="flex items-center rounded-md border border-border bg-card p-0.5">
            <Button size="sm" variant={mode === "mobile" ? "secondary" : "ghost"} className="h-7 w-7 p-0" onClick={() => setMode("mobile")} aria-label="Mobile"><Smartphone className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant={mode === "desktop" ? "secondary" : "ghost"} className="h-7 w-7 p-0" onClick={() => setMode("desktop")} aria-label="Desktop"><Monitor className="h-3.5 w-3.5" /></Button>
          </div>
          <Button size="sm" variant="secondary" onClick={() => handleSave(true)} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Salvar
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-full max-w-md shrink-0 overflow-y-auto border-r border-border bg-card/30 p-6 lg:w-[420px]">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Editar tela</h2>
            <p className="mt-1 text-xs text-muted-foreground">Mudanças aparecem em tempo real no preview.</p>
          </div>
          <FieldEditor fields={fields} onChange={handleFieldChange} imageUrls={imageUrls} onImageChange={handleImageChange} />
        </aside>

        <main className="relative flex-1 overflow-auto bg-gradient-subtle p-6">
          <div className="pointer-events-none absolute inset-0 bg-gradient-glow opacity-30" />
          <div
            className={`relative mx-auto rounded-xl border border-border bg-white shadow-elegant transition-all duration-300 ${
              mode === "mobile" ? "max-w-[420px]" : "max-w-full"
            }`}
            style={{ minHeight: "calc(100vh - 56px - 48px)" }}
          >
            <PreviewFrame html={previewHtml} mode={mode} className="block w-full rounded-xl bg-white" adId={adId} trackPresence={false} />
          </div>
        </main>
      </div>
    </div>
  );
}
