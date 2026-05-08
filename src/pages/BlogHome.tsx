import { useEffect } from "react";

/**
 * Página fachada — qualquer um que acessar o domínio raiz vê isso.
 * Sem links pra área operacional. Conteúdo genérico de "portal
 * de dicas de segurança digital", inofensivo pra moderadores
 * e crawlers.
 */
const POSTS = [
  {
    title: "Como reconhecer e-mails de phishing em 2026",
    excerpt:
      "Confira os principais sinais de mensagens fraudulentas e proteja seus dados pessoais com práticas simples do dia a dia.",
    date: "07 de maio de 2026",
    category: "Segurança",
  },
  {
    title: "Boas práticas para criar senhas realmente fortes",
    excerpt:
      "Tamanho, variedade de caracteres e gerenciadores de senha — entenda como montar combinações difíceis de quebrar.",
    date: "03 de maio de 2026",
    category: "Senhas",
  },
  {
    title: "Mercado de classificados online: tendências do trimestre",
    excerpt:
      "Análise das principais movimentações do setor de vendas digitais entre vendedores e compradores nas últimas semanas.",
    date: "29 de abril de 2026",
    category: "Mercado",
  },
  {
    title: "Autenticação em dois fatores: por que ativar agora",
    excerpt:
      "A camada extra de segurança que reduz drasticamente o risco de invasão das suas contas pessoais e profissionais.",
    date: "22 de abril de 2026",
    category: "Segurança",
  },
  {
    title: "Compras online com segurança: 7 dicas essenciais",
    excerpt:
      "Verifique reputação, prefira meios de pagamento rastreáveis e desconfie de ofertas boas demais para serem verdade.",
    date: "15 de abril de 2026",
    category: "Dicas",
  },
  {
    title: "Privacidade de dados em apps de mensagens",
    excerpt:
      "Configurações simples que você pode ativar agora pra reduzir a exposição das suas conversas e contatos.",
    date: "08 de abril de 2026",
    category: "Privacidade",
  },
];

export default function BlogHome() {
  useEffect(() => {
    document.title = "Portal Seguro — Dicas de Segurança Digital e Mercado";
    const meta = document.querySelector('meta[name="description"]');
    const desc =
      "Notícias, dicas e análises sobre segurança digital, privacidade e mercado de vendas online. Conteúdo atualizado para consumidores e vendedores.";
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-slate-900 text-white grid place-items-center text-sm font-bold">PS</div>
            <span className="font-semibold tracking-tight text-slate-900">Portal Seguro</span>
          </div>
          <nav className="hidden gap-6 text-sm text-slate-600 sm:flex">
            <span className="hover:text-slate-900 cursor-default">Segurança</span>
            <span className="hover:text-slate-900 cursor-default">Mercado</span>
            <span className="hover:text-slate-900 cursor-default">Privacidade</span>
            <span className="hover:text-slate-900 cursor-default">Dicas</span>
          </nav>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Dicas práticas de segurança digital e mercado de vendas
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Conteúdo independente, atualizado semanalmente, para quem quer navegar, comprar e vender online com mais
            tranquilidade.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Últimas publicações</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((p) => (
            <article
              key={p.title}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-600">
                {p.category}
              </span>
              <h3 className="mt-3 text-base font-semibold text-slate-900">{p.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{p.excerpt}</p>
              <p className="mt-4 text-xs text-slate-400">{p.date}</p>
            </article>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Portal Seguro — Conteúdo informativo.</span>
          <span>Contato: contato@portalseguro.example</span>
        </div>
      </footer>
    </div>
  );
}
