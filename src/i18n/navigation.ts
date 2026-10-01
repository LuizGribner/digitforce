import { LOCALE_STORAGE_KEY, LOCALES, localePath, type Locale } from "./config";

/** Posição salva na troca de idioma (sessionStorage), restaurada na página do outro idioma. */
const RESTORE_KEY = "df-locale-restore";

type Restore = { index: number; id: string; ratio: number };

/** Blocos de nível superior da página; a estrutura é a mesma nos 3 idiomas, então o índice serve de âncora. */
const blocks = () => [...document.querySelectorAll<HTMLElement>("main > section, main > footer")];

export function readLocaleChoice(): Locale | null {
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY);
    return LOCALES.find((l) => l === value) ?? null;
  } catch {
    return null;
  }
}

export function saveLocaleChoice(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Storage bloqueado (aba privada, cookies desligados): a escolha só não é lembrada
  }
}

/**
 * Vai para a mesma página no outro idioma mantendo a seção: guarda o bloco que cruza o terço de cima da tela e
 * quanto dele já passou (fração da altura, porque os textos mudam um pouco de tamanho entre idiomas).
 */
export function goToLocale(locale: Locale) {
  saveLocaleChoice(locale);
  const line = window.innerHeight / 3;
  const all = blocks();
  let index = -1;
  all.forEach((el, i) => {
    if (el.getBoundingClientRect().top <= line) index = i;
  });
  if (index >= 0 && window.scrollY > 0) {
    const el = all[index];
    const rect = el.getBoundingClientRect();
    const restore: Restore = { index, id: el.id, ratio: (line - rect.top) / Math.max(rect.height, 1) };
    try {
      sessionStorage.setItem(RESTORE_KEY, JSON.stringify(restore));
    } catch {
      // Sem storage: troca de idioma volta ao topo
    }
  }
  // Navegação completa: cada idioma é um HTML próprio (lang, metadata e animações montadas do zero)
  window.location.assign(localePath(locale));
}

/** Lê e apaga a posição guardada; devolve o scroll de destino (ou null). */
export function takeRestoreTarget(): number | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(RESTORE_KEY);
    sessionStorage.removeItem(RESTORE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const r = JSON.parse(raw) as Restore;
    const el = (r.id && document.getElementById(r.id)) || blocks()[r.index];
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return Math.max(0, window.scrollY + rect.top + r.ratio * rect.height - window.innerHeight / 3);
  } catch {
    return null;
  }
}
