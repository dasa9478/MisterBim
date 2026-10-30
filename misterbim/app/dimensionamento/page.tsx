"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type CalculationResult = {
  classification: "preliminary";
  inputs: {
    volumeLiters: number;
    dailyConsumptionLiters: number;
  };
  hourlyConsumptionLiters: number;
  autonomyHours: number;
  formula: string;
  steps: string[];
  assumptions: string[];
  limitations: string[];
};

function formatNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
  }).format(value);
}

export default function DimensionamentoPage() {
  const [volumeLiters, setVolumeLiters] = useState("");
  const [dailyConsumptionLiters, setDailyConsumptionLiters] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    const volume = Number(volumeLiters);
    const consumption = Number(dailyConsumptionLiters);

    if (
      !Number.isFinite(volume) ||
      !Number.isFinite(consumption) ||
      volume <= 0 ||
      consumption <= 0
    ) {
      setError("Informe valores numéricos maiores que zero.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/engineering/reservoir-autonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volumeLiters: volume,
          dailyConsumptionLiters: consumption,
        }),
      });

      const data = (await response.json()) as
        | CalculationResult
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in data
            ? data.error || "Não foi possível executar o cálculo."
            : "Não foi possível executar o cálculo.",
        );
      }

      setResult(data as CalculationResult);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Falha ao comunicar com o servidor.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5">
          <Link
            href="/"
            className="text-sm text-cyan-300 hover:text-cyan-200"
          >
            ← Voltar ao MisterBim
          </Link>
        </div>

        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <p className="text-sm font-medium tracking-[0.2em] text-cyan-300">
              MISTERBIM · FERRAMENTAS
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              Dimensionamento rápido
            </h1>
          </div>

          <Link
            href="/"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
          >
            ← Voltar ao início
          </Link>
        </header>

        <section className="mb-6 rounded-2xl border border-cyan-900/70 bg-slate-900/80 p-5 sm:p-7">
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
            Pré-cálculo
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Autonomia do reservatório
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-300">
            Estime por quantas horas o volume disponível duraria com base no
            consumo diário informado. O cálculo pressupõe consumo uniforme ao
            longo do dia.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={handleSubmit}
            className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7"
          >
            <h2 className="text-lg font-semibold">Dados de entrada</h2>

            <label className="mt-6 block">
              <span className="mb-2 block text-sm text-slate-300">
                Volume disponível no reservatório (L)
              </span>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={volumeLiters}
                onChange={(event) => setVolumeLiters(event.target.value)}
                placeholder="Ex.: 5000"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
              />
            </label>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm text-slate-300">
                Consumo médio diário (L/dia)
              </span>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={dailyConsumptionLiters}
                onChange={(event) =>
                  setDailyConsumptionLiters(event.target.value)
                }
                placeholder="Ex.: 1200"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
              />
            </label>

            {error && (
              <p
                role="alert"
                className="mt-5 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 w-full rounded-lg bg-cyan-300 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60"
            >
              {isLoading ? "Calculando…" : "Calcular autonomia"}
            </button>

            <p className="mt-4 text-xs leading-5 text-slate-400">
              Use o volume efetivamente disponível para consumo, não
              necessariamente a capacidade nominal total do reservatório.
            </p>
          </form>

          <section
            aria-live="polite"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7"
          >
            {!result ? (
              <div className="flex min-h-64 flex-col justify-center">
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Resultado
                </p>
                <h2 className="mt-3 text-xl font-semibold">
                  A memória de cálculo aparecerá aqui
                </h2>
                <p className="mt-3 leading-7 text-slate-400">
                  Preencha os dois dados e selecione “Calcular autonomia”.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
                  Resultado preliminar
                </p>

                <div className="mt-4 rounded-xl border border-cyan-900 bg-slate-950 p-5">
                  <p className="text-sm text-slate-400">Autonomia estimada</p>
                  <p className="mt-2 text-4xl font-bold text-cyan-200">
                    {formatNumber(result.autonomyHours)} h
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Consumo médio horário:{" "}
                    {formatNumber(result.hourlyConsumptionLiters, 4)} L/h
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold">Dados utilizados</h3>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-300">
                    <li>
                      Volume disponível:{" "}
                      {formatNumber(result.inputs.volumeLiters)} L
                    </li>
                    <li>
                      Consumo diário:{" "}
                      {formatNumber(result.inputs.dailyConsumptionLiters)} L/dia
                    </li>
                  </ul>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold">Fórmula</h3>
                  <p className="mt-2 rounded-lg bg-slate-950 p-3 text-sm leading-6 text-slate-300">
                    {result.formula}
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold">Memória de cálculo</h3>
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-300">
                    {result.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <h3 className="font-semibold">Premissas</h3>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                      {result.assumptions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold">Limitações</h3>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                      {result.limitations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        <p className="mt-6 text-xs leading-5 text-slate-500">
          Ferramenta de apoio preliminar. O resultado não comprova conformidade
          normativa e deve ser avaliado pelo responsável técnico com os dados e
          critérios aplicáveis ao projeto.
        </p>
      </div>
    </main>
  );
}
