import type { Dictionary } from "./en";

/** Chaves "a.b.c" de todos os textos simples do dicionário (listas ficam de fora: usar o objeto). */
type Paths<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : T[K] extends readonly unknown[]
      ? never
      : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessageKey = Paths<Dictionary>;

/** Texto da chave, com {variáveis} substituídas. */
export function translate(dict: Dictionary, key: MessageKey, vars?: Record<string, string>) {
  let value: unknown = dict;
  for (const part of key.split(".")) value = (value as Record<string, unknown>)[part];
  let text = value as string;
  if (vars) for (const [name, v] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, v);
  return text;
}
