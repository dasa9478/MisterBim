export type CalculationValue = {
  label: string;
  value: number;
  unit: string;
};

export type CalculationSource = {
  standardCode: string;
  edition: string;
  clause: string;
  ruleId: string;
  verifiedAt: string;
  reviewedBy: string;
  sourceUrl?: string | null;
  sourceLabel: string;
  sourceRef: string;
};

export type CalculationResult = {
  title: string;
  classification: "normative" | "preliminary";
  formula: string;
  values: CalculationValue[];
  steps: string[];
  notes: string[];
  source?: CalculationSource | null;
};
