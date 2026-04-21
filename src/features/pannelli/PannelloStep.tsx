"use client";

import { useEffect, useMemo, useState } from "react";
import { formattaCentimetri, formattaKilowattPicco, formattaWatt } from "@/lib/formatters/units";
import {
  getCatalogoPannelli,
  type ApiResult,
} from "@/lib/services/surveyService";
import { resolveRuntimeMode } from "@/lib/runtimeMode";
import type { PanelCatalogItem } from "@/types/panels";
import { useWizard } from "@/features/wizard/WizardProvider";

const inputClassName =
  "mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";
const labelClassName = "text-sm font-medium";

export function PannelloStep() {
  const { actions, profilesHydrated, state } = useWizard();
  const [catalogResult, setCatalogResult] =
    useState<ApiResult<PanelCatalogItem[]> | null>(null);

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

    getCatalogoPannelli({ profile: state.active_client_profile }).then((result) => {
      if (mounted) {
        setCatalogResult(result);
      }
    });

    return () => {
      mounted = false;
    };
  }, [profilesHydrated, state.active_client_profile]);

  const catalogItems = catalogResult?.ok
    ? catalogResult.data.filter((item) => item.active)
    : [];
  const selectedPanel = useMemo(
    () =>
      catalogItems.find(
        (item) =>
          item.brand === state.panel_selection.brand &&
          item.model === state.panel_selection.model,
      ) ?? null,
    [catalogItems, state.panel_selection.brand, state.panel_selection.model],
  );
  const brandOptions = Array.from(
    new Set(catalogItems.map((item) => item.brand)),
  );
  const modelOptions = catalogItems.filter(
    (item) => item.brand === state.panel_selection.brand,
  );
  const targetOptions = buildTargetOptions(
    state.panel_technical_data.power_w,
    state.layout_config.target_module_count,
  );

  useEffect(() => {
    if (!selectedPanel) {
      return;
    }

    actions.impostaDatiTecniciPannello({
      width_cm: selectedPanel.width_cm,
      height_cm: selectedPanel.height_cm,
      power_w: selectedPanel.power_w,
      source: "catalogo",
    });
  }, [actions, selectedPanel]);

  function handleModeChange(mode: "max_modules" | "target_power") {
    actions.configuraTargetLayout({
      mode,
      target_module_count:
        mode === "target_power"
          ? state.layout_config.target_module_count
          : null,
      target_power_w:
        mode === "target_power" ? state.layout_config.target_power_w : null,
    });
  }

  function handleTargetChange(value: string) {
    const targetModuleCount = Number(value);

    actions.configuraTargetLayout({
      mode: "target_power",
      target_module_count:
        Number.isFinite(targetModuleCount) && targetModuleCount > 0
          ? targetModuleCount
          : null,
      target_power_w:
        Number.isFinite(targetModuleCount) &&
        targetModuleCount > 0 &&
        state.panel_technical_data.power_w > 0
          ? targetModuleCount * state.panel_technical_data.power_w
          : null,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Pannello e obiettivo impianto</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Inserisci il modulo FV e scegli l'obiettivo del layout.
        </p>
      </div>

      {catalogResult?.ok && catalogItems.length === 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)]">
          Catalogo live raggiunto, ma nessun pannello e disponibile per questo cliente. Inserisci i dati manualmente.
        </div>
      )}

      {catalogResult && !catalogResult.ok && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)]">
          {catalogResult.error}
        </div>
      )}

      <section className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h3 className="text-lg font-semibold">Pannello</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {catalogItems.length > 0 ? (
            <>
              <label className={labelClassName}>
                Marca *
                <select
                  className={inputClassName}
                  value={state.panel_selection.brand}
                  onChange={(event) =>
                    actions.impostaPannello(
                      {
                        brand: event.target.value,
                        model: "",
                      },
                      {
                        width_cm: 0,
                        height_cm: 0,
                        power_w: 0,
                        source: null,
                      },
                    )
                  }
                >
                  <option value="">Seleziona marca</option>
                  {brandOptions.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClassName}>
                Modello *
                <select
                  className={inputClassName}
                  value={state.panel_selection.model}
                  onChange={(event) =>
                    actions.impostaPannello({
                      brand: state.panel_selection.brand,
                      model: event.target.value,
                    })
                  }
                >
                  <option value="">Seleziona modello</option>
                  {modelOptions.map((item) => (
                    <option key={`${item.brand}-${item.model}`} value={item.model}>
                      {item.model}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <>
              <label className={labelClassName}>
                Marca *
                <input
                  className={inputClassName}
                  value={state.panel_selection.brand}
                  onChange={(event) =>
                    actions.impostaPannello({
                      brand: event.target.value,
                      model: state.panel_selection.model,
                    })
                  }
                />
              </label>

              <label className={labelClassName}>
                Modello *
                <input
                  className={inputClassName}
                  value={state.panel_selection.model}
                  onChange={(event) =>
                    actions.impostaPannello({
                      brand: state.panel_selection.brand,
                      model: event.target.value,
                    })
                  }
                />
              </label>
            </>
          )}
        </div>

        {selectedPanel && (
          <dl className="mt-5 grid gap-3 text-sm md:grid-cols-3">
            <SummaryItem label="Larghezza" value={formattaCentimetri(selectedPanel.width_cm)} />
            <SummaryItem label="Altezza" value={formattaCentimetri(selectedPanel.height_cm)} />
            <SummaryItem label="Potenza" value={formattaWatt(selectedPanel.power_w)} />
          </dl>
        )}
      </section>

      {!selectedPanel && (
        <section className="rounded-lg border border-[var(--border)] bg-white p-5">
          <h3 className="text-lg font-semibold">Dati modulo</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <NumberField
              label="Larghezza"
              value={state.panel_technical_data.width_cm}
              onChange={(value) =>
                actions.impostaDatiTecniciPannello({
                  ...state.panel_technical_data,
                  width_cm: value,
                  source: "manuale",
                })
              }
            />
            <NumberField
              label="Altezza"
              value={state.panel_technical_data.height_cm}
              onChange={(value) =>
                actions.impostaDatiTecniciPannello({
                  ...state.panel_technical_data,
                  height_cm: value,
                  source: "manuale",
                })
              }
            />
            <NumberField
              label="Potenza"
              suffix="W"
              value={state.panel_technical_data.power_w}
              onChange={(value) =>
                actions.impostaDatiTecniciPannello({
                  ...state.panel_technical_data,
                  power_w: value,
                  source: "manuale",
                })
              }
            />
          </div>
        </section>
      )}

      <section className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h3 className="text-lg font-semibold">Obiettivo impianto</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={labelClassName}>
            Modalita
            <select
              className={inputClassName}
              value={state.layout_config.mode}
              onChange={(event) =>
                handleModeChange(
                  event.target.value === "target_power"
                    ? "target_power"
                    : "max_modules",
                )
              }
            >
              <option value="max_modules">Massimo numero di moduli</option>
              <option value="target_power">Target impianto</option>
            </select>
          </label>

          {state.layout_config.mode === "target_power" && (
            <label className={labelClassName}>
              Target
              <select
                className={inputClassName}
                disabled={targetOptions.length === 0}
                value={state.layout_config.target_module_count ?? ""}
                onChange={(event) => handleTargetChange(event.target.value)}
              >
                <option value="">Seleziona un target</option>
                {targetOptions.map((option) => (
                  <option key={option.moduleCount} value={option.moduleCount}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </section>
    </div>
  );
}

type NumberFieldProps = {
  label: string;
  onChange: (value: number) => void;
  suffix?: string;
  value: number;
};

function NumberField({ label, onChange, suffix = "cm", value }: NumberFieldProps) {
  return (
    <label className={labelClassName}>
      {label} ({suffix})
      <input
        className={inputClassName}
        min={0}
        placeholder={suffix === "W" ? "Esempio: 430" : "Misura in cm"}
        type="number"
        value={formatNumberInput(value)}
        onChange={(event) => onChange(readPositiveNumber(event.target.value))}
      />
    </label>
  );
}

type SummaryItemProps = {
  label: string;
  value: string;
};

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div>
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function buildTargetOptions(
  panelPowerW: number,
  currentTargetModuleCount: number | null,
): Array<{ label: string; moduleCount: number }> {
  if (panelPowerW <= 0) {
    return [];
  }

  const maxOptionCount = Math.max(currentTargetModuleCount ?? 0, 80);

  return Array.from({ length: maxOptionCount }, (_, index) => {
    const moduleCount = index + 1;
    const targetPowerW = moduleCount * panelPowerW;

    return {
      moduleCount,
      label: `${moduleCount} ${moduleCount === 1 ? "modulo" : "moduli"} - ${formattaKilowattPicco(targetPowerW)}`,
    };
  });
}

function readPositiveNumber(value: string): number {
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

function shouldWaitForLiveProfile(
  profile: ReturnType<typeof useWizard>["state"]["active_client_profile"],
): boolean {
  return (
    resolveRuntimeMode(profile) === "live" &&
    (!profile || !profile.client_code.trim())
  );
}
