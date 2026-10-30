import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const MAX_MESSAGES = 60;
const MAX_MESSAGE_CHARS = 8_000;
const MAX_TOTAL_CHARS = 60_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isChatMessage(value: unknown): value is ChatMessage {
  return (
    isRecord(value) &&
    (value.role === "user" || value.role === "assistant") &&
    typeof value.content === "string"
  );
}

function extractAnswer(data: unknown): string {
  if (!isRecord(data)) return "";

  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (!Array.isArray(data.output)) return "";

  const textParts: string[] = [];

  for (const outputItem of data.output) {
    if (
      !isRecord(outputItem) ||
      outputItem.type !== "message" ||
      outputItem.role !== "assistant" ||
      !Array.isArray(outputItem.content)
    ) {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (
        isRecord(contentItem) &&
        contentItem.type === "output_text" &&
        typeof contentItem.text === "string" &&
        contentItem.text.trim()
      ) {
        textParts.push(contentItem.text.trim());
      }
    }
  }

  return textParts.join("\n\n").trim();
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "O corpo da solicitação não contém JSON válido." },
      { status: 400 },
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { error: "Envie a conversa no campo messages." },
      { status: 400 },
    );
  }

  let rawMessages: unknown;

  if (Array.isArray(body.messages)) {
    rawMessages = body.messages;
  } else if (
    typeof body.question === "string" &&
    body.question.trim().length > 0
  ) {
    // Compatibilidade com chamadas antigas: este formato não inclui o histórico.
    rawMessages = [{ role: "user", content: body.question }];
  } else {
    return NextResponse.json(
      { error: "Envie a conversa no campo messages." },
      { status: 400 },
    );
  }

  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return NextResponse.json(
      { error: "Envie ao menos uma mensagem." },
      { status: 400 },
    );
  }

  if (rawMessages.length > MAX_MESSAGES) {
    return NextResponse.json(
      {
        error:
          "A conversa excede o limite de mensagens. Reduza ou consolide o histórico, preservando os dados técnicos já informados.",
      },
      { status: 413 },
    );
  }

  if (!rawMessages.every(isChatMessage)) {
    return NextResponse.json(
      {
        error:
          "Há mensagens inválidas. Cada mensagem precisa ter role user ou assistant e conteúdo em texto.",
      },
      { status: 400 },
    );
  }

  const messages: ChatMessage[] = rawMessages.map((message) => ({
    role: message.role,
    content: message.content.trim(),
  }));

  if (messages.some((message) => message.content.length === 0)) {
    return NextResponse.json(
      { error: "As mensagens não podem estar vazias." },
      { status: 400 },
    );
  }

  if (messages.some((message) => message.content.length > MAX_MESSAGE_CHARS)) {
    return NextResponse.json(
      {
        error:
          "Uma mensagem excede o limite de tamanho. Reduza o conteúdo mantendo os dados relevantes.",
      },
      { status: 413 },
    );
  }

  const totalChars = messages.reduce(
    (total, message) => total + message.content.length,
    0,
  );

  if (totalChars > MAX_TOTAL_CHARS) {
    return NextResponse.json(
      {
        error:
          "O histórico excede o limite de tamanho. Consolide as mensagens antigas sem remover parâmetros, decisões ou pendências importantes.",
      },
      { status: 413 },
    );
  }

  if (messages[messages.length - 1].role !== "user") {
    return NextResponse.json(
      { error: "A última mensagem precisa ser do usuário." },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "A chave da API não está configurada no servidor." },
      { status: 500 },
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: SYSTEM_PROMPT,
        input: messages,
        max_output_tokens: 1800,
        store: false,
      }),
    });

    const data: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Falha ao consultar a API de IA:", response.status);

      return NextResponse.json(
        { error: "Não foi possível consultar a assistente agora." },
        { status: 502 },
      );
    }

    const answer = extractAnswer(data);

    if (!answer) {
      console.error("A API de IA respondeu sem texto extraível.");

      return NextResponse.json(
        { error: "A API respondeu, mas não retornou texto para exibir." },
        { status: 502 },
      );
    }

    return NextResponse.json({ answer });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "A consulta excedeu o tempo limite. Tente novamente." },
        { status: 504 },
      );
    }

    console.error("Erro ao consultar a API de IA.");

    return NextResponse.json(
      { error: "Não foi possível consultar a assistente agora." },
      { status: 502 },
    );
  }
}
