"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type CalculationResult = {
  classification: "preliminary";
  inputs: {
    population: number;
    consumptionPerPersonLitersPerDay: number;
    autonomyDays: number;
  };
  dailyConsumptionLiters: number;
  estimatedVolumeLiters: number;
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

export default function VolumeReservatorioPage() {
  const [population, setPopulation] = useState("");
  const [consumption, setConsumption] = useState("");
  const [autonomyDays, setAutonomyDays] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    const populationValue = Number(population);
    const consumptionValue = Number(consumption);
    const autonomyValue = Number(autonomyDays);

    if (
      !Number.isInteger(populationValue) ||
      populationValue <= 0 ||
      !Number.isFinite(consumptionValue) ||
      consumptionValue <= 0 ||
      !Number.isFinite(autonomyValue) ||
      autonomyValue <= 0
    ) {
      setError(
        "Informe uma população inteira e valores de consumo e autonomia maiores que zero.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        "/api/engineering/reservoir-volume",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            population: populationValue,
            consumptionPerPersonLitersPerDay: consumptionValue,
            autonomyDays: autonomyValue,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
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
            href="/dimensionamento"
            className="text-sm text-cyan-300 hover:text-cyan-200"
          >
            ← Voltar ao dimensionamento
          </Link>
        </div>

        <header className="mb-8 border-b border-slate-800 pb-5">
          <p className="text-sm font-medium tracking-[0.2em] text-cyan-300">
            MISTERBIM · FERRAMENTAS
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            Estimativa do volume de reservação
          </h1>
        </header>

        <section className="mb-6 rounded-2xl border border-cyan-900/70 bg-slate-900/80 p-5 sm:p-7">
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
            Pré-cálculo
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Volume baseado na população
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-300">
            Informe a população, o consumo per capita que deseja adotar e os
            dias de autonomia. O resultado é uma estimativa preliminar, não
            uma verificação normativa.
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
                População (pessoas)
              </span>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={population}
                onChange={(event) => setPopulation(event.target.value)}
                placeholder="Ex.: 100"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
              />
            </label>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm text-slate-300">
                Consumo per capita (L/pessoa·dia)
              </span>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={consumption}
                onChange={(event) => setConsumption(event.target.value)}
                placeholder="Informe o valor a adotar"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
              />
            </label>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm text-slate-300">
                Autonomia (dias)
              </span>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={autonomyDays}
                onChange={(event) => setAutonomyDays(event.target.value)}
                placeholder="Ex.: 1"
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
              {isLoading ? "Calculando…" : "Estimar volume"}
            </button>
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
                  A estimativa aparecerá aqui
                </h2>
                <p className="mt-3 leading-7 text-slate-400">
                  Preencha os três dados e selecione “Estimar volume”.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
                  Resultado preliminar
                </p>

                <div className="mt-4 rounded-xl border border-cyan-900 bg-slate-950 p-5">
                  <p className="text-sm text-slate-400">
                    Volume estimado de reservação
                  </p>
                  <p className="mt-2 text-4xl font-bold text-cyan-200">
                    {formatNumber(result.estimatedVolumeLiters)} L
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Consumo diário estimado:{" "}
                    {formatNumber(result.dailyConsumptionLiters)} L/dia
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold">Dados utilizados</h3>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-300">
                    <li>
                      População: {formatNumber(result.inputs.population)} pessoas
                    </li>
                    <li>
                      Consumo per capita:{" "}
                      {formatNumber(
                        result.inputs.consumptionPerPersonLitersPerDay,
                      )}{" "}
                      L/pessoa·dia
                    </li>
                    <li>
                      Autonomia: {formatNumber(result.inputs.autonomyDays)} dias
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
          Ferramenta de apoio preliminar. O consumo per capita e a autonomia
          devem ser definidos para o caso do projeto e validados pelo
          responsável técnico.
        </p>
      </div>
    </main>
  );
}
