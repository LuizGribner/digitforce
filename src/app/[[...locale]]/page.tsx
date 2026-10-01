import { existsSync } from "node:fs";
import path from "node:path";

import { HomePage } from "@/components/home-page";
import type { SubtitleTrack } from "@/components/athpace-video";
import { LOCALE_INFO, localeFromSegments, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { I18nProvider } from "@/i18n/provider";

/**
 * Legendas do vídeo do Athpace (narração em pt-BR). TODO: criar public/assets/video/subtitles/en.vtt e pt-PT.vtt a
 * partir da transcrição revisada. Cada <track> só entra no player quando o arquivo existe no build.
 */
const SUBTITLES: { locale: Locale; file: string }[] = [
  { locale: "en", file: "en.vtt" },
  { locale: "pt-PT", file: "pt-PT.vtt" },
];

function availableSubtitles(): SubtitleTrack[] {
  const dir = path.join(process.cwd(), "public/assets/video/subtitles");
  return SUBTITLES.filter((s) => existsSync(path.join(dir, s.file))).map((s) => ({
    srcLang: LOCALE_INFO[s.locale].htmlLang,
    label: LOCALE_INFO[s.locale].nativeName,
    src: `/assets/video/subtitles/${s.file}`,
    locale: s.locale,
  }));
}

export default async function Page({ params }: { params: Promise<{ locale?: string[] }> }) {
  // O layout já respondeu 404 para segmentos desconhecidos
  const locale = localeFromSegments((await params).locale) ?? "en";

  return (
    <I18nProvider locale={locale} dict={getDictionary(locale)}>
      <HomePage subtitles={availableSubtitles()} />
    </I18nProvider>
  );
}
