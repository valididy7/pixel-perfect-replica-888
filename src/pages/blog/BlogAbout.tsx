import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { ArrowLeft } from "lucide-react";

export default function BlogAbout() {
  useEffect(() => {
    document.title = "Sobre — Portal Seguro";
  }, []);

  return (
    <BlogLayout>
      <article className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Sobre o Portal Seguro</h1>
        <div className="mt-6 space-y-4 text-[15px] leading-7 text-slate-700">
          <p>
            O Portal Seguro é um espaço informativo independente dedicado a divulgar boas práticas de segurança digital,
            privacidade e tendências do mercado de vendas online.
          </p>
          <p>
            Nosso conteúdo é atualizado semanalmente e tem como objetivo ajudar consumidores e vendedores a navegar pela
            internet com mais tranquilidade, evitando golpes comuns e adotando hábitos seguros no dia a dia.
          </p>
          <p>
            Não vendemos produtos nem prestamos serviços de consultoria. Todo o material aqui é gratuito e produzido
            com base em fontes públicas e em pesquisas reconhecidas no setor.
          </p>
          <h2 className="text-xl font-semibold text-slate-900 pt-4">Contato</h2>
          <p>
            Sugestões de pauta, correções ou parcerias editoriais podem ser enviadas para{" "}
            <span className="text-slate-900 font-medium">contato@portalseguro.example</span>.
          </p>
        </div>
      </article>
    </BlogLayout>
  );
}
