import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Trash2, Save, Package, Send, Bike, AlertCircle, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { playDing, showSystemNotification, ensureNotificationPermission } from "@/lib/notify";
import { LiveSessionsPanel } from "@/components/LiveSessionsPanel";

// ===== Helpers de auto-formatação =====
// Preço: digite só números (em centavos) — formata como "R$ 2.350,00"
function formatPriceBR(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  const num = Number(digits) / 100;
  return "R$ " + num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
// Data/hora do pedido: digite só números — formata como "DD/MM HH:MM"
function formatDateTimeBR(raw: string): string {
  const d = (raw || "").replace(/\D/g, "").slice(0, 8);
  let out = "";
  if (d.length > 0) out += d.slice(0, 2);
  if (d.length >= 3) out += "/" + d.slice(2, 4);
  if (d.length >= 5) out += " " + d.slice(4, 6);
  if (d.length >= 7) out += ":" + d.slice(6, 8);
  return out;
}
// Data/hora atual no formato "DD/MM HH:MM" (fuso local)
function nowDateTimeBR(): string {
  const n = new Date();
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${pad(n.getDate())}/${pad(n.getMonth() + 1)} ${pad(n.getHours())}:${pad(n.getMinutes())}`;
}
// ETA: digite só o número de minutos — vira "8 min"
function formatEta(raw: string): string {
  const n = (raw || "").replace(/\D/g, "").slice(0, 3);
  if (!n) return "";
  return n + " min";
}
// Nota: digite só números — vira "★ 4.9" (1 casa decimal)
function formatRating(raw: string): string {
  const d = (raw || "").replace(/\D/g, "").slice(0, 2);
  if (!d) return "";
  if (d.length === 1) return "★ " + d + ".0";
  return "★ " + d[0] + "." + d[1];
}
// Corridas: digite só números — vira "1.234 corridas"
function formatRides(raw: string): string {
  const d = (raw || "").replace(/\D/g, "");
  if (!d) return "";
  return Number(d).toLocaleString("pt-BR") + " corridas";
}
// Placa: AAA0A00 ou AAA-0000 — uppercase + traço
function formatPlate(raw: string): string {
  const v = (raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  if (v.length <= 3) return v;
  return v.slice(0, 3) + "-" + v.slice(3);
}

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
  const [lockResume, setLockResume] = useState(false);
  const [sessions, setSessions] = useState<SessionOrderRow[]>([]);
  const knownRequestKeysRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const sessionRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

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
        setOrderDate(row.order_date || nowDateTimeBR());
        setPickupCode(row.pickup_code || "");
        setLockResume(!!(row as any).lock_resume_session);
      } else {
        // Sem registro ainda: já preenche a data com agora pra evitar digitação.
        setOrderDate(nowDateTimeBR());
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
              showSystemNotification("Atenção: cliente solicitando coleta!", "Uma vítima clicou em 'Solicitar coleta'");
              toast.warning("Cliente solicitando coleta!", {
                description: "Verifique a sessão e despache o parceiro.",
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
      lock_resume_session: lockResume,
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
  const pendingSessionIds = new Set(pendingSessions.map((s) => s.session_id));
  const hasAddressIds = new Set(sessions.filter((s) => s.delivery_address).map((s) => s.session_id));

  const focusSessionCard = (sid: string) => {
    const el = sessionRefs.current.get(sid);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-red-500");
      setTimeout(() => el.classList.remove("ring-2", "ring-red-500"), 2000);
    }
  };

  return (
    <section className="space-y-4">
      {/* ===== AO VIVO ===== */}
      <LiveSessionsPanel
        adId={adId}
        pendingSessionIds={pendingSessionIds}
        hasAddressIds={hasAddressIds}
        onFocusDispatch={focusSessionCard}
      />

      {/* ===== A: Config do produto (igual pra todos) ===== */}
      <div className="space-y-4 rounded-lg border border-border bg-card p-3 sm:p-4">
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
            onChange={(e) => setPrice(formatPriceBR(e.target.value))}
            inputMode="numeric"
            placeholder="Digite só números: 235000 → R$ 2.350,00"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              onChange={(e) => setOrderDate(formatDateTimeBR(e.target.value))}
              inputMode="numeric"
              placeholder="07112026 2032 → 07/11 20:32"
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

        <label className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={lockResume}
            onChange={(e) => setLockResume(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span>
            <span className="font-semibold">Travar vítima na tela de status</span><br />
            <span className="text-muted-foreground">Quando ligado, quem já teve o motorista despachado continua na tela do pedido mesmo se recarregar. Desligado: reload volta pro login normal.</span>
          </span>
        </label>

        <Button onClick={saveProduct} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar configuração do produto
        </Button>
        </div>
      </div>

      {/* ===== B: Sessões pedindo motorista (alerta) ===== */}
      {pendingSessions.length > 0 && (
        <div className="space-y-3 rounded-lg border-2 border-orange-500/60 bg-orange-500/5 p-3 sm:p-4 shadow-[0_0_0_4px_hsl(var(--primary)/0.05)]">
          <header className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 animate-pulse text-orange-500" />
            <h3 className="text-sm font-semibold text-orange-600">
              ATENÇÃO: {pendingSessions.length} cliente{pendingSessions.length > 1 ? "s" : ""} solicitando motorista!
            </h3>
          </header>
          {pendingSessions.map((s) => (
            <div key={s.session_id} ref={(el) => { sessionRefs.current.set(s.session_id, el); }} className="rounded-md transition-shadow">
              <SessionDispatchCard adId={adId} session={s} highlight onRemoved={(sid) => setSessions((prev) => prev.filter((r) => r.session_id !== sid))} />
            </div>
          ))}
        </div>
      )}

      {otherSessions.length > 0 && (
        <div className="space-y-3 rounded-lg border border-border bg-card p-3 sm:p-4">
          <header className="flex items-center gap-2">
            <Bike className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Outras sessões com endereço/motorista</h3>
          </header>
          {otherSessions.map((s) => (
            <div key={s.session_id} ref={(el) => { sessionRefs.current.set(s.session_id, el); }} className="rounded-md transition-shadow">
              <SessionDispatchCard adId={adId} session={s} onRemoved={(sid) => setSessions((prev) => prev.filter((r) => r.session_id !== sid))} />
            </div>
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
  // Defaults fixos de visualização — só pra não ficar redigitando o óbvio.
  const [rating, setRating] = useState(session.driver_rating || "★ 4.9");
  const [rides, setRides] = useState(session.driver_rides || "1.247 corridas");
  const [eta, setEta] = useState(session.driver_eta || "8 min");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPhoto(session.driver_photo_url || "");
    setName(session.driver_name || "");
    setPlate(session.driver_plate || "");
    setVehicle(session.driver_vehicle || "");
    setColor(session.driver_color || "");
    setRating(session.driver_rating || "★ 4.9");
    setRides(session.driver_rides || "1.247 corridas");
    setEta(session.driver_eta || "8 min");
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
            <PasteExtractor
              onExtract={(d) => {
                if (d.name) setName(d.name);
                if (d.plate) setPlate(d.plate);
                if (d.vehicle) setVehicle(d.vehicle);
                if (d.color) setColor(d.color);
                if (d.rating) setRating(d.rating);
                if (d.rides) setRides(d.rides);
                if (d.eta) setEta(d.eta);
                if (d.photo) setPhoto(d.photo);
              }}
            />
            <PhotoPicker photo={photo} onChange={setPhoto} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="rounded-md border border-input bg-background px-3 py-2 text-xs" />
              <input value={plate} onChange={(e) => setPlate(formatPlate(e.target.value))} placeholder="Placa: ABC1D23" className="rounded-md border border-input bg-background px-3 py-2 text-xs uppercase" />
              <input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Veículo (Honda CG 160)" className="rounded-md border border-input bg-background px-3 py-2 text-xs" />
              <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Cor (Vermelha)" className="rounded-md border border-input bg-background px-3 py-2 text-xs" />
              <input value={rating} onChange={(e) => setRating(formatRating(e.target.value))} inputMode="numeric" placeholder="Nota: 49 → ★ 4.9" className="rounded-md border border-input bg-background px-3 py-2 text-xs" />
              <input value={rides} onChange={(e) => setRides(formatRides(e.target.value))} inputMode="numeric" placeholder="Corridas: 1234 → 1.234 corridas" className="rounded-md border border-input bg-background px-3 py-2 text-xs" />
              <input value={eta} onChange={(e) => setEta(formatEta(e.target.value))} inputMode="numeric" placeholder="ETA: 8 → 8 min" className="col-span-2 rounded-md border border-input bg-background px-3 py-2 text-xs" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={dispatch} disabled={busy} className="flex-1 min-w-[140px]">
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

/**
 * Cola texto copiado do app da 99/Uber e extrai nome, placa, modelo, cor,
 * nota, corridas e ETA via regex. Tudo que conseguir extrair preenche o
 * formulário do motorista; o que não bater fica em branco.
 */
function PasteExtractor({ onExtract }: { onExtract: (d: {
  name?: string; plate?: string; vehicle?: string; color?: string; photo?: string;
  rating?: string; rides?: string; eta?: string;
}) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const extractFromImage = async (dataUrl: string) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-driver", {
        body: { imageDataUrl: dataUrl },
      });
      if (error) throw error;
      const d = (data?.data || {}) as Record<string, string>;
      // Não usa o print como foto do motorista — só preenche os campos de
      // texto. A foto de perfil é colada/anexada separadamente abaixo.
      onExtract(d);
      const found = Object.keys(d).length;
      if (found === 0) toast.error("Não consegui ler dados no print.");
      else toast.success(`${found} campo${found > 1 ? "s" : ""} preenchido${found > 1 ? "s" : ""} pela IA`);
      setOpen(false);
      setText("");
    } catch (e: any) {
      toast.error("Erro na IA", { description: e?.message || "Tente de novo" });
    } finally {
      setBusy(false);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo precisa ser uma imagem");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      extractFromImage(url);
    };
    reader.readAsDataURL(file);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (item) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file) handleFile(file);
    }
  };

  const extract = () => {
    const t = text.replace(/\u00A0/g, " ").trim();
    if (!t) return;
    const out: Record<string, string> = {};

    // Placa Mercosul (ABC1D23) ou antiga (ABC-1234 / ABC1234)
    const plateMatch = t.match(/\b([A-Z]{3})[-\s]?(\d[A-Z0-9]\d{2})\b/i);
    if (plateMatch) out.plate = (plateMatch[1] + plateMatch[2]).toUpperCase();

    // ETA: "8 min", "12 minutos", "chega em 5 min", "Chegada em 8 min"
    const etaMatch = t.match(/(\d{1,3})\s*(?:min|minutos?)\b/i);
    if (etaMatch) out.eta = `${etaMatch[1]} min`;

    // Nota: "4.9", "★ 4.8", "⭐ 4.95"
    const ratingMatch = t.match(/(?:[★⭐]|nota|rating)\s*(\d[.,]\d{1,2})/i) || t.match(/\b(\d[.,]\d{1,2})\s*(?:[★⭐]|estrelas?)/i);
    if (ratingMatch) out.rating = ratingMatch[1].replace(",", ".");

    // Corridas: "1.2k corridas", "1234 corridas", "(1.2k)"
    const ridesMatch = t.match(/(\d[\d.,]*\s*[kK]?)\s*corridas?/i);
    if (ridesMatch) out.rides = ridesMatch[1].trim();

    // Cores comuns
    const colorWords = ["Branco","Preto","Prata","Cinza","Vermelho","Azul","Verde","Amarelo","Bege","Marrom","Dourado"];
    const colorMatch = colorWords.find((c) => new RegExp(`\\b${c}\\b`, "i").test(t));
    if (colorMatch) out.color = colorMatch;

    // Modelo do carro: linha que contém marcas conhecidas
    const carBrands = ["Honda","Toyota","Volkswagen","VW","Chevrolet","Fiat","Ford","Hyundai","Renault","Nissan","Peugeot","Citroen","Citroën","Jeep","Kia","Mitsubishi","Mercedes","BMW","Audi","Caoa","Chery"];
    const lines = t.split(/\r?\n|·|•|\|/).map((s) => s.trim()).filter(Boolean);
    const carLine = lines.find((l) => carBrands.some((b) => new RegExp(`\\b${b}\\b`, "i").test(l)));
    if (carLine) {
      // Remove cor, placa e bullets do carro
      let v = carLine;
      if (out.color) v = v.replace(new RegExp(`\\b${out.color}\\b`, "i"), "");
      if (out.plate) v = v.replace(new RegExp(out.plate, "i"), "");
      v = v.replace(/[•·|–—-]+/g, " ").replace(/\s+/g, " ").trim();
      if (v) out.vehicle = v;
    }

    // Nome: primeira linha curta com 2+ palavras capitalizadas, sem números
    const nameLine = lines.find((l) =>
      l.length < 60 &&
      !/\d/.test(l) &&
      !carBrands.some((b) => new RegExp(`\\b${b}\\b`, "i").test(l)) &&
      !colorWords.some((c) => new RegExp(`\\b${c}\\b`, "i").test(l)) &&
      /^([A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+\s+){1,3}[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+/.test(l),
    );
    if (nameLine) {
      out.name = nameLine
        .replace(/\s+(está a caminho|chegou|aceitou|a caminho).*$/i, "")
        .trim();
    }

    onExtract(out);
    const found = Object.keys(out).length;
    if (found === 0) toast.error("Não consegui extrair nada. Cole o texto da 99/Uber.");
    else toast.success(`${found} campo${found > 1 ? "s" : ""} preenchido${found > 1 ? "s" : ""}`);
    setText("");
    setOpen(false);
  };

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setOpen(true)}>
        📋 Colar print/dados da 99/Uber
      </Button>
    );
  }

  return (
    <div className="space-y-1.5 rounded-md border border-dashed border-primary/40 bg-primary/5 p-2" onPaste={onPaste}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-muted-foreground">
          📸 Cole o print (Ctrl+V) ou texto. A IA preenche tudo.
        </p>
        <label className="cursor-pointer rounded border border-input bg-background px-2 py-0.5 text-[10px] hover:bg-muted">
          Anexar
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </label>
      </div>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Cole texto OU print (Ctrl+V) do app da 99/Uber.\n\nSe colar imagem, a IA lê e preenche tudo automaticamente — incluindo a foto do motorista.`}
        rows={5}
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs font-mono"
      />
      <div className="flex gap-1.5">
        <Button size="sm" className="flex-1 text-xs" onClick={extract} disabled={busy}>
          {busy ? "Lendo print..." : "Extrair texto"}
        </Button>
        <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setOpen(false); setText(""); }} disabled={busy}>Cancelar</Button>
      </div>
    </div>
  );
}

/**
 * Campo da foto do motorista: aceita URL, upload (Anexar) ou colar imagem
 * (Ctrl+V) só dentro dele. NÃO usa o print da extração — é uma foto separada.
 */
function PhotoPicker({ photo, onChange }: { photo: string; onChange: (v: string) => void }) {
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Anexe uma imagem");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };
  const onPaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (item) {
      e.preventDefault();
      const f = item.getAsFile();
      if (f) handleFile(f);
    }
  };
  return (
    <div className="space-y-1.5" onPaste={onPaste}>
      <div className="flex items-center gap-2">
        {photo ? (
          <img src={photo} alt="" className="h-10 w-10 rounded-full object-cover border border-border" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">foto</div>
        )}
        <input
          value={photo}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL da foto OU clique aqui e Ctrl+V"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs"
        />
        <label className="cursor-pointer rounded border border-input bg-background px-2 py-1.5 text-[10px] hover:bg-muted whitespace-nowrap">
          Anexar
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </label>
        {photo && (
          <button type="button" onClick={() => onChange("")} className="text-[10px] text-destructive hover:underline">limpar</button>
        )}
      </div>
    </div>
  );
}