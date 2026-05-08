import { Link } from "react-router-dom";
import { ReactNode } from "react";

export function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-slate-900 text-white grid place-items-center text-sm font-bold">PS</div>
            <span className="font-semibold tracking-tight text-slate-900">Portal Seguro</span>
          </Link>
          <nav className="hidden gap-6 text-sm text-slate-600 sm:flex">
            <Link to="/categoria/Seguranca" className="hover:text-slate-900">Segurança</Link>
            <Link to="/categoria/Mercado" className="hover:text-slate-900">Mercado</Link>
            <Link to="/categoria/Privacidade" className="hover:text-slate-900">Privacidade</Link>
            <Link to="/categoria/Dicas" className="hover:text-slate-900">Dicas</Link>
            <Link to="/sobre" className="hover:text-slate-900">Sobre</Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-slate-200 bg-slate-50 mt-12">
        <div className="mx-auto max-w-5xl px-4 py-8 text-xs text-slate-500">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="font-semibold text-slate-700 mb-1">Portal Seguro</div>
              <span>© {new Date().getFullYear()} — Conteúdo informativo independente.</span>
            </div>
            <div className="flex flex-col gap-1 sm:items-end">
              <span>Contato: contato@portalseguro.example</span>
              <Link to="/sobre" className="hover:text-slate-700">Sobre o portal</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
