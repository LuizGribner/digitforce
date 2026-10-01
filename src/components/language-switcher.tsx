"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

import { LOCALE_INFO, LOCALES, localePath, type Locale } from "@/i18n/config";
import { goToLocale } from "@/i18n/navigation";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type Props = {
  /** "header": botão compacto na pílula, menu abaixo à direita; "panel": largura total no menu mobile */
  variant?: "header" | "panel";
  compact?: boolean;
  className?: string;
};

/**
 * Seletor de idioma: botão de vidro com o código do idioma atual que abre um menu (role="menu") com os 3 idiomas,
 * cada um no próprio idioma. Teclado: Enter/Espaço/setas abrem, setas/Home/End navegam, Esc fecha e devolve o foco.
 * Cada opção é um link de verdade (funciona sem JS); com JS a troca guarda a seção atual e a escolha.
 */
export function LanguageSwitcher({ variant = "header", compact = false, className }: Props) {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLAnchorElement | null)[]>([]);
  const menuId = useId();
  const current = LOCALE_INFO[locale];

  const focusItem = (index: number) => {
    const n = LOCALES.length;
    items.current[((index % n) + n) % n]?.focus();
  };

  const openMenu = (focus: "current" | "first" | "last") => {
    setOpen(true);
    const index = focus === "first" ? 0 : focus === "last" ? LOCALES.length - 1 : LOCALES.indexOf(locale);
    // O menu só existe no DOM depois do render
    requestAnimationFrame(() => focusItem(index));
  };

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) button.current?.focus();
  };

  // Clique/toque fora fecha
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  const onButtonKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      openMenu("first");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openMenu("last");
    }
  };

  const onMenuKey = (e: KeyboardEvent) => {
    const index = items.current.findIndex((el) => el === document.activeElement);
    if (e.key === "Escape") {
      e.preventDefault();
      // Não deixa o Esc chegar ao header (que fecharia o menu mobile inteiro)
      e.stopPropagation();
      close(true);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusItem(index + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusItem(index - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusItem(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusItem(LOCALES.length - 1);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const choose = (e: React.MouseEvent, target: Locale) => {
    // Ctrl/Cmd+clique abre em outra aba normalmente
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (target === locale) {
      close(true);
      return;
    }
    goToLocale(target);
  };

  const panel = variant === "panel";

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        // O nome acessível começa pelo código visível (label in name)
        aria-label={`${current.short}. ${t("language.button", { language: current.nativeName })}`}
        onClick={() => (open ? close(false) : openMenu("current"))}
        onKeyDown={onButtonKey}
        className={cn(
          "glass inline-flex items-center justify-center gap-1.5 rounded-full font-semibold tracking-wide outline-none transition-[color,padding,font-size] duration-500 hover:text-white focus-visible:ring-2 focus-visible:ring-[#A89CF0]/70",
          panel ? "w-full justify-between px-4 py-3 text-sm" : compact ? "h-10 px-3 text-xs" : "h-12 px-4 text-sm",
        )}
      >
        <span>
          {panel && <span className="mr-2 font-normal text-[var(--muted-foreground)]">{t("language.menu")}</span>}
          {current.short}
        </span>
        <ChevronDown aria-hidden className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={t("language.menu")}
          onKeyDown={onMenuKey}
          className={cn(
            "glass-strong z-50 flex flex-col rounded-2xl p-1.5",
            panel ? "mt-2 w-full" : "absolute right-0 top-full mt-2 w-56",
          )}
        >
          {LOCALES.map((l, i) => {
            const info = LOCALE_INFO[l];
            const active = l === locale;
            return (
              <a
                key={l}
                ref={(el) => {
                  items.current[i] = el;
                }}
                role="menuitem"
                href={localePath(l)}
                hrefLang={info.htmlLang}
                lang={info.htmlLang}
                aria-current={active ? "true" : undefined}
                tabIndex={-1}
                onClick={(e) => choose(e, l)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#A89CF0]/70",
                  active ? "bg-white/10 text-white" : "text-[var(--muted-foreground)] hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white",
                )}
              >
                {info.nativeName}
                {active && <Check aria-hidden className="h-4 w-4 text-[var(--df-purple-light)]" />}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
