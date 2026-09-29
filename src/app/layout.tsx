import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";
import "./digitforce.css";
import { GlassFilter } from "@/components/glass-filter";
import { SmoothScroll } from "@/components/providers/smooth-scroll";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  // Itálico real para a legenda manuscrita do globo (sem itálico sintético)
  style: ["normal", "italic"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Digit Force | Segurança inteligente e controle de acesso",
  description:
    "Interfonia digital, comunicação de emergência para elevadores e IA para hotelaria. Do chip à integração, com suporte técnico no Brasil.",
  icons: { icon: "/assets/logo/df-monogram-roxo.svg" },
};

// Barra do navegador no celular no tom do site
export const viewport: Viewport = {
  themeColor: "#00003A",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={montserrat.variable}>
      <body className={`${montserrat.className} antialiased`}>
        {/* Manchas de luz atrás de tudo, para o vidro ter o que desfocar */}
        <div className="df-ambient" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </div>
        <GlassFilter />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
