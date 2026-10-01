/**
 * Dicionário em inglês (en-US, padrão). Define o formato: pt-BR e pt-PT são tipados com `Dictionary`, então uma
 * chave faltando (ou sobrando) em qualquer idioma quebra o build.
 * Nomes de produto e marca (Digit Force, Athpace) não se traduzem.
 */
export const en = {
  meta: {
    title: "Digit Force | Smart security and access control",
    description:
      "Digital intercom, elevator emergency communication and AI for hospitality. From chip to integration, with technical support in Brazil.",
  },

  nav: {
    solutions: "Solutions",
    products: "Products",
    about: "About",
    contact: "Contact",
  },

  header: {
    home: "Digit Force, home",
    mainNav: "Main",
    mobileNav: "Main (mobile)",
    contact: "Contact us",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },

  language: {
    /** aria-label do botão; {language} = nome do idioma atual */
    button: "Language: {language}. Change language",
    menu: "Language",
  },

  hero: {
    titleA: "Technology that connects.",
    titleB: "Force that protects.",
    lead: "Digital intercom, elevator emergency communication and AI for hospitality. From chip to integration, with technical support in Brazil.",
    cta: "Talk to a specialist",
    caption: {
      idle: "Drag to spin",
      dragging: "Force that protects.",
      paused: "Press Spin to resume",
    },
    globeRole: "interactive 3D globe",
    globeLabel: "Spin the 3D globe",
    instructions:
      "Drag in any direction, or use the arrow keys, to spin the 3D globe. The space bar pauses the globe and turns the chip toward you; press it again to resume. On touch screens, swipe sideways to spin; swiping up or down scrolls the page.",
    footLeftA: "From chip",
    footLeftB: "to integration",
    footRightA: "Technical support",
    footRightB: "in Brazil",
    pause: "Pause",
    play: "Spin",
    pauseLabel: "Pause the globe",
    playLabel: "Spin the globe",
  },

  tear: {
    label: "Built to protect",
    /** Palavra que rasga: "FORCE" combina com o nome da marca */
    word: "FORCE",
    phrase: "Technology that empowers, simplifies and protects.",
    srTitle: "Force. Built to protect.",
  },

  pillars: {
    label: "What sets us apart",
    items: [
      {
        title: "From chip to integration",
        text: "We build everything from the hardware up to the integration with your building or hotel systems.",
      },
      {
        title: "Specialized technical support",
        text: "A technical team in Brazil for design, installation and after-sales support alongside integrators.",
      },
      {
        title: "Global partnerships",
        text: "We bring innovation from leading manufacturers to the Brazilian market.",
      },
    ],
  },

  orbit: {
    titleA: "Works with what your building",
    titleB: "or hotel already runs",
    subtitle: "PMS, room automation, telephony, Wi-Fi, cameras and mobile app, all working together in a single ecosystem.",
    cards: {
      interfone: { name: "Intercom", text: "Video and audio at the entrance, over the 2 wires the building already has." },
      monitor: { name: "Indoor monitor", text: "Answers the lobby and opens the door from inside the apartment." },
      app: { name: "Resident app", text: "Calls and notifications on the phone, wherever residents are." },
      camera: { name: "Camera", text: "Elevator car and common-area footage in the same ecosystem." },
      elevador: { name: "Elevator", text: "In an emergency, the car talks straight to the control center." },
      botao: { name: "Emergency button", text: "One press opens a call and alerts the right team." },
      terminal: { name: "Monitoring terminal", text: "Calls and alarms from the entire building on a single screen." },
      sensor: { name: "Sensor", text: "Machine room temperature and humidity, right in your monitoring." },
    },
  },

  products: {
    titleA: "Three product lines,",
    titleB: "one ecosystem",
    watchVideo: "Watch video",
    items: {
      interfones: {
        title: "2-wire digital intercom",
        text: "Indoor monitor and outdoor unit with video, over the existing wiring. Ideal for retrofits with no demolition.",
      },
      elevadores: {
        title: "Elevator emergency systems",
        text: "Car-to-control-center communication, a gateway for the machine room and remote monitoring.",
      },
      athpace: {
        title: "Athpace: AI for hospitality",
        text: "Multilingual in-room voice assistant, integrated with the PMS, with data kept on a local server.",
      },
    },
  },

  athpace: {
    titleA: "AI that understands",
    titleB: "every guest",
    lead: "In-room voice control, requests without calling the front desk, and no language barriers.",
    highlights: [
      {
        title: "Multilingual",
        text: "Understands guests and answers in their own language. The language barrier is gone.",
      },
      {
        title: "Automatic tickets",
        text: "Voice requests become tickets for the right team, with no call to the front desk.",
      },
      {
        title: "Data on a local server",
        text: "Guest and hotel data stay on an on-premises server, with end-to-end encryption.",
      },
    ],
    video: {
      label: "Athpace presentation video",
      play: "Play the Athpace video",
      unsupported: "Your browser can't play this video.",
    },
    stats: {
      hotels: "Hotels and properties",
      interactions: "Guest interactions",
      requests: "Requests handled by AI",
      localServer: "Local server",
      localServerLabel: "guest data never leaves the hotel",
    },
  },

  manifesto: {
    titleA: "A digital force built",
    titleB: "to power the future",
    text: "We believe technology should empower, simplify, protect and evolve with the world.",
  },

  cta: {
    titleA: "Become a",
    titleB: "Digit\u00A0Force partner",
    text: "Integrators, developers and hotels: talk to our team and put together the right project for your client.",
    button: "Message us on WhatsApp",
  },

  footer: {
    tagline: "Smart solutions for security, access control and hospitality.",
  },
};

export type Dictionary = typeof en;
