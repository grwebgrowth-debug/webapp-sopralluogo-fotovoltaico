"use client";

import { useEffect, useMemo, useState } from "react";
import { useWizard } from "@/features/wizard/WizardProvider";
import {
  getOpzioniInverter,
  type ApiResult,
} from "@/lib/services/surveyService";
import { resolveRuntimeMode } from "@/lib/runtimeMode";
import type { InverterCatalogItem } from "@/types/panels";

const inputClassName =
  "mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";
const labelClassName = "text-sm font-medium";

export function ComponentiImpiantoStep() {
  const { actions, profilesHydrated, state } = useWizard();
  const [catalogResult, setCatalogResult] =
    useState<ApiResult<InverterCatalogItem[]> | null>(null);

  useEffect(() => {
    if (!profilesHydrated) {
      setCatalogResult(null);
      return;
    }

    if (shouldWaitForLiveProfile(state.active_client_profile)) {
      setCatalogResult({
        ok: false,
        reason: "not_configured",
        error: "Slug cliente non configurato per il recupero del catalogo live.",
      });
      return;
    }

    let mounted = true;

    getOpzioniInverter({ profile: state.active_client_profile }).then((result) => {
      if (mounted) {
        setCatalogResult(result);
      }
    });

    return () => {
      mounted = false;
    };
  }, [profilesHydrated, state.active_client_profile]);

  const inverterOptions = useMemo(() => {
    if (!catalogResult?.ok) {
      return state.system_components.inverter
        ? [state.system_components.inverter]
        : [];
    }

    if (
      state.system_components.inverter &&
      !catalogResult.data.some(
        (item) => item.componente_id === state.system_components.inverter?.componente_id,
      )
    ) {
      return [...catalogResult.data, state.system_components.inverter];
    }

    return catalogResult.data;
  }, [catalogResult, state.system_components.inverter]);

  function handleInverterChange(value: string) {
    if (!value) {
      actions.aggiornaComponentiImpianto({ inverter: null });
      return;
    }

    actions.aggiornaComponentiImpianto({
      inverter:
        inverterOptions.find((item) => item.componente_id === value) ?? null,
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Componenti e note impianto</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Completa i dati tecnici essenziali prima della documentazione finale.
        </p>
      </div>

      {catalogResult && !catalogResult.ok && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)]">
          {catalogResult.error}
        </div>
      )}

      <section className="rounded-lg border border-[var(--border)] bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClassName}>
            Inverter *
            <select
              className={inputClassName}
              value={state.system_components.inverter?.componente_id ?? ""}
              onChange={(event) => handleInverterChange(event.target.value)}
            >
              <option value="">Seleziona inverter</option>
              {inverterOptions.map((option) => (
                <option key={option.componente_id} value={option.componente_id}>
                  {formatInverterOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            Lunghezza stimata cavi (m)
            <input
              className={inputClassName}
              min={0}
              placeholder="Esempio: 25"
              type="number"
              value={formatNumberInput(state.system_components.cable_length_m)}
              onChange={(event) =>
                actions.aggiornaComponentiImpianto({
                  cable_length_m: readNonNegativeNumber(event.target.value),
                })
              }
            />
          </label>

          <label className={`${labelClassName} md:col-span-2`}>
            Note tecniche
            <textarea
              className={`${inputClassName} min-h-24 resize-y`}
              placeholder="Vincoli di posa, accessibilita, predisposizioni o verifiche da fare."
              value={state.system_components.technical_notes}
              onChange={(event) =>
                actions.aggiornaComponentiImpianto({
                  technical_notes: event.target.value,
                })
              }
            />
          </label>
        </div>
      </section>
    </div>
  );
}

export function getInverterLabel(inverter: InverterCatalogItem | null): string {
  if (!inverter) {
    return "Non selezionato";
  }

  return formatInverterOptionLabel(inverter);
}

function readNonNegativeNumber(value: string): number {
  if (value.trim() === "") {
    return 0;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0;
  }

  return numericValue;
}

function formatNumberInput(value: number): string {
  return value > 0 ? String(value) : "";
}

function formatInverterOptionLabel(option: InverterCatalogItem): string {
  if (
    typeof option.potenza_nominale_kw === "number" &&
    Number.isFinite(option.potenza_nominale_kw) &&
    option.potenza_nominale_kw > 0
  ) {
    return `${option.descrizione} - ${option.potenza_nominale_kw} kW`;
  }

  return option.descrizione;
}

function shouldWaitForLiveProfile(
  profile: ReturnType<typeof useWizard>["state"]["active_client_profile"],
): boolean {
  return (
    resolveRuntimeMode(profile) === "live" &&
    (!profile || !profile.client_code.trim())
  );
}
