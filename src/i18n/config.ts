/**
 * Idiomas do site. en (inglês, padrão) fica na raiz; os portugueses em /pt-br/ e /pt-pt/.
 * Export estático: as 3 versões saem do segmento opcional app/[[...locale]] (generateStaticParams).
 */
export const LOCALES = ["en", "pt-BR", "pt-PT"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

type LocaleInfo = {
  /** Segmento da URL (null = raiz) */
  segment: string | null;
  /** <html lang> e hreflang */
  htmlLang: string;
  /** og:locale */
  ogLocale: string;
  /** Código curto do botão do seletor */
  short: string;
  /** Nome no próprio idioma (menu do seletor) */
  nativeName: string;
};

export const LOCALE_INFO: Record<Locale, LocaleInfo> = {
  en: { segment: null, htmlLang: "en", ogLocale: "en_US", short: "EN", nativeName: "English" },
  "pt-BR": { segment: "pt-br", htmlLang: "pt-BR", ogLocale: "pt_BR", short: "PT-BR", nativeName: "Português (Brasil)" },
  "pt-PT": { segment: "pt-pt", htmlLang: "pt-PT", ogLocale: "pt_PT", short: "PT-PT", nativeName: "Português (Portugal)" },
};

/** Caminho da página inicial do idioma (com barra final: trailingSlash no next.config). */
export const localePath = (locale: Locale) => {
  const segment = LOCALE_INFO[locale].segment;
  return segment ? `/${segment}/` : "/";
};

/** Locale a partir do parâmetro do segmento [[...locale]] (undefined na raiz). */
export function localeFromSegments(segments: string[] | undefined): Locale | null {
  if (!segments || segments.length === 0) return DEFAULT_LOCALE;
  if (segments.length > 1) return null;
  const match = LOCALES.find((l) => LOCALE_INFO[l].segment === segments[0].toLowerCase());
  return match ?? null;
}

/** Chave da escolha de idioma no localStorage. */
export const LOCALE_STORAGE_KEY = "df-locale";
