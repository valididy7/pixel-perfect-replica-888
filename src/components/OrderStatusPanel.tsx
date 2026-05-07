import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Trash2, Save, Package } from "lucide-react";

interface Props {
  adId: string;
}

interface OrderStatusRow {
  ad_id: string;
  product_image_url: string | null;
  product_title: string | null;
  product_price: string | null;
  order_number: string | null;
  order_date: string | null;
  pickup_code: string | null;
  delivery_address: any | null;
  delivery_address_session_id: string | null;
  updated_at: string;
}

export function OrderStatusPanel({ adId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [pickupCode, setPickupCode] = useState("");
  const [address, setAddress] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("ad_order_status" as any)
        .select("*")
        .eq("ad_id", adId)
        .maybeSingle();
      if (cancelled) return;
      const row = (data as unknown) as OrderStatusRow | null;
      if (row) {
        setImageUrl(row.product_image_url || "");
        setTitle(row.product_title || "");
        setPrice(row.product_price || "");
        setOrderNumber(row.order_number || "");
        setOrderDate(row.order_date || "");
        setPickupCode(row.pickup_code || "");
        setAddress(row.delivery_address || null);
      }
      setLoading(false);
    })();

    const ch = supabase
      .channel(`order-status-${adId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ad_order_status", filter: `ad_id=eq.${adId}` },
        (payload) => {
          const row = payload.new as OrderStatusRow | undefined;
          if (row) setAddress(row.delivery_address || null);
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      void ch.unsubscribe();
    };
  }, [adId]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("ad_order_status" as any).upsert({
      ad_id: adId,
      product_image_url: imageUrl || null,
      product_title: title || null,
      product_price: price || null,
      order_number: orderNumber || null,
      order_date: orderDate || null,
      pickup_code: pickupCode || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar", { description: error.message });
    } else {
      toast.success("Configuração salva");
    }
  };

  const clearAddress = async () => {
    const { error } = await supabase
      .from("ad_order_status" as any)
      .update({ delivery_address: null, delivery_address_session_id: null })
      .eq("ad_id", adId);
    if (error) {
      toast.error("Erro ao limpar", { description: error.message });
      return;
    }
    setAddress(null);
    toast.success("Endereço limpo");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando configuração do pedido...
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4">
      <header className="flex items-center gap-2">
        <Package className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Status do pedido (tela motorista)</h3>
      </header>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">URL da imagem do produto</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          {imageUrl && (
            <img src={imageUrl} alt="" className="mt-1 h-16 w-16 rounded object-cover" />
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Título do produto</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="PlayStation 5 Slim · Edição Digital"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Valor (total)</label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="R$ 2.350,00"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Nº do pedido</label>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="6985866921454226215"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Data do pedido</label>
            <input
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              placeholder="Hoje · 20h32"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Código de coleta (vazio = "—")</label>
          <input
            value={pickupCode}
            onChange={(e) => setPickupCode(e.target.value)}
            placeholder="Deixe vazio para mostrar —"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar configuração
        </Button>
      </div>

      <div className="space-y-2 border-t pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Endereço de coleta enviado
        </h4>
        {address ? (
          <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
            {address.cep && <p><strong>CEP:</strong> {address.cep}</p>}
            {address.rua && <p><strong>Rua:</strong> {address.rua}, {address.numero || "s/n"}</p>}
            {address.complemento && <p><strong>Complemento:</strong> {address.complemento}</p>}
            {address.referencia && <p><strong>Ponto de referência:</strong> {address.referencia}</p>}
            {(address.bairro || address.cidade) && (
              <p><strong>Bairro/Cidade:</strong> {address.bairro || "—"} · {address.cidade || "—"}/{address.uf || "—"}</p>
            )}
            <Button onClick={clearAddress} variant="destructive" size="sm" className="mt-2">
              <Trash2 className="h-3 w-3" /> Limpar endereço
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhum endereço enviado ainda.</p>
        )}
      </div>
    </section>
  );
}