import { en, type Dictionary } from "./en";
import { ptBR } from "./pt-BR";
import { ptPT } from "./pt-PT";
import type { Locale } from "./config";

export type { Dictionary };
export { translate, type MessageKey } from "./translate";

const DICTIONARIES: Record<Locale, Dictionary> = { en, "pt-BR": ptBR, "pt-PT": ptPT };

export const getDictionary = (locale: Locale) => DICTIONARIES[locale];
