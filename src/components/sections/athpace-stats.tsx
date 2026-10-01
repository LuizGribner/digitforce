"use client";

import { NumberTicker } from "@/components/ui/number-ticker";
import { useI18n } from "@/i18n/provider";

// TODO: confirmar com o Mateus se a Digit Force pode usar os números do Athpace
const stats = [
  { value: 200, suffix: "+", label: "hotels" },
  { value: 100, suffix: "M+", label: "interactions" },
  { value: 5, suffix: "M+", label: "requests" },
] as const;

/** Números do Athpace, logo abaixo do player de vídeo. */
export function AthpaceStats() {
  const { t } = useI18n();

  return (
    <dl className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-x-6 gap-y-10 border-y border-[var(--border)] py-10 md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col-reverse text-center">
          <dt className="mt-2 text-sm text-[var(--muted-foreground)]">{t(`athpace.stats.${s.label}`)}</dt>
          <dd className="text-4xl font-semibold tracking-tight md:text-5xl">
            <NumberTicker value={s.value} className="text-inherit" />
            {s.suffix}
          </dd>
        </div>
      ))}
      {/* Não é número: fica na mesma linha, com a altura do valor equivalente à dos outros */}
      <div className="flex flex-col-reverse text-center">
        <dt className="mt-2 text-sm text-[var(--muted-foreground)]">{t("athpace.stats.localServerLabel")}</dt>
        <dd className="flex h-10 items-end justify-center text-2xl font-semibold tracking-tight md:h-12 md:text-3xl">
          {t("athpace.stats.localServer")}
        </dd>
      </div>
    </dl>
  );
}
