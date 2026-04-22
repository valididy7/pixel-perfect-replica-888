import { Navigate } from "react-router-dom";

/**
 * Qualquer rota desconhecida é silenciosamente redirecionada pra home.
 * Assim não expomos a existência (ou inexistência) de paths internos.
 */
const NotFound = () => <Navigate to="/" replace />;

export default NotFound;
