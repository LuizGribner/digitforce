import type { Dictionary } from "./en";

/**
 * Português de Portugal (vocabulário e ortografia europeus, Acordo Ortográfico de 1990): ecrã, telemóvel, equipa,
 * contacto, aplicação, controlo, monitorização, câmara, cabina, receção, "o seu"/"si" em vez de "você".
 */
export const ptPT: Dictionary = {
  meta: {
    title: "Digit Force | Segurança inteligente e controlo de acessos",
    description:
      "Intercomunicação digital, comunicação de emergência para elevadores e IA para hotelaria. Do chip à integração, com suporte técnico no Brasil.",
  },

  nav: {
    solutions: "Soluções",
    products: "Produtos",
    about: "Sobre nós",
    contact: "Contacto",
  },

  header: {
    home: "Digit Force, início",
    mainNav: "Principal",
    mobileNav: "Principal (telemóvel)",
    contact: "Fale connosco",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
  },

  language: {
    button: "Idioma: {language}. Mudar de idioma",
    menu: "Idioma",
  },

  hero: {
    titleA: "Tecnologia que liga.",
    titleB: "Força que protege.",
    lead: "Intercomunicação digital, emergência para elevadores e IA para hotelaria. Do chip à integração, com suporte técnico no Brasil.",
    cta: "Falar com um especialista",
    caption: {
      idle: "Arraste para rodar",
      dragging: "Força que protege.",
      paused: "Carregue em Rodar para continuar",
    },
    globeRole: "globo 3D interativo",
    globeLabel: "Rodar o globo em 3D",
    instructions:
      "Arraste em qualquer direção, ou utilize as setas do teclado, para rodar o globo 3D. A barra de espaços pausa o globo e o chip vira-se para si; carregue novamente para voltar a rodar. Em ecrãs táteis, arraste para os lados para rodar; na vertical, a página desloca-se normalmente.",
    footLeftA: "Do chip",
    footLeftB: "à integração",
    footRightA: "Suporte técnico",
    footRightB: "no Brasil",
    pause: "Pausar",
    play: "Rodar",
    pauseLabel: "Pausar o globo",
    playLabel: "Rodar o globo",
  },

  tear: {
    label: "Construída para proteger",
    word: "FORÇA",
    phrase: "Tecnologia que capacita, simplifica e protege.",
    srTitle: "Força. Construída para proteger.",
  },

  pillars: {
    label: "Pontos fortes",
    items: [
      {
        title: "Do chip à integração",
        text: "Desenvolvemos tudo, desde o hardware até à integração com os sistemas do seu edifício ou hotel.",
      },
      {
        title: "Suporte técnico especializado",
        text: "Equipa técnica no Brasil para projeto, instalação e pós-venda, lado a lado com os integradores.",
      },
      {
        title: "Parcerias globais",
        text: "Levamos a inovação de fabricantes líderes ao mercado brasileiro.",
      },
    ],
  },

  orbit: {
    titleA: "Integra-se com o que o seu edifício",
    titleB: "ou hotel já utiliza",
    subtitle: "PMS, domótica dos quartos, telefonia, Wi-Fi, câmaras e aplicação. Tudo a comunicar num só ecossistema.",
    cards: {
      interfone: { name: "Videoporteiro", text: "Vídeo e áudio à entrada, sobre os 2 fios que o edifício já tem." },
      monitor: { name: "Monitor interior", text: "Atende quem está à porta e abre a entrada sem sair do apartamento." },
      app: { name: "Aplicação do morador", text: "Chamadas e avisos no telemóvel, esteja o morador onde estiver." },
      camera: { name: "Câmara", text: "Imagem da cabina e das zonas comuns no mesmo ecossistema." },
      elevador: { name: "Elevador", text: "Numa emergência, a cabina fala diretamente com a central." },
      botao: { name: "Botão de emergência", text: "Um toque abre o alerta e avisa a equipa certa." },
      terminal: { name: "Terminal de monitorização", text: "Chamadas e alarmes de todo o edifício num único ecrã." },
      sensor: { name: "Sensor", text: "Temperatura e humidade da casa das máquinas na monitorização." },
    },
  },

  products: {
    titleA: "Três linhas,",
    titleB: "um só ecossistema",
    watchVideo: "Ver vídeo",
    items: {
      interfones: {
        title: "Intercomunicação digital a 2 fios",
        text: "Monitor interior e unidade exterior com vídeo, sobre a cablagem existente. Ideal para remodelações sem obras.",
      },
      elevadores: {
        title: "Emergência para elevadores",
        text: "Comunicação da cabina com a central, gateway para a casa das máquinas e monitorização remota.",
      },
      athpace: {
        title: "Athpace: IA para hotelaria",
        text: "Assistente de voz multilingue no quarto, integrado com o PMS, com os dados num servidor local.",
      },
    },
  },

  athpace: {
    titleA: "IA que compreende",
    titleB: "cada hóspede",
    lead: "Controlo do quarto por voz, pedidos sem telefonar para a receção e nenhuma barreira linguística.",
    highlights: [
      {
        title: "Multilingue",
        text: "Compreende o hóspede e responde-lhe na língua dele. A barreira linguística deixa de existir.",
      },
      {
        title: "Pedidos automáticos",
        text: "Os pedidos por voz são encaminhados para a equipa certa, sem telefonar para a receção.",
      },
      {
        title: "Dados no servidor local",
        text: "As informações do hóspede e do hotel ficam num servidor local, com encriptação ponto a ponto.",
      },
    ],
    video: {
      label: "Vídeo de apresentação do Athpace",
      play: "Reproduzir o vídeo do Athpace",
      unsupported: "O seu navegador não consegue reproduzir este vídeo.",
    },
    stats: {
      hotels: "Hotéis e alojamentos",
      interactions: "Interações com hóspedes",
      requests: "Pedidos resolvidos por IA",
      localServer: "Servidor local",
      localServerLabel: "os dados do hóspede não saem do hotel",
    },
  },

  manifesto: {
    titleA: "Uma força digital construída",
    titleB: "para impulsionar o futuro",
    text: "Acreditamos que a tecnologia deve capacitar, simplificar, proteger e evoluir a par do mundo.",
  },

  cta: {
    titleA: "Seja parceiro da",
    titleB: "Digit Force",
    text: "Integradores, construtores e hotéis: fale com a nossa equipa e defina o projeto certo para o seu cliente.",
    button: "Falar pelo WhatsApp",
  },

  footer: {
    tagline: "Soluções inteligentes para segurança, controlo de acessos e hotelaria.",
  },
};
