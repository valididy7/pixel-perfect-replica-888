export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: "Segurança" | "Mercado" | "Privacidade" | "Dicas" | "Senhas";
  readTime: string;
  content: string[];
};

export const POSTS: BlogPost[] = [
  {
    slug: "reconhecer-emails-phishing-2026",
    title: "Como reconhecer e-mails de phishing em 2026",
    excerpt:
      "Confira os principais sinais de mensagens fraudulentas e proteja seus dados pessoais com práticas simples do dia a dia.",
    date: "07 de maio de 2026",
    category: "Segurança",
    readTime: "5 min",
    content: [
      "O phishing continua sendo uma das ameaças mais comuns na internet. Em 2026, com o avanço da inteligência artificial, os criminosos estão produzindo mensagens cada vez mais convincentes, imitando bancos, lojas e serviços populares.",
      "O primeiro sinal de alerta é o senso de urgência. Mensagens que pedem ação imediata — como 'sua conta será bloqueada em 24 horas' — quase sempre são tentativas de manipulação emocional. Empresas legítimas raramente impõem prazos curtos por e-mail.",
      "Verifique sempre o endereço do remetente com atenção. Domínios sutilmente alterados, como 'banc0' no lugar de 'banco', são uma técnica clássica. Passe o mouse sobre os links antes de clicar para ver o destino real.",
      "Outro indicador importante é o pedido de informações sensíveis. Nenhuma instituição séria pede senha, CPF completo ou código de cartão por e-mail. Em caso de dúvida, abra o site oficial diretamente no navegador, sem clicar no link da mensagem.",
      "Por fim, mantenha seu antivírus atualizado e ative a autenticação em dois fatores em todas as contas importantes. Essa camada extra é o que separa um susto de um prejuízo real.",
    ],
  },
  {
    slug: "boas-praticas-senhas-fortes",
    title: "Boas práticas para criar senhas realmente fortes",
    excerpt:
      "Tamanho, variedade de caracteres e gerenciadores de senha — entenda como montar combinações difíceis de quebrar.",
    date: "03 de maio de 2026",
    category: "Senhas",
    readTime: "4 min",
    content: [
      "Uma senha forte é a primeira linha de defesa contra invasões. Apesar disso, pesquisas mostram que combinações como '123456' e 'senha' ainda estão entre as mais usadas no mundo.",
      "A recomendação atual é simples: use senhas com pelo menos 14 caracteres, misturando letras maiúsculas, minúsculas, números e símbolos. Frases longas e fáceis de lembrar — como 'MinhaCachorraGosta2Pizza!' — são mais seguras do que combinações curtas e complexas.",
      "Nunca reutilize senhas entre serviços diferentes. Se um site sofre vazamento, todas as contas que usam aquela mesma senha ficam expostas. Esse é o vetor de ataque mais comum hoje.",
      "Use um gerenciador de senhas confiável. Ele cria combinações únicas e aleatórias para cada serviço, e você só precisa lembrar de uma senha mestra. As principais opções têm versões gratuitas robustas.",
      "Por fim, ative a autenticação em dois fatores sempre que possível. Mesmo que sua senha vaze, o invasor não consegue entrar sem o segundo código.",
    ],
  },
  {
    slug: "mercado-classificados-online-trimestre",
    title: "Mercado de classificados online: tendências do trimestre",
    excerpt:
      "Análise das principais movimentações do setor de vendas digitais entre vendedores e compradores nas últimas semanas.",
    date: "29 de abril de 2026",
    category: "Mercado",
    readTime: "6 min",
    content: [
      "O mercado de classificados online vive um momento de transformação. A integração com pagamentos digitais e ferramentas de logística mudou o perfil tanto de vendedores quanto de compradores no último trimestre.",
      "Categorias como eletrônicos usados e móveis seguem liderando em volume, mas o crescimento mais expressivo está em produtos sustentáveis e itens de segunda mão premium. Consumidores estão valorizando reuso e economia circular.",
      "Vendedores relatam que anúncios com fotos profissionais e descrições detalhadas convertem até três vezes mais. Vídeos curtos mostrando o produto em uso também passaram a fazer diferença significativa.",
      "Do lado dos compradores, a confiança no vendedor é o fator decisivo. Reputação construída ao longo do tempo, avaliações positivas e respostas rápidas são os principais critérios de decisão.",
      "Para o próximo trimestre, a expectativa é de mais integração entre marketplaces e ferramentas de pagamento protegido, reduzindo o risco de golpes e aumentando a confiança geral do setor.",
    ],
  },
  {
    slug: "autenticacao-dois-fatores-ativar-agora",
    title: "Autenticação em dois fatores: por que ativar agora",
    excerpt:
      "A camada extra de segurança que reduz drasticamente o risco de invasão das suas contas pessoais e profissionais.",
    date: "22 de abril de 2026",
    category: "Segurança",
    readTime: "4 min",
    content: [
      "A autenticação em dois fatores (2FA) é, sem exagero, a medida de segurança individual com maior impacto no momento. Estudos indicam que ela bloqueia mais de 99% dos ataques automatizados a contas online.",
      "O conceito é simples: além da senha, você precisa fornecer um segundo código, gerado por um aplicativo no celular ou enviado por SMS. Mesmo que alguém descubra sua senha, sem o segundo fator não consegue entrar.",
      "Apps autenticadores como Google Authenticator, Microsoft Authenticator e Authy são a opção mais segura. SMS funciona, mas é vulnerável a ataques de troca de chip — evite quando possível.",
      "Comece pelas contas mais críticas: e-mail principal, bancos, redes sociais e serviços de armazenamento na nuvem. Seu e-mail é especialmente importante porque costuma ser usado para recuperação de outras contas.",
      "A configuração leva poucos minutos e os benefícios são duradouros. Se você ainda não ativou, esse é o momento.",
    ],
  },
  {
    slug: "compras-online-com-seguranca",
    title: "Compras online com segurança: 7 dicas essenciais",
    excerpt:
      "Verifique reputação, prefira meios de pagamento rastreáveis e desconfie de ofertas boas demais para serem verdade.",
    date: "15 de abril de 2026",
    category: "Dicas",
    readTime: "5 min",
    content: [
      "Comprar pela internet ficou rotina, mas os golpes evoluem na mesma velocidade. Algumas práticas simples reduzem drasticamente o risco de cair em fraudes.",
      "Primeiro: verifique a reputação da loja. Sites como Reclame Aqui, avaliações no Google e comentários em redes sociais dão um panorama rápido. Loja sem histórico ou com avaliações ruins é sinal vermelho.",
      "Segundo: confira o cadeado de segurança no navegador e prefira pagamentos rastreáveis, como cartão de crédito ou Pix com identificação clara do recebedor. Transferências para contas de pessoa física em compras de loja são bandeira amarela.",
      "Terceiro: desconfie de preços muito abaixo do mercado. Quando a oferta é boa demais para ser verdade, geralmente não é verdade. Compare em pelo menos três sites antes de fechar.",
      "Quarto: use cartões virtuais para compras online quando possível. Eles geram um número descartável, limitando o estrago em caso de vazamento.",
      "Quinto: nunca compre por links recebidos em SMS ou WhatsApp sem verificar. Acesse o site digitando o endereço diretamente no navegador.",
      "Sexto: salve comprovantes e e-mails de confirmação. Eles são a prova em caso de problema com a entrega ou contestação no cartão.",
      "Sétimo: em caso de fraude, registre boletim de ocorrência e contate seu banco rapidamente. Quanto antes, maiores as chances de recuperar o valor.",
    ],
  },
  {
    slug: "privacidade-apps-mensagens",
    title: "Privacidade de dados em apps de mensagens",
    excerpt:
      "Configurações simples que você pode ativar agora pra reduzir a exposição das suas conversas e contatos.",
    date: "08 de abril de 2026",
    category: "Privacidade",
    readTime: "5 min",
    content: [
      "Aplicativos de mensagens guardam um volume enorme de informação pessoal. Configurar a privacidade corretamente é tão importante quanto escolher uma boa senha.",
      "Comece revisando quem pode ver sua foto de perfil, status e foto de visualização. Restringir para 'meus contatos' (em vez de 'todos') já reduz drasticamente a exposição a desconhecidos.",
      "Ative a verificação em duas etapas dentro do app. Isso impede que alguém ative sua conta em outro celular usando apenas o código SMS — golpe muito comum no Brasil.",
      "Desative o download automático de mídia em redes móveis. Além de economizar dados, evita que arquivos maliciosos cheguem ao seu celular sem você perceber.",
      "Cuidado com grupos: ao entrar em um grupo, seu número fica visível para todos os participantes. Em apps que permitem, restrinja quem pode te adicionar a grupos.",
      "Por fim, faça backup criptografado das conversas. Backups sem criptografia, salvos em nuvem, podem ser acessados se sua conta cloud for comprometida.",
    ],
  },
  {
    slug: "golpe-do-falso-comprovante-pix",
    title: "Golpe do falso comprovante Pix: como identificar",
    excerpt:
      "Vendedores online são alvo frequente de comprovantes adulterados. Veja como confirmar um pagamento de verdade.",
    date: "01 de abril de 2026",
    category: "Segurança",
    readTime: "4 min",
    content: [
      "O golpe do falso comprovante cresceu junto com a popularização do Pix. O criminoso envia uma imagem ou PDF que imita perfeitamente o recibo do banco, mas o dinheiro nunca cai na conta do vendedor.",
      "A regra de ouro é simples: comprovante não é pagamento. Só considere a venda concluída quando o valor aparecer efetivamente no extrato da sua conta, conferido dentro do app oficial do banco.",
      "Desconfie de pressa. O golpista tipicamente insiste pra você liberar o produto 'rapidinho' alegando que o Pix demora a compensar. Pix legítimo cai em segundos, 24 horas por dia.",
      "Confira nome, CPF/CNPJ e horário no extrato — não no comprovante enviado. Imagens podem ser editadas em segundos com qualquer editor gratuito.",
      "Se possível, use plataformas com pagamento intermediado, em que o valor só é liberado ao vendedor após a confirmação da entrega. É a forma mais segura de fechar negócios com desconhecidos.",
    ],
  },
  {
    slug: "wifi-publico-riscos-protecao",
    title: "Wi-Fi público: riscos reais e como se proteger",
    excerpt:
      "Aeroportos, cafés e shoppings oferecem conexão gratuita, mas exigem cuidado redobrado com dados sensíveis.",
    date: "25 de março de 2026",
    category: "Privacidade",
    readTime: "5 min",
    content: [
      "Redes Wi-Fi abertas são convenientes, mas representam um dos ambientes mais vulneráveis pra quem usa internet em mobilidade. Qualquer pessoa conectada à mesma rede pode, em tese, monitorar parte do tráfego.",
      "Evite acessar bancos, fazer compras ou digitar senhas importantes enquanto estiver em redes públicas. Para essas tarefas, prefira os dados móveis do celular, que são bem mais seguros.",
      "Se precisar usar Wi-Fi público com frequência, considere uma VPN confiável. Ela criptografa o tráfego e impede que terceiros vejam o que você está acessando, mesmo dentro da rede.",
      "Desative o compartilhamento de arquivos e a conexão automática a redes abertas no seu dispositivo. Esses recursos, ativos por padrão em alguns sistemas, abrem portas desnecessárias.",
      "Por fim, confira sempre se o site usa HTTPS (cadeado fechado). Em redes públicas, conexões HTTP simples expõem todo o conteúdo trafegado.",
    ],
  },
  {
    slug: "anuncio-vendedor-confiavel",
    title: "Como montar um anúncio que transmite confiança",
    excerpt:
      "Foto, descrição e atendimento são os três pilares de um anúncio que vende mais e atrai compradores sérios.",
    date: "18 de março de 2026",
    category: "Mercado",
    readTime: "6 min",
    content: [
      "Em marketplaces, a confiança é construída em segundos. O comprador decide se vai te chamar ou não com base na primeira impressão do anúncio.",
      "Comece pelas fotos. Use luz natural, fundo neutro e mostre o produto de vários ângulos. Evite imagens da internet — fotos reais, com pequenas marcas de uso visíveis, transmitem honestidade.",
      "Capriche na descrição. Inclua marca, modelo, ano de compra, motivo da venda e estado de conservação real. Esconder defeitos costuma gerar cancelamento e avaliação ruim depois.",
      "Defina um preço coerente com o mercado. Pesquise anúncios semelhantes e posicione o seu numa faixa competitiva. Preço muito abaixo da média desperta desconfiança em vez de atrair compradores.",
      "Responda rápido e com educação. Compradores tendem a fechar com quem responde primeiro. Padronize uma mensagem inicial cordial pra ganhar tempo sem parecer impessoal.",
      "Por fim, mantenha registro de toda conversa. Em caso de dúvida ou problema futuro, o histórico protege as duas partes.",
    ],
  },
  {
    slug: "vazamento-dados-o-que-fazer",
    title: "Seu e-mail vazou: o que fazer nas próximas 24 horas",
    excerpt:
      "Passo a passo prático pra reduzir o impacto quando suas credenciais aparecem em um vazamento público.",
    date: "11 de março de 2026",
    category: "Segurança",
    readTime: "5 min",
    content: [
      "Vazamentos de dados acontecem com frequência alarmante. Saber agir nas primeiras horas faz diferença real entre um susto e um prejuízo.",
      "Comece verificando em quais serviços seu e-mail apareceu. Sites como Have I Been Pwned listam vazamentos públicos conhecidos e indicam o grau de exposição.",
      "Troque imediatamente a senha do serviço afetado. Se você usava a mesma senha em outros lugares, troque em todos eles também — esse é o vetor mais explorado por criminosos.",
      "Ative a autenticação em dois fatores no e-mail principal e nas contas mais sensíveis. Isso bloqueia a maior parte das tentativas de invasão mesmo com a senha em mãos do atacante.",
      "Fique atento a tentativas de phishing nos dias seguintes. Quem tem seu e-mail e dados parciais costuma montar mensagens muito personalizadas. Desconfie de qualquer pedido inesperado.",
      "Se documentos pessoais (CPF, RG) também vazaram, considere registrar boletim de ocorrência e monitorar seu CPF em serviços de proteção ao crédito por alguns meses.",
    ],
  },
  {
    slug: "gerenciador-senhas-escolha",
    title: "Como escolher um gerenciador de senhas em 2026",
    excerpt:
      "Critérios práticos pra avaliar opções gratuitas e pagas, e migrar de planilhas ou anotações no celular.",
    date: "04 de março de 2026",
    category: "Senhas",
    readTime: "5 min",
    content: [
      "Lembrar dezenas de senhas únicas é impossível. Por isso, gerenciadores de senha deixaram de ser luxo e viraram ferramenta básica de higiene digital.",
      "Procure opções com criptografia ponta a ponta e arquitetura zero-knowledge — ou seja, em que nem o provedor consegue ler suas senhas. Esse é o requisito mínimo inegociável.",
      "Avalie compatibilidade com seus dispositivos. Um bom gerenciador roda no celular, no navegador e no computador, sincronizando automaticamente sem que você precise pensar nisso.",
      "Funções extras agregam muito: geração automática de senhas fortes, alertas de vazamento, preenchimento automático de formulários e armazenamento seguro de cartões e documentos.",
      "Versões gratuitas costumam atender o uso pessoal. Os planos pagos fazem sentido pra quem precisa compartilhar credenciais em família ou equipe, com controle de acesso por item.",
      "Na hora de migrar, comece pelas contas mais críticas e gere senhas novas e únicas. Aproveite a transição pra ativar 2FA em paralelo — as duas mudanças se reforçam.",
    ],
  },
  {
    slug: "checklist-seguranca-celular",
    title: "Checklist de segurança pro seu celular em 10 minutos",
    excerpt:
      "Dez ajustes rápidos que aumentam muito a proteção do aparelho que carrega quase toda sua vida digital.",
    date: "25 de fevereiro de 2026",
    category: "Dicas",
    readTime: "4 min",
    content: [
      "O celular concentra e-mail, banco, mensagens, fotos e documentos. Dedicar dez minutos pra revisar a segurança dele é um dos investimentos com melhor retorno em proteção pessoal.",
      "Comece pelo bloqueio de tela. Use senha numérica de pelo menos seis dígitos ou biometria. Padrões de desenho são fáceis de observar e devem ser evitados em locais públicos.",
      "Ative a criptografia do dispositivo (já vem por padrão em aparelhos recentes) e o recurso de localizar/apagar remotamente. Em caso de furto, esses recursos protegem seus dados.",
      "Revise as permissões dos aplicativos. Muitos apps pedem acesso a microfone, câmera, contatos e localização sem necessidade real. Negue tudo que não fizer sentido pra função do app.",
      "Mantenha o sistema operacional e os apps atualizados. A maior parte das atualizações corrige falhas de segurança recém-descobertas. Adiar atualização é deixar a porta destrancada.",
      "Por fim, faça backup periódico em nuvem confiável e ative a verificação em duas etapas na sua conta principal (Google ou Apple). Sem isso, perder o aparelho vira pesadelo.",
    ],
  },
];

export const CATEGORIES = ["Todos", "Segurança", "Mercado", "Privacidade", "Dicas", "Senhas"] as const;
export type Category = typeof CATEGORIES[number];
