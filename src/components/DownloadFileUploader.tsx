import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, FileDown } from "lucide-react";
import { toast } from "sonner";

const MAX_BYTES = 1024 * 1024 * 1024; // 1GB

interface Props {
  adId: string;
  currentUrl: string;
  onUploaded: (url: string) => void;
}

function fileNameFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    return decodeURIComponent(parts[parts.length - 1] || "");
  } catch {
    return null;
  }
}

function isOurUpload(url: string): boolean {
  return /\/storage\/v1\/object\/public\/ad-downloads\//.test(url || "");
}

export function DownloadFileUploader({ adId, currentUrl, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadedName = isOurUpload(currentUrl) ? fileNameFromUrl(currentUrl) : null;

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error("Arquivo maior que 1GB. Reduz ou hospeda em outro lugar.");
      return;
    }
    setUploading(true);
    setProgress(0);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${adId}/${Date.now()}-${safeName}`;
    try {
      const { error } = await supabase.storage
        .from("ad-downloads")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "application/octet-stream",
        });
      if (error) throw error;
      const { data } = supabase.storage.from("ad-downloads").getPublicUrl(path);
      onUploaded(data.publicUrl);
      setProgress(100);
      toast.success("Arquivo enviado!");
    } catch (e: any) {
      toast.error(e?.message || "Falha no upload");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!uploadedName) return;
    try {
      const url = new URL(currentUrl);
      const idx = url.pathname.indexOf("/ad-downloads/");
      if (idx >= 0) {
        const objectPath = url.pathname.slice(idx + "/ad-downloads/".length);
        await supabase.storage.from("ad-downloads").remove([decodeURIComponent(objectPath)]);
      }
    } catch {
      /* ignore */
    }
    onUploaded("");
    toast.success("Arquivo removido");
  };

  return (
    <div className="mt-3">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {uploadedName ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-2">
          <FileDown className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1 truncate text-xs">{uploadedName}</span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={handleRemove}
            disabled={uploading}
            aria-label="Remover arquivo"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePick}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Enviando... {progress > 0 ? `${progress}%` : ""}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-3.5 w-3.5" />
              Subir arquivo (APK, ZIP, até 1GB)
            </>
          )}
        </Button>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">
        O link gerado vai pro campo acima automaticamente. APK instala direto no Android; ZIP o usuário precisa extrair.
      </p>
    </div>
  );
}
