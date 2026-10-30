import { NextResponse } from "next/server";
import { z } from "zod";

const inputSchema = z
  .object({
    volumeLiters: z.number().finite().positive(),
    dailyConsumptionLiters: z.number().finite().positive(),
  })
  .strict();

function roundTo(value: number, decimalPlaces: number): number {
  const factor = 10 ** decimalPlaces;
  return Math.round(value * factor) / factor;
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

  const parsed = inputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Informe um volume disponível e um consumo diário maiores que zero.",
      },
      { status: 400 },
    );
  }

  const { volumeLiters, dailyConsumptionLiters } = parsed.data;
  const hourlyConsumptionLiters = dailyConsumptionLiters / 24;
  const autonomyHours = volumeLiters / hourlyConsumptionLiters;

  return NextResponse.json({
    calculatorId: "reservoir-autonomy",
    classification: "preliminary",
    inputs: {
      volumeLiters,
      dailyConsumptionLiters,
    },
    hourlyConsumptionLiters: roundTo(hourlyConsumptionLiters, 4),
    autonomyHours: roundTo(autonomyHours, 2),
    formula:
      "Autonomia (h) = volume disponível (L) ÷ [consumo diário (L/dia) ÷ 24 (h/dia)]",
    steps: [
      `Consumo médio horário = ${dailyConsumptionLiters} L/dia ÷ 24 h/dia = ${roundTo(hourlyConsumptionLiters, 4)} L/h.`,
      `Autonomia = ${volumeLiters} L ÷ ${roundTo(hourlyConsumptionLiters, 4)} L/h = ${roundTo(autonomyHours, 2)} h.`,
    ],
    assumptions: [
      "O consumo médio diário informado é distribuído uniformemente ao longo de 24 horas.",
      "O volume informado é o volume efetivamente disponível para consumo.",
    ],
    limitations: [
      "Não considera reposição de água, perdas, volume indisponível ou variações de demanda.",
      "Não determina o volume necessário do reservatório.",
      "Não verifica atendimento a requisitos normativos nem substitui a análise do responsável técnico.",
    ],
  });
}
