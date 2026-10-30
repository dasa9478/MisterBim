import { NextResponse } from "next/server";
import { z } from "zod";

const inputSchema = z
  .object({
    population: z.number().int().positive(),
    consumptionPerPersonLitersPerDay: z.number().finite().positive(),
    autonomyDays: z.number().finite().positive(),
  })
  .strict();

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
          "Informe uma população inteira e valores de consumo e autonomia maiores que zero.",
      },
      { status: 400 },
    );
  }

  const {
    population,
    consumptionPerPersonLitersPerDay,
    autonomyDays,
  } = parsed.data;

  const dailyConsumptionLiters =
    population * consumptionPerPersonLitersPerDay;

  const estimatedVolumeLiters = dailyConsumptionLiters * autonomyDays;

  return NextResponse.json({
    calculatorId: "reservoir-volume-by-population",
    classification: "preliminary",
    inputs: {
      population,
      consumptionPerPersonLitersPerDay,
      autonomyDays,
    },
    dailyConsumptionLiters,
    estimatedVolumeLiters,
    formula:
      "Volume estimado (L) = população × consumo per capita (L/pessoa·dia) × autonomia (dias)",
    steps: [
      `Consumo diário estimado = ${population} pessoas × ${consumptionPerPersonLitersPerDay} L/pessoa·dia = ${dailyConsumptionLiters} L/dia.`,
      `Volume estimado = ${dailyConsumptionLiters} L/dia × ${autonomyDays} dias = ${estimatedVolumeLiters} L.`,
    ],
    assumptions: [
      "O consumo per capita e os dias de autonomia são valores informados pelo usuário.",
      "O cálculo considera consumo constante durante o período de autonomia.",
    ],
    limitations: [
      "É uma estimativa preliminar baseada somente nos dados informados.",
      "Não define a divisão do volume entre reservatórios inferiores e superiores.",
      "Não considera volume indisponível, perdas, reposição ou variações de demanda.",
      "Não verifica atendimento a requisitos normativos nem substitui a análise do responsável técnico.",
    ],
  });
}
