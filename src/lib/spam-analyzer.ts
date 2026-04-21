/**
 * Análise simples de spam pra alertar antes de enviar.
 * Heurística baseada em padrões comuns que disparam filtros (Gmail, Outlook, etc).
 */

export interface SpamWarning {
  level: "low" | "medium" | "high";
  message: string;
}

export interface SpamAnalysis {
  /** 0-100 — quanto maior, mais provável de cair em spam */
  score: number;
  warnings: SpamWarning[];
  verdict: "good" | "okay" | "risky" | "bad";
}

const SPAMMY_WORDS = [
  "grátis", "gratis", "promoção", "promocao", "ganhe", "clique aqui",
  "urgente", "última chance", "ultima chance", "exclusivo", "imperdível",
  "imperdivel", "garantido", "100% grátis", "renda extra", "dinheiro fácil",
  "dinheiro facil", "bitcoin", "investimento", "lucro garantido",
  "oferta limitada", "compre agora", "pix", "saque",
];

export function analyzeSpam(opts: {
  subject: string;
  html: string;
  previewText?: string;
}): SpamAnalysis {
  const warnings: SpamWarning[] = [];
  let score = 0;

  const { subject, html, previewText } = opts;
  const text = stripHtml(html).toLowerCase();
  const subjLower = subject.toLowerCase();

  // 1. Assunto
  if (!subject.trim()) {
    score += 30;
    warnings.push({ level: "high", message: "Assunto vazio — quase sempre cai em spam." });
  } else {
    if (subject.length > 70) {
      score += 8;
      warnings.push({ level: "low", message: `Assunto longo (${subject.length} caracteres). Ideal: até 60.` });
    }
    if (subject.length < 10) {
      score += 5;
      warnings.push({ level: "low", message: "Assunto muito curto." });
    }
    const upperRatio = countUpper(subject) / Math.max(subject.length, 1);
    if (upperRatio > 0.5 && subject.length > 10) {
      score += 15;
      warnings.push({ level: "high", message: "Assunto com MUITAS LETRAS MAIÚSCULAS — gatilho clássico de spam." });
    }
    if (/!{2,}/.test(subject) || /\?{2,}/.test(subject)) {
      score += 10;
      warnings.push({ level: "medium", message: "Excesso de !! ou ?? no assunto." });
    }
    if (/[💰💸🤑🔥⚡️🎁]/.test(subject)) {
      score += 8;
      warnings.push({ level: "medium", message: "Emojis chamativos no assunto (💰🔥🎁)." });
    }
  }

  // 2. Palavras spam
  const foundSpammy = SPAMMY_WORDS.filter((w) => subjLower.includes(w) || text.includes(w));
  if (foundSpammy.length > 0) {
    const points = Math.min(foundSpammy.length * 6, 25);
    score += points;
    warnings.push({
      level: foundSpammy.length > 3 ? "high" : "medium",
      message: `Palavras que disparam filtros: ${foundSpammy.slice(0, 5).join(", ")}.`,
    });
  }

  // 3. Conteúdo
  if (!html.trim()) {
    score += 50;
    warnings.push({ level: "high", message: "Corpo do e-mail vazio." });
  } else {
    if (text.length < 30) {
      score += 12;
      warnings.push({ level: "medium", message: "Conteúdo muito curto. Adicione texto explicativo." });
    }

    // Razão imagem/texto
    const imgCount = (html.match(/<img\b/gi) || []).length;
    if (imgCount > 0 && text.length < 100) {
      score += 15;
      warnings.push({
        level: "high",
        message: "E-mail só com imagens e pouco texto — filtros marcam como suspeito.",
      });
    }

    // Links
    const linkCount = (html.match(/<a\s+[^>]*href=/gi) || []).length;
    if (linkCount > 10) {
      score += 10;
      warnings.push({ level: "medium", message: `Muitos links (${linkCount}). Reduza se possível.` });
    }
    if (linkCount === 0) {
      score += 3;
    }

    // CSS externo / scripts
    if (/<script\b/i.test(html)) {
      score += 30;
      warnings.push({ level: "high", message: "Tag <script> detectada — TODOS os clientes de e-mail bloqueiam." });
    }
    if (/<link\b[^>]*stylesheet/i.test(html)) {
      score += 10;
      warnings.push({ level: "medium", message: "CSS externo (<link>) não funciona em e-mail. Use estilo inline." });
    }
    if (/<form\b/i.test(html)) {
      score += 8;
      warnings.push({ level: "medium", message: "Tag <form> raramente funciona em e-mail." });
    }

    // Excesso de cores chamativas
    const colorMatches = (html.match(/color\s*:\s*(red|#ff0000|#f00)\b/gi) || []).length;
    if (colorMatches > 3) {
      score += 5;
      warnings.push({ level: "low", message: "Excesso de texto vermelho." });
    }

    // Razão maiúsculas no corpo
    if (text.length > 50) {
      const upperRatio = countUpper(text) / text.length;
      if (upperRatio > 0.3) {
        score += 10;
        warnings.push({ level: "medium", message: "Muito texto em MAIÚSCULAS no corpo." });
      }
    }

    // Sem texto plain (só HTML) — adicionamos auto, então não conta
  }

  // 4. Pré-visualização
  if (!previewText || previewText.trim().length < 10) {
    score += 3;
    warnings.push({
      level: "low",
      message: "Sem texto de pré-visualização — define o que aparece na lista de e-mails.",
    });
  }

  score = Math.min(score, 100);

  let verdict: SpamAnalysis["verdict"] = "good";
  if (score >= 60) verdict = "bad";
  else if (score >= 35) verdict = "risky";
  else if (score >= 15) verdict = "okay";

  return { score, warnings, verdict };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function countUpper(s: string): number {
  let n = 0;
  for (const c of s) if (c >= "A" && c <= "Z") n++;
  return n;
}