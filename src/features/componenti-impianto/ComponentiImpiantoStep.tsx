"use client";

import type { SystemInverterOption } from "@/types/survey";
import { useWizard } from "@/features/wizard/WizardProvider";

const INVERTER_OPTIONS: Array<{ value: SystemInverterOption; label: string }> = [
  { value: "microinverter", label: "Microinverter" },
  { value: "inverter_stringa_monofase", label: "Inverter di stringa monofase" },
  { value: "inverter_stringa_trifase", label: "Inverter di stringa trifase" },
  { value: "inverter_ibrido", label: "Inverter ibrido" },
  { value: "ottimizzatori_con_inverter", label: "Ottimizzatori con inverter" },
  { value: "altro", label: "Altro" },
];

const inputClassName =
  "mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";
const labelClassName = "text-sm font-medium";

export function ComponentiImpiantoStep() {
  const { actions, state } = useWizard();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Componenti e note impianto</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Completa i dati tecnici essenziali prima della documentazione finale.
        </p>
      </div>

      <section className="rounded-lg border border-[var(--border)] bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClassName}>
            Inverter *
            <select
              className={inputClassName}
              value={state.system_components.inverter}
              onChange={(event) =>
                actions.aggiornaComponentiImpianto({
                  inverter: event.target.value as SystemInverterOption,
                })
              }
            >
              <option value="">Seleziona inverter</option>
              {INVERTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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

export function getInverterLabel(inverter: SystemInverterOption): string {
  return (
    INVERTER_OPTIONS.find((option) => option.value === inverter)?.label ?? inverter
  );
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
