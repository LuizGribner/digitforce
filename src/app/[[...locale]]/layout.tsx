import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Montserrat } from "next/font/google";
import "../globals.css";
import "lenis/dist/lenis.css";
import "../digitforce.css";
import { GlassFilter } from "@/components/glass-filter";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { LOCALE_INFO, LOCALES, localeFromSegments, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  // Itálico real para a legenda manuscrita do globo (sem itálico sintético)
  style: ["normal", "italic"],
  variable: "--font-montserrat",
  display: "swap",
});

// TODO: domínio definitivo. Na Netlify o build recebe URL (endereço principal do site)
const SITE_URL = process.env.SITE_URL ?? process.env.URL ?? "https://digitforce.com.br";

type Params = { params: Promise<{ locale?: string[] }> };

// Export estático: en na raiz (segmento vazio), pt-br e pt-pt em pastas. Qualquer outro caminho é 404
export const dynamicParams = false;
export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: LOCALE_INFO[l].segment ? [LOCALE_INFO[l].segment] : [] }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = localeFromSegments((await params).locale) ?? "en";
  const { meta } = getDictionary(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: localePath(locale),
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [LOCALE_INFO[l].htmlLang, localePath(l)])),
        "x-default": localePath("en"),
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: localePath(locale),
      siteName: "Digit Force",
      locale: LOCALE_INFO[locale].ogLocale,
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => LOCALE_INFO[l].ogLocale),
      type: "website",
    },
    icons: { icon: "/assets/logo/df-monogram-roxo.svg" },
  };
}

// Barra do navegador no celular no tom do site
export const viewport: Viewport = {
  themeColor: "#00003A",
  colorScheme: "dark",
};

export default async function RootLayout({ children, params }: Readonly<{ children: React.ReactNode }> & Params) {
  const locale = localeFromSegments((await params).locale);
  if (!locale) notFound();

  return (
    <html lang={LOCALE_INFO[locale].htmlLang} className={montserrat.variable}>
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
