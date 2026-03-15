// CHART_COLORS — paleta derivada dos tokens CSS do design system
// Ordem: primary-600, primary-700, primary-500, complementary, primary-300
export const CHART_COLORS = [
  "#3CA2C4", // --chart-1 / primary-600
  "#267A96", // --chart-2 / primary-700
  "#52B8D8", // --chart-3 / primary-500
  "#C4603C", // --chart-4 / complementary
  "#96D8E8", // --chart-5 / primary-300
] as const;

export type ChartColor = (typeof CHART_COLORS)[number];
