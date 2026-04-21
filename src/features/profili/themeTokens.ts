import type { ClientThemePreference } from "@/types/profiles";

type ThemeTokenSet = {
  accent: string;
  accentForeground: string;
  accentSoft: string;
  accentStrong: string;
  background: string;
  border: string;
  danger: string;
  foreground: string;
  inputPlaceholder: string;
  muted: string;
  pageGlow: string;
  pageGradientEnd: string;
  pageGradientMid: string;
  pageGradientStart: string;
  success: string;
  surface: string;
  surfaceElevated: string;
  surfaceSoft: string;
};

export const THEME_OPTIONS: Array<{
  value: ClientThemePreference;
  label: string;
}> = [
  { value: "scuro_teal", label: "Scuro tecnico" },
  { value: "chiaro_pulito", label: "Chiaro pulito" },
  { value: "chiaro_contrasto", label: "Chiaro contrasto alto" },
  { value: "scuro_verde", label: "Scuro verde" },
  { value: "scuro_blu", label: "Scuro blu" },
];

export const THEME_TOKENS: Record<ClientThemePreference, ThemeTokenSet> = {
  scuro_teal: {
    accent: "#14b8a6",
    accentForeground: "#05231f",
    accentSoft: "rgba(20, 184, 166, 0.12)",
    accentStrong: "#0f766e",
    background: "#071311",
    border: "#27423c",
    danger: "#fca5a5",
    foreground: "#edf7f4",
    inputPlaceholder: "#6f8881",
    muted: "#9bb2ac",
    pageGlow: "rgba(20, 184, 166, 0.12)",
    pageGradientEnd: "#050d0c",
    pageGradientMid: "#081816",
    pageGradientStart: "#071311",
    success: "#6ee7b7",
    surface: "#10201d",
    surfaceElevated: "#142823",
    surfaceSoft: "#0c1b18",
  },
  scuro_verde: {
    accent: "#22c55e",
    accentForeground: "#05210f",
    accentSoft: "rgba(34, 197, 94, 0.12)",
    accentStrong: "#15803d",
    background: "#08140d",
    border: "#294334",
    danger: "#fca5a5",
    foreground: "#eef8f0",
    inputPlaceholder: "#728a7a",
    muted: "#9cb4a3",
    pageGlow: "rgba(34, 197, 94, 0.12)",
    pageGradientEnd: "#06100a",
    pageGradientMid: "#0a1810",
    pageGradientStart: "#08140d",
    success: "#86efac",
    surface: "#102118",
    surfaceElevated: "#152a1f",
    surfaceSoft: "#0d1a13",
  },
  scuro_blu: {
    accent: "#60a5fa",
    accentForeground: "#071726",
    accentSoft: "rgba(96, 165, 250, 0.14)",
    accentStrong: "#2563eb",
    background: "#0a1218",
    border: "#263845",
    danger: "#fca5a5",
    foreground: "#eef5fb",
    inputPlaceholder: "#718695",
    muted: "#9cb0bf",
    pageGlow: "rgba(96, 165, 250, 0.12)",
    pageGradientEnd: "#070d11",
    pageGradientMid: "#0b151c",
    pageGradientStart: "#0a1218",
    success: "#86efac",
    surface: "#101d27",
    surfaceElevated: "#16242e",
    surfaceSoft: "#0c1720",
  },
  chiaro_pulito: {
    accent: "#0f766e",
    accentForeground: "#f7fffd",
    accentSoft: "rgba(15, 118, 110, 0.12)",
    accentStrong: "#115e59",
    background: "#f3f7f6",
    border: "#c4d6d2",
    danger: "#b91c1c",
    foreground: "#13211d",
    inputPlaceholder: "#7b8f89",
    muted: "#60736d",
    pageGlow: "rgba(15, 118, 110, 0.10)",
    pageGradientEnd: "#e6efec",
    pageGradientMid: "#edf4f2",
    pageGradientStart: "#f3f7f6",
    success: "#047857",
    surface: "#ffffff",
    surfaceElevated: "#f8fbfa",
    surfaceSoft: "#ecf4f2",
  },
  chiaro_contrasto: {
    accent: "#b91c1c",
    accentForeground: "#fff8f8",
    accentSoft: "rgba(185, 28, 28, 0.10)",
    accentStrong: "#991b1b",
    background: "#ffffff",
    border: "#b6bcc5",
    danger: "#991b1b",
    foreground: "#121212",
    inputPlaceholder: "#6b7280",
    muted: "#4b5563",
    pageGlow: "rgba(185, 28, 28, 0.08)",
    pageGradientEnd: "#edf1f5",
    pageGradientMid: "#f7f8fa",
    pageGradientStart: "#ffffff",
    success: "#166534",
    surface: "#ffffff",
    surfaceElevated: "#f7f8fa",
    surfaceSoft: "#eff2f6",
  },
};
