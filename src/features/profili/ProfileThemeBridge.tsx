"use client";

import { useEffect } from "react";
import type { ClientThemePreference } from "@/types/profiles";
import { useClientProfiles } from "@/lib/clientProfiles";

const THEME_ACCENTS: Record<ClientThemePreference, string> = {
  scuro_teal: "#14b8a6",
  scuro_verde: "#22c55e",
  scuro_blu: "#60a5fa",
};

export function ProfileThemeBridge() {
  const { activeProfile } = useClientProfiles();

  useEffect(() => {
    const accent = THEME_ACCENTS[activeProfile?.preferred_theme ?? "scuro_teal"];
    document.documentElement.style.setProperty("--accent", accent);

    return () => {
      document.documentElement.style.removeProperty("--accent");
    };
  }, [activeProfile?.preferred_theme]);

  return null;
}
