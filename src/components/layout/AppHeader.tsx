"use client";

import { useContext, useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { createSurveyPhotosFromFiles } from "@/features/foto/photoFactory";
import { WizardContext } from "@/features/wizard/WizardProvider";
import { useClientProfiles } from "@/lib/clientProfiles";
import { isDemoMode } from "@/lib/runtimeMode";

export function AppHeader() {
  const { activeProfile } = useClientProfiles();
  const wizard = useContext(WizardContext);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [preferCamera, setPreferCamera] = useState(false);
  const photosCount = wizard?.state.photos.length ?? 0;
  const isObstaclesStep = wizard?.state.currentStepId === "ostacoli";
  const demoModeActive = isDemoMode(activeProfile);

  useEffect(() => {
    setPreferCamera(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  function handlePhotosSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0 || !wizard) {
      return;
    }

    wizard.actions.aggiungiFotoSopralluogo(createSurveyPhotosFromFiles(files));
    event.target.value = "";
  }

  return (
    <header
      className={`z-40 border-b border-[var(--border)] bg-[var(--surface-elevated)] backdrop-blur ${
        isObstaclesStep ? "relative" : "sticky top-0"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
            {activeProfile?.company_name || "Profilo non impostato"}
          </p>
          <h1 className="truncate text-base font-semibold text-[var(--foreground)] sm:text-lg">
            Sopralluogo fotovoltaico
          </h1>
        </div>
        <nav className="flex shrink-0 items-center gap-2">
          {demoModeActive && (
            <span className="rounded-lg border border-amber-300/70 bg-amber-200/15 px-2 py-1 text-xs font-semibold text-amber-200">
              Demo
            </span>
          )}
          {wizard && (
            <>
              <button
                aria-label="Aggiungi foto"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                type="button"
                onClick={() => photoInputRef.current?.click()}
              >
                <CameraIcon />
                {photosCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-[var(--accent-foreground)]">
                    {photosCount > 9 ? "9+" : photosCount}
                  </span>
                )}
              </button>
              <input
                ref={photoInputRef}
                accept="image/*"
                capture={preferCamera ? "environment" : undefined}
                className="sr-only"
                multiple
                type="file"
                onChange={handlePhotosSelected}
              />
            </>
          )}
          <Link
            aria-label="Impostazioni"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
            href="/impostazioni"
          >
            <SettingsIcon />
          </Link>
        </nav>
      </div>
    </header>
  );
}

function CameraIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M4 8.5h3l1.4-2h7.2l1.4 2h3v10H4v-10Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m19 13.1-2.1.5a5.9 5.9 0 0 1-.7 1.7l1.1 1.8-1.6 1.6-1.8-1.1a5.9 5.9 0 0 1-1.7.7l-.5 2.1H9.5L9 18.3a5.9 5.9 0 0 1-1.7-.7l-1.8 1.1-1.6-1.6 1.1-1.8a5.9 5.9 0 0 1-.7-1.7l-2.1-.5v-2.2l2.1-.5c.2-.6.4-1.2.7-1.7L3.9 6.9l1.6-1.6 1.8 1.1c.5-.3 1.1-.5 1.7-.7l.5-2.1h2.2l.5 2.1c.6.2 1.2.4 1.7.7l1.8-1.1 1.6 1.6-1.1 1.8c.3.5.5 1.1.7 1.7l2.1.5v2.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
