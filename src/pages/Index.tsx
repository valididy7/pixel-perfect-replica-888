import { useEffect } from "react";

/**
 * Rota pública "/" → manda visitantes pro site real da OLX.
 * O painel admin vive numa rota secreta separada.
 */
const Index = () => {
  useEffect(() => {
    window.location.replace("https://www.olx.com.br");
  }, []);
  return null;
};

export default Index;
