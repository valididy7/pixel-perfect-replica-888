import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Trash2, Save, Package, Send, Bike, AlertCircle, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { playDing, showSystemNotification, ensureNotificationPermission } from "@/lib/notify";

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
  updated_at: string;
}

interface SessionOrderRow {
  ad_id: string;
  session_id: string;
  delivery_address: any | null;
  driver_requested_at: string | null;
  driver_photo_url: string | null;
  driver_name: string | null;
  driver_plate: string | null;
  driver_vehicle: string | null;
  driver_color: string | null;
  driver_rating: string | null;
  driver_rides: string | null;
  driver_eta: string | null;
  driver_dispatched_at: string | null;
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
  const [sessions, setSessions] = useState<SessionOrderRow[]>([]);
  const knownRequestKeysRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: prod } = await supabase
        .from("ad_order_status" as any)
        .select("*")
        .eq("ad_id", adId)
        .maybeSingle();
      if (cancelled) return;
      const row = (prod as unknown) as OrderStatusRow | null;
      if (row) {
        setImageUrl(row.product_image_url || "");
        setTitle(row.product_title || "");
        setPrice(row.product_price || "");
        setOrderNumber(row.order_number || "");
        setOrderDate(row.order_date || "");
        setPickupCode(row.pickup_code || "");
      }

      const { data: sess } = await supabase
        .from("ad_session_orders" as any)
        .select("*")
        .eq("ad_id", adId)
        .order("updated_at", { ascending: false });
      if (cancelled) return;
      const rows = ((sess as unknown) as SessionOrderRow[]) || [];
      // Baseline: marca as solicitações já existentes pra não tocar som no carregamento.
      rows.forEach((r) => {
        if (r.driver_requested_at) knownRequestKeysRef.current.add(`${r.session_id}:${r.driver_requested_at}`);
      });
      setSessions(rows);
      initializedRef.current = true;
      setLoading(false);
    })();

    const ch = supabase
      .channel(`session-orders-admin-${adId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ad_session_orders", filter: `ad_id=eq.${adId}` },
        (payload) => {
          const row = (payload.new || payload.old) as SessionOrderRow | undefined;
          if (!row) return;
          if (payload.eventType === "DELETE") {
            setSessions((prev) => prev.filter((r) => r.session_id !== row.session_id));
            return;
          }
          const newRow = payload.new as SessionOrderRow;
          setSessions((prev) => {
            const without = prev.filter((r) => r.session_id !== newRow.session_id);
            return [newRow, ...without];
          });
          // Detecta nova solicitação de motorista (driver_requested_at virou novo
          // valor e ainda não foi despachado) → toca alerta.
          if (newRow.driver_requested_at && !newRow.driver_dispatched_at) {
            const key = `${newRow.session_id}:${newRow.driver_requested_at}`;
            if (!knownRequestKeysRef.current.has(key) && initializedRef.current) {
              knownRequestKeysRef.current.add(key);
              playDing();
              showSystemNotification("Atenção: cliente solicitando motorista!", "Uma vítima clicou em 'Solicitar motorista'");
              toast.warning("Cliente solicitando motorista!", {
                description: "Verifique a sessão e despache o motorista.",
              });
            } else {
              knownRequestKeysRef.current.add(key);
            }
          }
        },
      )
      .subscribe();

    void ensureNotificationPermission();

    return () => {
      cancelled = true;
      void ch.unsubscribe();
    };
  }, [adId]);

  const saveProduct = async () => {
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
      toast.success("Configuração do produto salva");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando configuração do pedido...
      </div>
    );
  }

  const pendingSessions = sessions.filter((s) => s.driver_requested_at && !s.driver_dispatched_at);
  const otherSessions = sessions.filter((s) => !(s.driver_requested_at && !s.driver_dispatched_at));

  return (
    <section className="space-y-4">
      {/* ===== A: Config do produto (igual pra todos) ===== */}
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <header className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Configuração do produto (igual pra todos)</h3>
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

        <Button onClick={saveProduct} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar configuração do produto
        </Button>
        </div>
      </div>

      {/* ===== B: Sessões pedindo motorista (alerta) ===== */}
      {pendingSessions.length > 0 && (
        <div className="space-y-3 rounded-lg border-2 border-orange-500/60 bg-orange-500/5 p-4 shadow-[0_0_0_4px_hsl(var(--primary)/0.05)]">
          <header className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 animate-pulse text-orange-500" />
            <h3 className="text-sm font-semibold text-orange-600">
              ATENÇÃO: {pendingSessions.length} cliente{pendingSessions.length > 1 ? "s" : ""} solicitando motorista!
            </h3>
          </header>
          {pendingSessions.map((s) => (
            <SessionDispatchCard key={s.session_id} adId={adId} session={s} highlight onRemoved={(sid) => setSessions((prev) => prev.filter((r) => r.session_id !== sid))} />
          ))}
        </div>
      )}

      {otherSessions.length > 0 && (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <header className="flex items-center gap-2">
            <Bike className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Outras sessões com endereço/motorista</h3>
          </header>
          {otherSessions.map((s) => (
            <SessionDispatchCard key={s.session_id} adId={adId} session={s} onRemoved={(sid) => setSessions((prev) => prev.filter((r) => r.session_id !== sid))} />
          ))}
        </div>
      )}

      {sessions.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-4 text-xs text-muted-foreground">
          Nenhuma sessão com endereço enviado ainda.
        </div>
      )}
    </section>
  );
}

function SessionDispatchCard({ adId, session, highlight, onRemoved }: { adId: string; session: SessionOrderRow; highlight?: boolean; onRemoved?: (sessionId: string) => void }) {
  const [open, setOpen] = useState(!!highlight);
  const [photo, setPhoto] = useState(session.driver_photo_url || "");
  const [name, setName] = useState(session.driver_name || "");
  const [plate, setPlate] = useState(session.driver_plate || "");
  const [vehicle, setVehicle] = useState(session.driver_vehicle || "");
  const [color, setColor] = useState(session.driver_color || "");
  const [rating, setRating] = useState(session.driver_rating || "");
  const [rides, setRides] = useState(session.driver_rides || "");
  const [eta, setEta] = useState(session.driver_eta || "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPhoto(session.driver_photo_url || "");
    setName(session.driver_name || "");
    setPlate(session.driver_plate || "");
    setVehicle(session.driver_vehicle || "");
    setColor(session.driver_color || "");
    setRating(session.driver_rating || "");
    setRides(session.driver_rides || "");
    setEta(session.driver_eta || "");
  }, [session.session_id]);

  const dispatched = !!session.driver_dispatched_at;
  const requested = !!session.driver_requested_at;
  const addr = session.delivery_address as any;

  const dispatch = async () => {
    if (!name.trim()) {
      toast.error("Preencha pelo menos o nome do motorista");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("ad_session_orders" as any)
      .update({
        driver_photo_url: photo || null,
        driver_name: name || null,
        driver_plate: plate || null,
        driver_vehicle: vehicle || null,
        driver_color: color || null,
        driver_rating: rating || null,
        driver_rides: rides || null,
        driver_eta: eta || null,
        driver_dispatched_at: new Date().toISOString(),
      })
      .eq("ad_id", adId)
      .eq("session_id", session.session_id);
    setBusy(false);
    if (error) toast.error("Erro ao despachar", { description: error.message });
    else toast.success("Motorista despachado! 🛵");
  };

  const reset = async () => {
    const { error } = await supabase
      .from("ad_session_orders" as any)
      .update({ driver_dispatched_at: null })
      .eq("ad_id", adId)
      .eq("session_id", session.session_id);
    if (error) toast.error("Erro ao resetar", { description: error.message });
    else toast.success("Status resetado");
  };

  const clearAddress = async () => {
    if (!confirm("Apagar endereço dessa sessão?")) return;
    // Otimista: some na hora da UI
    onRemoved?.(session.session_id);
    const { data, error } = await supabase
      .from("ad_session_orders" as any)
      .delete()
      .eq("ad_id", adId)
      .eq("session_id", session.session_id)
      .select();
    if (error) {
      toast.error("Erro ao limpar", { description: error.message });
      return;
    }
    const rows = (data as any[]) || [];
    if (rows.length === 0) {
      toast.error("Não foi possível apagar (RLS bloqueou). Faça login como dono do anúncio.");
      return;
    }
    toast.success("Sessão removida");
  };

  const shortSid = session.session_id.slice(-8);

  return (
    <div className={`rounded-md border p-3 text-sm ${highlight ? "border-orange-500/40 bg-background" : "border-border bg-muted/20"}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="text-xs font-mono text-muted-foreground">#{shortSid}</span>
          {requested && !dispatched && (
            <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-orange-600">Pedindo motorista</span>
          )}
          {dispatched && (
            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-green-600">Despachado</span>
          )}
          {addr && <span className="truncate text-xs text-muted-foreground">{(addr.rua || "")}, {(addr.numero || "")}</span>}
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {addr ? (
            <div className="space-y-1 rounded-md border border-border bg-card/50 p-2.5 text-xs">
              {addr.cep && <p><strong>CEP:</strong> {addr.cep}</p>}
              {addr.rua && <p><strong>Rua:</strong> {addr.rua}, {addr.numero || "s/n"}</p>}
              {addr.complemento && <p><strong>Complemento:</strong> {addr.complemento}</p>}
              {addr.referencia && <p><strong>Ponto de referência:</strong> {addr.referencia}</p>}
              {(addr.bairro || addr.cidade) && (
                <p><strong>Bairro/Cidade:</strong> {addr.bairro || "—"} · {addr.cidade || "—"}/{addr.uf || "—"}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Sem endereço.</p>
          )}

          <div className="space-y-2 border-t pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Motorista pra esta sessão</p>
            <input value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="URL da foto" className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="rounded-md border border-input bg-background px-3 py-2 text-xs" />
              <input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="Placa" className="rounded-md border border-input bg-background px-3 py-2 text-xs" />
              <input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Veículo" className="rounded-md border border-input bg-background px-3 py-2 text-xs" />
              <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Cor" className="rounded-md border border-input bg-background px-3 py-2 text-xs" />
              <input value={rating} onChange={(e) => setRating(e.target.value)} placeholder="★ 4.9" className="rounded-md border border-input bg-background px-3 py-2 text-xs" />
              <input value={rides} onChange={(e) => setRides(e.target.value)} placeholder="Corridas" className="rounded-md border border-input bg-background px-3 py-2 text-xs" />
              <input value={eta} onChange={(e) => setEta(e.target.value)} placeholder="ETA (8 min)" className="col-span-2 rounded-md border border-input bg-background px-3 py-2 text-xs" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={dispatch} disabled={busy} className="flex-1">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {dispatched ? "Atualizar despacho" : "Despachar (toca som na vítima)"}
              </Button>
              {dispatched && (
                <Button size="sm" variant="outline" onClick={reset}>Voltar pra procurando</Button>
              )}
              <Button size="sm" variant="ghost" onClick={clearAddress} title="Remover sessão">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}