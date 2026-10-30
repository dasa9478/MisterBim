"use client";

import { useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "assistant" | "user";
  text: string;
};

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

const UPPER_RESERVOIR_PERCENT = 60;
const LOWER_RESERVOIR_PERCENT = 40;

const suggestions = [
  "Como estimar o consumo diário de água?",
  "Quais dados preciso para dimensionar um reservatório?",
  "Quais normas consultar para um projeto hidrossanitário?",
];

const navigation: [string, string][] = [
  ["Visão geral", "⌂"],
  ["Assistente técnico", "✳"],
  ["Dimensionamento", "⌗"],
  ["Biblioteca de normas", "▤"],
  ["Casos de projeto", "◫"],
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isCalculationResult(value: unknown): value is CalculationResult {
  if (!isRecord(value) || !isRecord(value.inputs)) {
    return false;
  }

  const inputs = value.inputs;

  return (
    value.classification === "preliminary" &&
    typeof inputs.population === "number" &&
    Number.isFinite(inputs.population) &&
    typeof inputs.consumptionPerPersonLitersPerDay === "number" &&
    Number.isFinite(inputs.consumptionPerPersonLitersPerDay) &&
    typeof inputs.autonomyDays === "number" &&
    Number.isFinite(inputs.autonomyDays) &&
    typeof value.dailyConsumptionLiters === "number" &&
    Number.isFinite(value.dailyConsumptionLiters) &&
    typeof value.estimatedVolumeLiters === "number" &&
    Number.isFinite(value.estimatedVolumeLiters) &&
    typeof value.formula === "string" &&
    isStringArray(value.steps) &&
    isStringArray(value.assumptions) &&
    isStringArray(value.limitations)
  );
}

function getApiError(value: unknown): string | null {
  if (isRecord(value) && typeof value.error === "string") {
    return value.error;
  }

  return null;
}

function formatNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
  }).format(value);
}

