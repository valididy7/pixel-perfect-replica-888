import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Ad, AdField } from "@/types/ad";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Check,
  Code2,
  Globe,
  Loader2,
  Monitor,
  Save,
  Smartphone,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { compressStoredHtml, decompressStoredHtml } from "@/lib/ad-html-storage";
import { parseAdHTML, rebuildHTMLWithEdits } from "@/lib/html-parser";
import { applyDownloadUrl } from "@/lib/download-button";
import { PreviewFrame } from "@/components/PreviewFrame";
import { FieldEditor } from "@/components/FieldEditor";
import { ScreensPanel } from "@/components/ScreensPanel";
import { LeadsPanel } from "@/components/LeadsPanel";
import { toast } from "sonner";

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");
  const [fields, setFields] = useState<AdField[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [originalHtml, setOriginalHtml] = useState<string>("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const debounceRef = useRef<number | null>(null);
  const autoSaveRef = useRef<number | null>(null);

  const { data: ad, isLoading } = useQuery({
    queryKey: ["ad", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("ads").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Ad;
    },
    enabled: !!id,
  });

  // Inicializa estado quando o ad carrega
  useEffect(() => {
    if (!ad) return;
    document.title = `${ad.title} — Editor`;
    const html = decompressStoredHtml(ad.edited_html || ad.original_html);
    setOriginalHtml(decompressStoredHtml(ad.original_html));
    setPreviewHtml(html);
    setTitle(ad.title);
    setPrice(ad.price || "");
    setDownloadUrl(ad.download_url || "");
    const parsed = parseAdHTML(html);
    setFields(parsed.fields);
    setImageUrls(parsed.imageUrls);
  }, [ad]);

  // Debounced rebuild do preview
  useEffect(() => {
    if (!originalHtml) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      let html = rebuildHTMLWithEdits(originalHtml, fields, imageUrls);
      html = applyDownloadUrl(html, downloadUrl);
      setPreviewHtml(html);
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [fields, imageUrls, originalHtml, downloadUrl]);

  const handleFieldChange = (fid: string, value: string) => {
    setFields((prev) => prev.map((f) => (f.id === fid ? { ...f, value } : f)));
    if (fid === "title") setTitle(value);
    if (fid === "price") setPrice(value);
    setDirty(true);
  };

  const handleImageChange = (idx: number, value: string) => {
    setImageUrls((prev) => prev.map((u, i) => (i === idx ? value : u)));
    setDirty(true);
  };

  const handleSave = async (showToast = true) => {
    if (!ad || saving) return;
    setSaving(true);
    let html = rebuildHTMLWithEdits(originalHtml, fields, imageUrls);
    html = applyDownloadUrl(html, downloadUrl);
    const { error } = await supabase
      .from("ads")
      .update({
        title: title || ad.title,
        price: price || null,
        download_url: downloadUrl.trim() || null,
        edited_html: compressStoredHtml(html),
      })
      .eq("id", ad.id);
    setSaving(false);
    if (error) {
      if (showToast) toast.error(error.message);
      return;
    }
    setSavedAt(new Date());
    setDirty(false);
    if (showToast) toast.success("Alterações salvas");
  };

  // Auto-save 5s
  useEffect(() => {
    if (!dirty) return;
    if (autoSaveRef.current) window.clearTimeout(autoSaveRef.current);
    autoSaveRef.current = window.setTimeout(() => {
      handleSave(false);
    }, 5000);
    return () => {
      if (autoSaveRef.current) window.clearTimeout(autoSaveRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, fields, imageUrls, title, price, downloadUrl]);

  // Ctrl/Cmd+S
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
  }, [fields, imageUrls, title, price, originalHtml]);

  const handlePublish = async () => {
    if (!ad) return;
    setPublishing(true);
    await handleSave(false);
    const newStatus = ad.status === "active" ? "draft" : "active";
    const { error } = await supabase.from("ads").update({ status: newStatus }).eq("id", ad.id);
    setPublishing(false);
    if (error) return toast.error(error.message);
    toast.success(newStatus === "active" ? "Anúncio publicado!" : "Anúncio despublicado");
    if (newStatus === "active") {
      window.open(`/ad/${ad.slug}`, "_blank");
    }
    // refetch
    navigate(0);
  };

  const savedLabel = useMemo(() => {
    if (saving) return "Salvando...";
    if (dirty) return "Edições não salvas";
    if (savedAt) {
      return `Salvo às ${savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return "";
  }, [saving, dirty, savedAt]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Anúncio não encontrado.</p>
        <Button asChild variant="secondary"><Link to="/">Voltar ao dashboard</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Toolbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-sm font-medium">{title || "Sem título"}</span>
          {ad.status === "active" && (
            <Badge className="border-0 bg-success text-success-foreground">Publicado</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline font-mono-tabular">
            {savedLabel}
          </span>

          <div className="flex items-center rounded-md border border-border bg-card p-0.5">
            <Button
              size="sm"
              variant={mode === "mobile" ? "secondary" : "ghost"}
              className="h-7 w-7 p-0"
              onClick={() => setMode("mobile")}
              aria-label="Visualização mobile"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant={mode === "desktop" ? "secondary" : "ghost"}
              className="h-7 w-7 p-0"
              onClick={() => setMode("desktop")}
              aria-label="Visualização desktop"
            >
              <Monitor className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(previewHtml || "");
                toast.success("HTML copiado!");
              } catch {
                toast.error("Falha ao copiar");
              }
            }}
            disabled={!previewHtml}
            title="Copiar código-fonte HTML do clone"
          >
            <Code2 className="mr-1.5 h-3.5 w-3.5" />
            Copiar HTML
          </Button>

          <Button size="sm" variant="secondary" onClick={() => handleSave(true)} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Salvar
          </Button>

          <Button size="sm" onClick={handlePublish} disabled={publishing} className="bg-gradient-primary hover:opacity-90 shadow-glow">
            {publishing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : ad.status === "active" ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Globe className="mr-1.5 h-3.5 w-3.5" />}
            {ad.status === "active" ? "Despublicar" : "Publicar"}
          </Button>

          {ad.status === "active" && (
            <Button size="sm" variant="ghost" asChild>
              <a href={`/ad/${ad.slug}`} target="_blank" rel="noopener noreferrer" aria-label="Abrir página pública">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </header>

      {/* Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Form */}
        <aside className="w-full max-w-md shrink-0 overflow-y-auto border-r border-border bg-card/30 p-6 lg:w-[420px]">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Editar campos</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Mudanças aparecem em tempo real no preview.
            </p>
          </div>

          <div className="mb-6 rounded-lg border border-border bg-card p-4">
            <Label htmlFor="download-url" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              URL de download
            </Label>
            <Input
              id="download-url"
              type="url"
              placeholder="https://exemplo.com/app.apk"
              value={downloadUrl}
              onChange={(e) => {
                setDownloadUrl(e.target.value);
                setDirty(true);
              }}
              className="mt-2"
            />
            <p className="mt-2 text-[11px] text-muted-foreground">
              Cole o link do APK / ZIP. Botões com texto "Baixar", "Download" ou "Instalar" no anúncio vão apontar pra esse link.
            </p>
          </div>

          <FieldEditor
            fields={fields}
            onChange={handleFieldChange}
            imageUrls={imageUrls}
            onImageChange={handleImageChange}
          />

          <ScreensPanel adId={ad.id} />

          <LeadsPanel adId={ad.id} />
        </aside>

        {/* Preview */}
        <main className="relative flex-1 overflow-auto bg-gradient-subtle p-6">
          <div className="pointer-events-none absolute inset-0 bg-gradient-glow opacity-30" />
          <div
            className={`relative mx-auto rounded-xl border border-border bg-white shadow-elegant transition-all duration-300 ${
              mode === "mobile" ? "max-w-[420px]" : "max-w-full"
            }`}
            style={{ minHeight: "calc(100vh - 56px - 48px)" }}
          >
            <PreviewFrame
              html={previewHtml}
              mode={mode}
              className="block w-full rounded-xl bg-white"
              adId={ad.id}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
