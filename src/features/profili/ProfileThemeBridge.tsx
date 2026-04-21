"use client";

import { useEffect } from "react";
import { useClientProfiles } from "@/lib/clientProfiles";
import { THEME_TOKENS } from "./themeTokens";

export function ProfileThemeBridge() {
  const { activeProfile } = useClientProfiles();

  useEffect(() => {
    const theme = THEME_TOKENS[activeProfile?.preferred_theme ?? "scuro_teal"];
    const root = document.documentElement;

    root.style.setProperty("--background", theme.background);
    root.style.setProperty("--foreground", theme.foreground);
    root.style.setProperty("--muted", theme.muted);
    root.style.setProperty("--surface", theme.surface);
    root.style.setProperty("--surface-elevated", theme.surfaceElevated);
    root.style.setProperty("--surface-soft", theme.surfaceSoft);
    root.style.setProperty("--border", theme.border);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-strong", theme.accentStrong);
    root.style.setProperty("--accent-soft", theme.accentSoft);
    root.style.setProperty("--accent-foreground", theme.accentForeground);
    root.style.setProperty("--danger", theme.danger);
    root.style.setProperty("--success", theme.success);
    root.style.setProperty("--page-glow", theme.pageGlow);
    root.style.setProperty("--page-gradient-start", theme.pageGradientStart);
    root.style.setProperty("--page-gradient-mid", theme.pageGradientMid);
    root.style.setProperty("--page-gradient-end", theme.pageGradientEnd);
    root.style.setProperty("--input-placeholder", theme.inputPlaceholder);

    return undefined;
  }, [activeProfile?.preferred_theme]);

  return null;
}
