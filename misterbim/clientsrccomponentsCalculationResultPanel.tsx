"use client";

import type { CalculationResult } from "@shared/engineering";

type CalculationResultPanelProps = {
  result: CalculationResult;
};

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 4,
});

export default function CalculationResultPanel({
  result,
}: CalculationResultPanelProps) {
  const isNormative = result.classification === "normative";

  return (
    <section
      aria-labelledby="calculation-result-title"
      className="space-y-5 rounded-2xl border border-slate-700 bg-slate-900/80 p-5 text-slate-100 shadow-xl"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Resultado do cálculo
          </p>
          <h2
            id="calculation-result-title"
            className="mt-1 text-xl font-semibold"
          >
            {result.title}
          </h2>
        </div>

        <span
          className={
            isNormative
              ? "rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
              : "rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200"
          }
        >
          {isNormative ? "Normativo" : "Preliminar"}
        </span>
      </header>

      <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
        <h3 className="text-sm font-semibold text-slate-200">Fórmula</h3>
        <p className="mt-2 break-words font-mono text-sm text-cyan-100">
          {result.formula}
        </p>
      </div>

      {result.values.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-200">
            Valores calculados
          </h3>

          <dl className="grid gap-3 sm:grid-cols-2">
            {result.values.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="rounded-xl border border-slate-700 bg-slate-800/60 p-4"
              >
                <dt className="text-sm text-slate-300">{item.label}</dt>
                <dd className="mt-1 text-lg font-semibold text-white">
                  {numberFormatter.format(item.value)}{" "}
                  <span className="text-sm font-normal text-slate-400">
                    {item.unit}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {result.steps.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-200">
            Memória de cálculo
          </h3>
          <ol className="space-y-2">
            {result.steps.map((step, index) => (
              <li
                key={`${index}-${step}`}
                className="flex gap-3 rounded-lg bg-slate-800/50 p-3 text-sm leading-6 text-slate-300"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-semibold text-cyan-200">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {result.notes.length > 0 && (
        <aside className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h3 className="text-sm font-semibold text-amber-200">
            Premissas e limitações
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300">
            {result.notes.map((note, index) => (
              <li key={`${index}-${note}`}>{note}</li>
            ))}
          </ul>
        </aside>
      )}

      {result.source && (
        <aside className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <h3 className="text-sm font-semibold text-emerald-200">
            Referência normativa registrada
          </h3>

          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-400">Norma e edição</dt>
              <dd className="text-slate-200">
                {result.source.standardCode} — {result.source.edition}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Cláusula</dt>
              <dd className="text-slate-200">{result.source.clause}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Regra</dt>
              <dd className="text-slate-200">{result.source.ruleId}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Verificada em</dt>
              <dd className="text-slate-200">{result.source.verifiedAt}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Revisada por</dt>
              <dd className="text-slate-200">{result.source.reviewedBy}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Fonte</dt>
              <dd className="text-slate-200">
                {result.source.sourceUrl ? (
                  <a
                    className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-4 hover:text-cyan-200"
                    href={result.source.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {result.source.sourceLabel}
                  </a>
                ) : (
                  result.source.sourceLabel
                )}
              </dd>
            </div>
          </dl>

          <p className="mt-3 break-words text-xs text-slate-400">
            Referência: {result.source.sourceRef}
          </p>
        </aside>
      )}
    </section>
  );
}
