"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Locale } from "./config";
import type { Dictionary } from "./en";
import { translate, type MessageKey } from "./translate";

type I18n = {
  locale: Locale;
  /** Dicionário inteiro (para listas e objetos por id) */
  dict: Dictionary;
  /** Texto simples por chave tipada: t("hero.cta") */
  t: (key: MessageKey, vars?: Record<string, string>) => string;
};

const I18nContext = createContext<I18n | null>(null);

/** Recebe do servidor só o dicionário do idioma da página (os outros não vão para o bundle do cliente). */
export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dictionary; children: ReactNode }) {
  const t = (key: MessageKey, vars?: Record<string, string>) => translate(dict, key, vars);
  return <I18nContext.Provider value={{ locale, dict, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n fora do I18nProvider");
  return ctx;
}
