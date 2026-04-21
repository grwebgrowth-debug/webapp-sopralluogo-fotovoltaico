"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ObstacleType, RoofType, SurfaceShape, WizardStepId } from "@/types/domain";
import { getInverterLabel } from "@/features/componenti-impianto/ComponentiImpiantoStep";
import { getSurveyPhotoTypeLabel } from "@/features/foto/FotoStep";
import { formattaKilowattPicco } from "@/lib/formatters/units";
import { salvaSopralluogo } from "@/lib/services/surveyService";
import { useWizard } from "@/features/wizard/WizardProvider";
import { costruisciPayloadN8nV1 } from "@/features/wizard/wizardPayload";
import { validateFinalSurvey } from "@/features/wizard/wizardValidation";

type SubmitState =
  | {
      status: "idle";
      message: string | null;
    }
  | {
      status: "loading";
      message: string;
    }
  | {
      status: "success";
      message: string;
    }
  | {
      status: "error";
      message: string;
    };

export function RevisioneStep() {
  const { actions, state, summary } = useWizard();
  const finalValidation = useMemo(() => validateFinalSurvey(state), [state]);
  const payloadResult = useMemo(() => costruisciPayloadN8nV1(state), [state]);
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
    message: null,
  });

  async function handleSubmit() {
    if (!finalValidation.valid || !payloadResult.ok) {
      setSubmitState({
        status: "error",
        message: "Completa i dati obbligatori prima dell'invio.",
      });
      return;
    }

    setSubmitState({
      status: "loading",
      message: "Invio in corso...",
    });

    const result = await salvaSopralluogo(payloadResult.payload, {
      profile: state.active_client_profile,
      surveyId: state.survey_id,
      photos: state.photos,
      uploadedBy: state.inspection.technician,
    });

    if (result.ok) {
      setSubmitState({
        status: "success",
        message: formatSubmitSuccessMessage(result.data),
      });
      return;
    }

    setSubmitState({
      status: "error",
      message: result.error,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Revisione e invio</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Controlla la sintesi e apri solo le sezioni da verificare.
        </p>
      </div>

      <section className="rounded-lg border border-[var(--border)] bg-white p-5">
        <dl className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-6">
          <SummaryTile
            label="Cliente"
            value={summary.customer_full_name || "Da completare"}
          />
          <SummaryTile label="Falde" value={String(summary.surfaces_count)} />
          <SummaryTile label="Ostacoli" value={String(summary.obstacles_count)} />
          <SummaryTile label="Moduli" value={String(summary.layout_modules_count)} />
          <SummaryTile label="Foto" value={String(summary.photos_count)} />
          <SummaryTile
            label="Invio"
            value={finalValidation.valid && payloadResult.ok ? "Pronto" : "Da completare"}
          />
        </dl>
      </section>

      {!finalValidation.valid && (
        <details className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-5" open>
          <summary className="cursor-pointer text-lg font-semibold">
            Dati da completare
          </summary>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
            {finalValidation.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </details>
      )}

      <ReviewSection
        title="Cliente"
        onEdit={() => actions.cambiaStep("cliente")}
      >
        <DescriptionList
          items={[
            ["Nome", state.customer.first_name || "Non indicato"],
            ["Cognome", state.customer.last_name || "Non indicato"],
            ["Indirizzo", state.customer.address || "Non indicato"],
            ["Data", state.inspection.date || "Non indicata"],
            ["Telefono", state.customer.phone || "Non indicato"],
            ["Email", state.customer.email || "Non indicata"],
          ]}
        />
      </ReviewSection>

      <ReviewSection
        title="Tetto e falde"
        onEdit={() => actions.cambiaStep("tetto")}
      >
        <DescriptionList
          items={[
            ["Tipo tetto", getRoofTypeLabel(state.roof.roof_type)],
            ["Falde", String(state.roof.surfaces.length)],
          ]}
        />
        <CompactList>
          {state.roof.surfaces.map((surface, index) => (
            <li key={surface.surface_id}>
              <strong>Falda {index + 1}</strong>: {getSurfaceShapeLabel(surface.shape)},{" "}
              {surface.orientation || "orientamento non indicato"},{" "}
              {getSurfaceCoverageLabel(surface.coverage)}
            </li>
          ))}
        </CompactList>
      </ReviewSection>

      <ReviewSection
        title="Ostacoli"
        onEdit={() => actions.cambiaStep("ostacoli")}
      >
        {summary.obstacles_count === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nessun ostacolo inserito.</p>
        ) : (
          <CompactList>
            {state.roof.surfaces.flatMap((surface) =>
              surface.obstacles.map((obstacle, index) => (
                <li key={`${surface.surface_id}-${obstacle.obstacle_id}-${index}`}>
                  <strong>{obstacle.obstacle_id || getObstacleTypeLabel(obstacle.type)}</strong>:{" "}
                  {getObstacleTypeLabel(obstacle.type)} su {surface.name}
                </li>
              )),
            )}
          </CompactList>
        )}
      </ReviewSection>

      <ReviewSection
        title="Pannello e obiettivo"
        onEdit={() => actions.cambiaStep("pannello")}
      >
        <DescriptionList
          items={[
            ["Marca", state.panel_selection.brand || "Non selezionata"],
            ["Modello", state.panel_selection.model || "Non selezionato"],
            [
              "Potenza modulo",
              state.panel_technical_data.power_w > 0
                ? `${state.panel_technical_data.power_w} W`
                : "Non indicata",
            ],
            ["Obiettivo", getLayoutModeLabel(state.layout_config.mode)],
            [
              "Target",
              state.layout_config.target_power_w
                ? formattaKilowattPicco(state.layout_config.target_power_w)
                : "Massimo moduli",
            ],
          ]}
        />
      </ReviewSection>

      <ReviewSection
        title="Layout preliminare"
        onEdit={() => actions.cambiaStep("layout_moduli")}
      >
        {state.preliminary_layout ? (
          <DescriptionList
            items={[
              ["Moduli", String(state.preliminary_layout.total_modules)],
              [
                "Potenza",
                formattaKilowattPicco(state.preliminary_layout.total_power_w),
              ],
              [
                "Falde usate",
                String(
                  state.preliminary_layout.surfaces.filter(
                    (surfaceLayout) => surfaceLayout.module_count > 0,
                  ).length,
                ),
              ],
            ]}
          />
        ) : (
          <p className="text-sm text-[var(--muted)]">Layout non ancora calcolato.</p>
        )}
      </ReviewSection>

      <ReviewSection
        title="Componenti e note impianto"
        onEdit={() => actions.cambiaStep("componenti_impianto")}
      >
        <DescriptionList
          items={[
            [
              "Inverter",
              state.system_components.inverter
                ? getInverterLabel(state.system_components.inverter)
                : "Non selezionato",
            ],
            [
              "Lunghezza cavi",
              state.system_components.cable_length_m > 0
                ? `${state.system_components.cable_length_m} m`
                : "Non indicata",
            ],
            [
              "Note tecniche",
              state.system_components.technical_notes || "Nessuna nota",
            ],
          ]}
        />
      </ReviewSection>

      <ReviewSection title="Foto" onEdit={() => actions.cambiaStep("foto")}>
        {state.photos.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nessuna foto inserita.</p>
        ) : (
          <CompactList>
            {state.photos.map((photo, index) => (
              <li key={photo.photo_id}>
                <strong>Foto {index + 1}</strong>: {getSurveyPhotoTypeLabel(photo.type)}
                {photo.note ? ` - ${photo.note}` : ""}
              </li>
            ))}
          </CompactList>
        )}
      </ReviewSection>

      <section className="rounded-lg border border-[var(--border)] bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Invio finale</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {finalValidation.valid && payloadResult.ok
                ? "I dati sono pronti per l'invio."
                : "Completa i dati richiesti prima di inviare."}
            </p>
          </div>
          <button
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!finalValidation.valid || submitState.status === "loading"}
            type="button"
            onClick={handleSubmit}
          >
            {submitState.status === "loading" ? "Invio..." : "Invia sopralluogo"}
          </button>
        </div>

        {submitState.message && (
          <div
            className={`mt-4 rounded-lg border p-4 text-sm ${
              submitState.status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : submitState.status === "loading"
                  ? "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--foreground)]"
                  : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            {submitState.message}
          </div>
        )}
      </section>
    </div>
  );
}

function formatSubmitSuccessMessage(result: {
  id_sopralluogo?: string;
  message: string;
  preventivo_id?: string;
}): string {
  const details = [result.id_sopralluogo, result.preventivo_id]
    .filter(Boolean)
    .join(" - ");

  return details ? `${result.message} ${details}` : result.message;
}

type SummaryTileProps = {
  label: string;
  value: string;
};

function SummaryTile({ label, value }: SummaryTileProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
      <dt className="text-xs text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 truncate font-semibold">{value}</dd>
    </div>
  );
}

type ReviewSectionProps = {
  children: ReactNode;
  onEdit: () => void;
  title: string;
};

function ReviewSection({ children, onEdit, title }: ReviewSectionProps) {
  return (
    <details className="rounded-lg border border-[var(--border)] bg-white p-5">
      <summary className="cursor-pointer list-none">
        <span className="flex items-center justify-between gap-4">
          <span className="text-lg font-semibold">{title}</span>
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onEdit();
            }}
          >
            Modifica
          </button>
        </span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

type DescriptionListProps = {
  items: Array<[string, string]>;
};

function DescriptionList({ items }: DescriptionListProps) {
  return (
    <dl className="grid gap-3 text-sm md:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[var(--muted)]">{label}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

type CompactListProps = {
  children: ReactNode;
};

function CompactList({ children }: CompactListProps) {
  return (
    <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">{children}</ul>
  );
}

function getLayoutModeLabel(mode: "max_modules" | "target_power"): string {
  return mode === "target_power" ? "Target impianto" : "Massimo moduli";
}

function getRoofTypeLabel(type: RoofType | null): string {
  if (!type) {
    return "Non selezionato";
  }

  const labels: Record<RoofType, string> = {
    falda_unica: "Falda unica",
    due_falde: "Due falde",
    due_falde_asimmetriche: "Due falde asimmetriche",
    quattro_falde_padiglione: "Quattro falde",
    tetto_a_l: "Tetto a L",
    shed: "Shed",
    piu_falde_personalizzato: "Personalizzato",
  };

  return labels[type];
}

function getSurfaceShapeLabel(shape: SurfaceShape): string {
  const labels: Record<SurfaceShape, string> = {
    rectangular: "rettangolare",
    trapezoid: "trapezio",
    triangle: "triangolo",
    guided_quad: "irregolare",
  };

  return labels[shape];
}

function getObstacleTypeLabel(type: ObstacleType): string {
  const labels: Record<ObstacleType, string> = {
    camino: "Camino",
    lucernario: "Lucernario",
    sfiato: "Sfiato",
    antenna_palo: "Antenna / palo",
    area_non_utilizzabile: "Area non utilizzabile",
    altro_ostacolo: "Altro ostacolo",
  };

  return labels[type];
}

function getSurfaceCoverageLabel(coverage: string): string {
  const labels: Record<string, string> = {
    tegole: "Tegole",
    coppi: "Coppi",
    lamiera_grecata: "Lamiera grecata",
    pannello_sandwich: "Pannello sandwich",
    guaina_tetto_piano: "Guaina / tetto piano",
    fibrocemento_eternit_da_verificare: "Fibrocemento / eternit da verificare",
    altro: "Altro",
  };

  return labels[coverage] ?? "Copertura non indicata";
}
