import { Navigate } from "react-router-dom";

/**
 * Rota pública "/" → carrega o único anúncio ativo do projeto.
 * O painel admin vive numa rota secreta separada.
 */
const PUBLIC_AD_SLUG = "minha-conta-olx-ddeib0";

const Index = () => <Navigate to={`/ad/${PUBLIC_AD_SLUG}`} replace />;

export default Index;
