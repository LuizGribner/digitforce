"use client";

import { useState, useSyncExternalStore } from "react";
import { Languages } from "lucide-react";

import { LOCALE_INFO, type Locale } from "@/i18n/config";
import { goToLocale, readLocaleChoice, saveLocaleChoice } from "@/i18n/navigation";
import { useI18n } from "@/i18n/provider";

/** Textos no idioma sugerido (o aviso aparece na versão em inglês, para quem lê português). */
const COPY: Partial<Record<Locale, { label: string; text: string; question: string; yes: string; no: string }>> = {
  "pt-BR": {
    label: "Sugestão de idioma",
    text: "Este site também está disponível em português do Brasil.",
    question: "Ver em português?",
    yes: "Sim",
    no: "Não",
  },
  "pt-PT": {
    label: "Sugestão de idioma",
    text: "Este site também está disponível em português de Portugal.",
    question: "Ver em português?",
    yes: "Sim",
    no: "Não",
  },
};

/** Idioma do navegador (o preferido, não a lista inteira): pt-PT -> pt-PT; outros pt (pt-BR, "pt") -> pt-BR. */
function browserSuggestion(): Locale | null {
  const lang = (navigator.languages?.[0] ?? navigator.language ?? "").toLowerCase();
  if (lang === "pt-pt") return "pt-PT";
  if (lang === "pt" || lang.startsWith("pt-")) return "pt-BR";
  return null;
}

const noop = () => () => {};

/**
 * Primeira visita na raiz (inglês) com navegador em português e sem escolha salva: aviso discreto no canto
 * inferior oferecendo a versão em português. Não redireciona sozinho.
 */
export function LocaleSuggestion() {
  const { locale } = useI18n();
  // Só no cliente (navigator/localStorage); no HTML do export não existe
  const suggestion = useSyncExternalStore(
    noop,
    () => (locale === "en" && !readLocaleChoice() ? browserSuggestion() : null),
    () => null,
  );
  const [dismissed, setDismissed] = useState(false);

  const copy = suggestion && COPY[suggestion];
  if (!suggestion || !copy || dismissed) return null;

  return (
    <aside
      lang={LOCALE_INFO[suggestion].htmlLang}
      aria-label={copy.label}
      className="locale-suggestion glass-strong fixed inset-x-4 bottom-4 z-50 flex flex-col gap-3 rounded-2xl p-4 text-sm sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm"
    >
      <div className="flex gap-3">
        <Languages aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--df-purple-light)]" />
        <p>
          <span className="block text-[var(--muted-foreground)]">{copy.text}</span>
          <span className="mt-1 block font-semibold text-[#F2F2F2]">{copy.question}</span>
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            saveLocaleChoice("en");
            setDismissed(true);
          }}
          className="glass rounded-full px-4 py-2 text-xs font-semibold outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-[#A89CF0]/70"
        >
          {copy.no}
        </button>
        <button
          type="button"
          onClick={() => goToLocale(suggestion)}
          className="rounded-full bg-[var(--df-purple)] px-4 py-2 text-xs font-semibold text-white outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#A89CF0]/70"
        >
          {copy.yes}
        </button>
      </div>
    </aside>
  );
}
