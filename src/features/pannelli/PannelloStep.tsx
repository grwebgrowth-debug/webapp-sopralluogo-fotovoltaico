"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApiResult } from "@/lib/api/n8n";
import { recuperaCatalogoPannelliDaN8n } from "@/lib/api/n8n";
import { formattaCentimetri, formattaWatt } from "@/lib/formatters/units";
import type { PanelCatalogItem } from "@/types/panels";
import { useWizard } from "@/features/wizard/WizardProvider";

const inputClassName =
  "mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";
const labelClassName = "text-sm font-medium";

export function PannelloStep() {
  const { actions, state } = useWizard();
  const [catalogResult, setCatalogResult] =
    useState<ApiResult<PanelCatalogItem[]> | null>(null);

  useEffect(() => {
    let mounted = true;

    recuperaCatalogoPannelliDaN8n().then((result) => {
      if (mounted) {
        setCatalogResult(result);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Pannello</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Seleziona marca e modello del pannello. La fonte prevista è il
          catalogo pannelli su Google Sheet, letto dalla web app tramite n8n.
        </p>
      </div>

      {catalogResult && !catalogResult.ok && catalogResult.reason !== "not_configured" && (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm leading-6 text-[var(--muted)]">
          {catalogResult.error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {catalogItems.length > 0 ? (
          <>
            <label className={labelClassName}>
              Marca pannello *
              <select
                className={inputClassName}
                value={state.panel_selection.brand}
                onChange={(event) =>
                  actions.impostaPannello({
                    brand: event.target.value,
                    model: "",
                  }, {
                    width_cm: 0,
                    height_cm: 0,
                    power_w: 0,
                    source: null,
                  })
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
              Modello pannello *
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
              Marca pannello *
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
              Modello pannello *
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

      <section className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h3 className="text-lg font-semibold">Riepilogo pannello</h3>
        {selectedPanel ? (
          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <SummaryItem label="Marca" value={selectedPanel.brand} />
            <SummaryItem label="Modello" value={selectedPanel.model} />
            <SummaryItem
              label="Larghezza pannello"
              value={formattaCentimetri(selectedPanel.width_cm)}
            />
            <SummaryItem
              label="Altezza pannello"
              value={formattaCentimetri(selectedPanel.height_cm)}
            />
            <SummaryItem
              label="Potenza pannello"
              value={formattaWatt(selectedPanel.power_w)}
            />
            <SummaryItem
              label="Orientamento consentito"
              value={selectedPanel.allowed_orientation}
            />
            <SummaryItem
              label="Note"
              value={selectedPanel.notes || "Nessuna nota"}
            />
          </dl>
        ) : (
          <div className="mt-3 text-sm leading-6 text-[var(--muted)]">
            <p>
              Marca selezionata:{" "}
              <strong>{state.panel_selection.brand || "Non indicata"}</strong>
            </p>
            <p>
              Modello selezionato:{" "}
              <strong>{state.panel_selection.model || "Non indicato"}</strong>
            </p>
            <p className="mt-3">
              Dati inseriti manualmente in attesa del catalogo Google Sheet
              tramite n8n.
            </p>
          </div>
        )}
      </section>

      {!selectedPanel && (
        <section className="rounded-lg border border-[var(--border)] bg-white p-5">
          <h3 className="text-lg font-semibold">Dati tecnici per layout</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Catalogo pannelli non ancora collegato a Google Sheet tramite n8n.
            Inserisci i dati minimi per calcolare il layout preliminare.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <NumberField
              label="Larghezza pannello"
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
              label="Altezza pannello"
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
              label="Potenza pannello"
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
