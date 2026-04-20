import { AdField } from "@/types/ad";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface FieldEditorProps {
  fields: AdField[];
  onChange: (id: string, value: string) => void;
  imageUrls: string[];
  onImageChange: (index: number, value: string) => void;
}

export function FieldEditor({ fields, onChange, imageUrls, onImageChange }: FieldEditorProps) {
  const grouped: Record<string, AdField[]> = {};
  for (const f of fields) {
    (grouped[f.category] ??= []).push(f);
  }

  const categoryLabel: Record<string, string> = {
    info: "Informações principais",
    description: "Descrição",
    seller: "Vendedor",
    other: "Outros campos",
  };

  if (!fields.length && !imageUrls.length) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Não conseguimos detectar campos editáveis automaticamente nesta página.
        Você ainda pode visualizar e publicar o clone.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([cat, list]) => (
        <section key={cat}>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {categoryLabel[cat] || cat}
            </h3>
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{list.length}</Badge>
          </div>
          <div className="space-y-4">
            {list.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <Label htmlFor={`f-${field.id}`} className="text-xs">{field.label}</Label>
                {field.multiline ? (
                  <Textarea
                    id={`f-${field.id}`}
                    value={field.value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                ) : (
                  <Input
                    id={`f-${field.id}`}
                    value={field.value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {imageUrls.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Imagens</h3>
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{imageUrls.length}</Badge>
          </div>
          <div className="space-y-3">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-2">
                <img src={url} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
                <Input
                  value={url}
                  onChange={(e) => onImageChange(idx, e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
