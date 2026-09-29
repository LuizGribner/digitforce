"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = { href: `#${string}`; label: string };

function subscribeScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

function useScrolled(offset = 24) {
  return useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > offset,
    () => false,
  );
}

/** Id da seção do menu que está cruzando a faixa do meio da tela (ou null fora delas). */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    const sections = key
      .split(",")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) setActive(id);
          else setActive((current) => (current === id ? null : current));
        }
      },
      // Faixa fina logo acima do meio da tela
      { rootMargin: "-40% 0px -55% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [key]);

  return active;
}

export function SiteHeader({ nav, contactHref }: { nav: NavItem[]; contactHref: string }) {
  const active = useActiveSection(nav.map((n) => n.href.slice(1)));
  // No topo a pílula é maior; ao rolar ela compacta
  const compact = useScrolled();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    // Tocar fora do header fecha o painel
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.("header")) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4">
      {/* Pílula de vidro sempre visível: grande no topo, compacta depois de rolar */}
      <div
        className={cn(
          "glass-strong mx-auto flex items-center justify-between rounded-full transition-[max-width,height,margin,padding] duration-500 ease-out",
          // No topo ocupa 80% da largura da tela (no mobile, a largura toda menos a margem)
          compact ? "mt-3 h-14 max-w-full pl-5 pr-2 md:max-w-[min(64rem,80vw)]" : "mt-5 h-20 max-w-full pl-8 pr-3 md:max-w-[80vw]",
        )}
      >
        <a href="#" aria-label="Digit Force, início" onClick={() => setOpen(false)}>
          <Image
            src="/assets/logo/digitforce-horizontal-dark-bg.svg"
            alt="Digit Force"
            width={150}
            height={34}
            priority
            className={cn("h-auto transition-[width] duration-500", compact ? "w-[128px]" : "w-[170px]")}
          />
        </a>

        <nav
          aria-label="Principal"
          className={cn("hidden items-center gap-1 transition-[font-size] duration-500 md:flex", compact ? "text-sm" : "text-base")}
        >
          {nav.map((n) => {
            const isActive = active === n.href.slice(1);
            return (
              <a
                key={n.href}
                href={n.href}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "rounded-full transition-[color,background-color,padding] duration-500",
                  compact ? "px-3.5 py-1.5" : "px-4 py-2",
                  isActive ? "bg-white/10 text-white" : "text-[var(--muted-foreground)] hover:text-white",
                )}
              >
                {n.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={contactHref}
            target="_blank"
            rel="noopener"
            className={cn(
              "glass hidden rounded-full font-semibold transition-[color,padding,font-size] duration-500 hover:text-white sm:inline-flex",
              compact ? "px-4 py-2 text-xs" : "px-6 py-3 text-sm",
            )}
          >
            Fale conosco
          </a>
          <button
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "glass inline-flex items-center justify-center rounded-full transition-[width,height] duration-500 md:hidden",
              compact ? "h-10 w-10" : "h-12 w-12",
            )}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Painel mobile */}
      <div
        id="menu-mobile"
        hidden={!open}
        className="glass-strong mx-auto mt-2 max-w-5xl rounded-3xl p-2 md:hidden"
      >
        <nav aria-label="Principal (mobile)" className="flex flex-col">
          {nav.map((n) => {
            const isActive = active === n.href.slice(1);
            return (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "rounded-2xl px-4 py-3 text-base transition-colors",
                  isActive ? "bg-white/10 text-white" : "text-[var(--muted-foreground)] hover:text-white",
                )}
              >
                {n.label}
              </a>
            );
          })}
          <a
            href={contactHref}
            target="_blank"
            rel="noopener"
            onClick={() => setOpen(false)}
            className="mt-1 rounded-2xl bg-[var(--df-purple)] px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Fale conosco
          </a>
        </nav>
      </div>
    </header>
  );
}