function Dimensionamento() {
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
      const response = await fetch("/api/engineering/reservoir-volume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          population: populationValue,
          consumptionPerPersonLitersPerDay: consumptionValue,
          autonomyDays: autonomyValue,
        }),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getApiError(data) || "Não foi possível executar o cálculo.",
        );
      }

      if (!isCalculationResult(data)) {
        throw new Error("O servidor retornou uma resposta inválida.");
      }

      setResult(data);
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

  const upperReservoirLiters = result
    ? result.estimatedVolumeLiters * (UPPER_RESERVOIR_PERCENT / 100)
    : 0;

  const lowerReservoirLiters = result
    ? result.estimatedVolumeLiters * (LOWER_RESERVOIR_PERCENT / 100)
    : 0;

  return (
    <div className="mx-auto w-full max-w-5xl p-5 sm:p-8">
      <header className="mb-8 border-b border-slate-800 pb-5">
        <p className="text-sm font-medium tracking-[0.2em] text-cyan-300">
          MISTERBIM · FERRAMENTAS
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-100 sm:text-4xl">
          Estimativa do volume de reservação
        </h1>
      </header>

      <section className="mb-6 rounded-2xl border border-cyan-900/70 bg-slate-900/80 p-5 sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
          Pré-cálculo
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-100">
          Volume baseado na população
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-300">
          Informe a população, o consumo per capita que deseja adotar e os dias
          de autonomia. O resultado é uma estimativa preliminar, não uma
          verificação normativa.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={handleSubmit}
          className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7"
        >
          <h2 className="text-lg font-semibold text-slate-100">
            Dados de entrada
          </h2>

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

          <p className="mt-5 rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-xs leading-5 text-slate-400">
            Divisão apresentada nesta ferramenta: {UPPER_RESERVOIR_PERCENT}% para
            o reservatório superior e {LOWER_RESERVOIR_PERCENT}% para o inferior.
            Confirme essa premissa para as condições do projeto; ela não
            representa, por si só, um requisito normativo.
          </p>

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
              <h2 className="mt-3 text-xl font-semibold text-slate-100">
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

              <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                <h3 className="font-semibold text-slate-100">
                  Divisão estimada entre reservatórios
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                  <li>
                    Reservatório superior ({UPPER_RESERVOIR_PERCENT}%):{" "}
                    {formatNumber(upperReservoirLiters)} L
                  </li>
                  <li>
                    Reservatório inferior ({LOWER_RESERVOIR_PERCENT}%):{" "}
                    {formatNumber(lowerReservoirLiters)} L
                  </li>
                </ul>
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  Divisão informativa calculada pela ferramenta a partir do
                  volume estimado. Valide a premissa para o projeto; ela não
                  comprova atendimento normativo.
                </p>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-slate-100">
                  Dados utilizados
                </h3>
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
                <h3 className="font-semibold text-slate-100">Fórmula</h3>
                <p className="mt-2 rounded-lg bg-slate-950 p-3 text-sm leading-6 text-slate-300">
                  {result.formula}
                </p>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-slate-100">
                  Memória de cálculo
                </h3>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-300">
                  {result.steps.map((step, index) => (
                    <li key={`${index}-${step}`}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-slate-100">Premissas</h3>
                  <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                    {result.assumptions.map((item, index) => (
                      <li key={`${index}-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-100">Limitações</h3>
                  <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                    {result.limitations.map((item, index) => (
                      <li key={`${index}-${item}`}>{item}</li>
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
        devem ser definidos para o caso do projeto e validados pelo responsável
        técnico.
      </p>
    </div>
  );
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeSection, setActiveSection] = useState("Visão geral");
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage(text: string) {
    const question = text.trim();

    if (!question || isLoading) {
      return;
    }

    setMessages((current) => [...current, { role: "user", text: question }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getApiError(data) || "Não foi possível obter uma resposta.",
        );
      }

      if (!isRecord(data)) {
        throw new Error("O servidor retornou uma resposta inválida.");
      }

      const answer =
        typeof data.answer === "string"
          ? data.answer.trim()
          : typeof data.reply === "string"
            ? data.reply.trim()
            : "";

      if (!answer) {
        throw new Error(
          getApiError(data) || "O servidor não retornou uma resposta.",
        );
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", text: answer },
      ]);
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error
          ? caughtError.message
          : "Não consegui responder agora.";

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: `${errorMessage} Confira a configuração da API e tente novamente.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="MisterBim, início">
          <span className="brand-mark">M</span>
          <span>
            <strong>MisterBim</strong>
            <small>INTELIGÊNCIA HIDROSSANITÁRIA</small>
          </span>
        </a>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation" aria-label="Navegação principal">
          {navigation.map(([label, icon]) => (
            <button
              className={`nav-item ${activeSection === label ? "active" : ""}`}
              key={label}
              onClick={() => setActiveSection(label)}
              type="button"
              aria-current={activeSection === label ? "page" : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                {icon}
              </span>
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="status-card">
            <span className="status-dot" aria-hidden="true" />
            <div>
              <strong>Ambiente de trabalho</strong>
              <small>Protótipo local</small>
            </div>
          </div>

          <div className="profile">
            <div className="profile-avatar" aria-hidden="true">
              D
            </div>
            <div>
              <strong>Daniel</strong>
              <small>Plano de demonstração</small>
            </div>
            <span className="profile-menu" aria-hidden="true">
              ···
            </span>
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-separator" aria-hidden="true">
              /
            </span>
            <strong>{activeSection}</strong>
          </div>

          <div className="topbar-right">
            <span className="system-status">
              <span className="status-dot" aria-hidden="true" />
              Sistema operacional
            </span>
            <button className="help-button" type="button" aria-label="Ajuda">
              ?
            </button>
          </div>
        </header>

        {activeSection === "Dimensionamento" ? (
          <Dimensionamento />
        ) : (
          <div className="dashboard">
            <section className="welcome-row">
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-line" aria-hidden="true" />
                  ENGENHARIA COM MAIS INTELIGÊNCIA
                </div>
                <h1>
                  Projetos melhores
                  <br />
                  começam com <span>boas perguntas.</span>
                </h1>
                <p className="welcome-copy">
                  Seu espaço de apoio técnico para instalações prediais.
                  Consulte, explore e organize suas decisões de projeto.
                </p>
              </div>

              <div className="assistant-orb" aria-label="Assistente Bia">
                <div className="orb-glow" aria-hidden="true" />
                <div className="orb" aria-hidden="true">
                  <span className="orb-letter">B</span>
                  <span className="orb-sparkle">✦</span>
                </div>
                <div className="orb-caption">
                  <span className="status-dot" aria-hidden="true" />
                  Bia está pronta
                </div>
              </div>
            </section>

            <section className="chat-panel" aria-labelledby="chat-title">
              <div className="chat-heading">
                <div className="chat-agent">
                  <div className="agent-avatar" aria-hidden="true">
                    B
                  </div>
                  <div>
                    <h2 id="chat-title">Converse com a Bia</h2>
                    <p>Assistente de engenharia hidrossanitária</p>
                  </div>
                </div>
                <span className="prototype-badge">As respostas são apoio preliminar e não substituem a análise do responsável técnico nem a consulta às normas vigentes.</span>
              </div>

              <div
                className="chat-content"
                aria-live="polite"
                aria-busy={isLoading}
              >
                {messages.length === 0 ? (
                  <div className="empty-chat">
                    <div className="greeting-icon" aria-hidden="true">
                      ✳
                    </div>
                    <h3>Olá, Daniel. O que vamos projetar hoje?</h3>
                    <p>
                      Faça uma pergunta ou escolha um dos tópicos para começar.
                    </p>

                    <div className="suggestions">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => void sendMessage(suggestion)}
                          type="button"
                          disabled={isLoading}
                        >
                          <span aria-hidden="true">↗</span>
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="message-list">
                    {messages.map((message, index) => (
                      <div
                        className={`message ${message.role}`}
                        key={`${message.role}-${index}`}
                      >
                        {message.role === "assistant" && (
                          <div className="message-avatar" aria-hidden="true">
                            B
                          </div>
                        )}
                        <div className="message-bubble">
                          {message.role === "assistant" ? (
                            <ReactMarkdown>{message.text}</ReactMarkdown>
                          ) : (
                            message.text
                          )}
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="message assistant">
                        <div className="message-avatar" aria-hidden="true">
                          B
                        </div>
                        <div className="message-bubble" role="status">
                          A Bia está analisando sua pergunta…
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <form className="chat-form" onSubmit={handleSubmit}>
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Pergunte sobre instalações hidrossanitárias..."
                  aria-label="Digite sua pergunta"
                  disabled={isLoading}
                />
                <button type="submit" disabled={!input.trim() || isLoading}>
                  {isLoading ? "Enviando…" : "Enviar"}{" "}
                  <span aria-hidden="true">↑</span>
                </button>
              </form>

              <p className="chat-disclaimer">
                As respostas deste protótipo são demonstrativas e não
                substituem a análise do responsável técnico nem a consulta às
                normas vigentes.
              </p>
            </section>

            <section className="tools-section">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">FERRAMENTAS</span>
                  <h2>Comece por aqui</h2>
                </div>
                <button
                  className="view-all"
                  onClick={() => setActiveSection("Dimensionamento")}
                  type="button"
                >
                  Explorar ferramentas <span aria-hidden="true">→</span>
                </button>
              </div>

              <div className="tool-grid">
                <button
                  className="tool-card"
                  onClick={() => setActiveSection("Dimensionamento")}
                  type="button"
                >
                  <span className="tool-icon cyan" aria-hidden="true">
                    ⌗
                  </span>
                  <span className="tool-card-title">
                    Dimensionamento rápido
                  </span>
                  <span className="tool-card-copy">
                    Acesse estimativas e ferramentas de apoio ao projeto.
                  </span>
                  <span className="tool-arrow" aria-hidden="true">
                    ↗
                  </span>
                </button>

                <button
                  className="tool-card"
                  onClick={() => setActiveSection("Biblioteca de normas")}
                  type="button"
                >
                  <span className="tool-icon violet" aria-hidden="true">
                    ▤
                  </span>
                  <span className="tool-card-title">Biblioteca técnica</span>
                  <span className="tool-card-copy">
                    Organize consultas de normas e referências técnicas.
                  </span>
                  <span className="tool-arrow" aria-hidden="true">
                    ↗
                  </span>
                </button>

                <button
                  className="tool-card"
                  onClick={() => setActiveSection("Casos de projeto")}
                  type="button"
                >
                  <span className="tool-icon gold" aria-hidden="true">
                    ◫
                  </span>
                  <span className="tool-card-title">Casos de projeto</span>
                  <span className="tool-card-copy">
                    Explore exemplos e decisões de engenharia aplicadas.
                  </span>
                  <span className="tool-arrow" aria-hidden="true">
                    ↗
                  </span>
                </button>
              </div>
            </section>

            <footer className="page-footer">
              <span>MisterBim · Hub de inteligência para projetos prediais</span>
              <span>Protótipo inicial</span>
            </footer>
          </div>
        )}
      </section>
    </main>
  );
}
