"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { WizardStepId } from "@/types/domain";
import { getSurveyPhotoTypeLabel } from "@/features/foto/FotoStep";
import { inviaSopralluogoAN8n } from "@/lib/api/n8n";
import { formattaKilowattPicco } from "@/lib/formatters/units";
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
  const { actions, state } = useWizard();
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
        message: "Completa i dati obbligatori prima dell’invio.",
      });
      return;
    }

    setSubmitState({
      status: "loading",
      message: "Preparazione invio a n8n...",
    });

    const result = await inviaSopralluogoAN8n(payloadResult.payload);

    if (result.ok) {
      setSubmitState({
        status: "success",
        message: result.data.message,
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
        <h2 className="text-2xl font-semibold">Revisione tecnica</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Controlla tutti i dati prima della conferma finale. Ogni blocco può
          essere modificato senza perdere la bozza.
        </p>
      </div>

      {!finalValidation.valid && (
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <h3 className="text-lg font-semibold">Dati da completare</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
            {finalValidation.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      )}

      <ReviewSection
        title="Profilo cliente"
        onEdit={() => {
          window.location.href = "/impostazioni";
        }}
      >
        {state.active_client_profile ? (
          <DescriptionList
            items={[
              [
                "Azienda",
                state.active_client_profile.company_name || "Non indicata",
              ],
              ["Profilo", state.active_client_profile.profile_name],
              ["Codice cliente", state.active_client_profile.client_code],
              [
                "Tecnico predefinito",
                state.active_client_profile.default_technician ||
                  "Non indicato",
              ],
              [
                "Endpoint catalogo pannelli",
                state.active_client_profile.panel_catalog_endpoint
                  ? "Configurato"
                  : "Non configurato",
              ],
              [
                "Endpoint invio sopralluogo",
                state.active_client_profile.survey_submit_endpoint
                  ? "Configurato"
                  : "Non configurato",
              ],
            ]}
          />
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Nessun profilo cliente attivo.
          </p>
        )}
      </ReviewSection>

      <ReviewSection
        title="Dati cliente"
        onEdit={() => actions.cambiaStep("cliente")}
      >
        <DescriptionList
          items={[
            ["Nome cliente", state.customer.first_name || "Non indicato"],
            ["Cognome cliente", state.customer.last_name || "Non indicato"],
            ["Telefono", state.customer.phone || "Non indicato"],
            ["Email", state.customer.email || "Non indicata"],
            [
              "Indirizzo del sopralluogo",
              state.customer.address || "Non indicato",
            ],
            ["Comune", state.customer.city || "Non indicato"],
            ["Provincia", state.customer.province || "Non indicata"],
            ["Data sopralluogo", state.inspection.date || "Non indicata"],
            [
              "Tecnico incaricato",
              state.inspection.technician || "Non indicato",
            ],
            ["Note generali", state.inspection.notes || "Nessuna nota"],
          ]}
        />
      </ReviewSection>

      <ReviewSection
        title="Tipo di tetto"
        onEdit={() => actions.cambiaStep("tetto")}
      >
        <DescriptionList
          items={[
            ["Tipo di tetto", state.roof.roof_type ?? "Non selezionato"],
            ["Numero falde", String(state.roof.surfaces.length)],
          ]}
        />
      </ReviewSection>

      <ReviewSection title="Falde" onEdit={() => actions.cambiaStep("falde")}>
        {state.roof.surfaces.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nessuna falda inserita.</p>
        ) : (
          <div className="space-y-4">
            {state.roof.surfaces.map((surface, index) => (
              <div
                key={surface.surface_id}
                className="rounded-lg border border-[var(--border)] p-4 text-sm"
              >
                <p className="font-semibold">
                  {index + 1}. {surface.name}
                </p>
                <p className="mt-1 text-[var(--muted)]">
                  Forma: {surface.shape}, orientamento:{" "}
                  {surface.orientation || "non indicato"}, inclinazione:{" "}
                  {surface.tilt_deg}°.
                </p>
                <p className="mt-1 text-[var(--muted)]">
                  Quota minima dal bordo: {surface.edge_clearance_cm} cm.
                </p>
              </div>
            ))}
          </div>
        )}
      </ReviewSection>

      <ReviewSection
        title="Ostacoli"
        onEdit={() => actions.cambiaStep("ostacoli")}
      >
        {state.roof.surfaces.every((surface) => surface.obstacles.length === 0) ? (
          <p className="text-sm text-[var(--muted)]">
            Nessun ostacolo inserito.
          </p>
        ) : (
          <div className="space-y-4">
            {state.roof.surfaces.map((surface) =>
              surface.obstacles.map((obstacle) => (
                <div
                  key={`${surface.surface_id}-${obstacle.obstacle_id}`}
                  className="rounded-lg border border-[var(--border)] p-4 text-sm"
                >
                  <p className="font-semibold">
                    {getObstacleDisplayName(obstacle.obstacle_id, obstacle.type)}
                  </p>
                  <p className="mt-1 text-[var(--muted)]">
                    Falda: {surface.name}. Tipo: {obstacle.type}. Forma:{" "}
                    {obstacle.shape}.
                  </p>
                  <p className="mt-1 text-[var(--muted)]">
                    Margine di sicurezza: {obstacle.safety_margin_cm} cm.
                  </p>
                </div>
              )),
            )}
          </div>
        )}
      </ReviewSection>

      <ReviewSection
        title="Pannello selezionato"
        onEdit={() => actions.cambiaStep("pannello")}
      >
        <DescriptionList
          items={[
            [
              "Marca pannello",
              state.panel_selection.brand || "Non selezionata",
            ],
            [
              "Modello pannello",
              state.panel_selection.model || "Non selezionato",
            ],
          ]}
        />
      </ReviewSection>

      <ReviewSection
        title="Layout moduli preliminare"
        onEdit={() => actions.cambiaStep("layout_moduli")}
      >
        {state.preliminary_layout ? (
          <div className="space-y-4">
            <DescriptionList
              items={[
                [
                  "Modalità layout",
                  getLayoutModeLabel(state.preliminary_layout.layout_mode),
                ],
                [
                  "Target impianto",
                  state.preliminary_layout.target_power_w !== null
                    ? formattaKilowattPicco(
                        state.preliminary_layout.target_power_w,
                      )
                    : "Non impostato",
                ],
                [
                  "Moduli target",
                  state.preliminary_layout.target_module_count !== null
                    ? String(state.preliminary_layout.target_module_count)
                    : "Non impostati",
                ],
                [
                  "Moduli effettivi",
                  String(state.preliminary_layout.total_modules),
                ],
                [
                  "Potenza effettiva",
                  formattaKilowattPicco(state.preliminary_layout.total_power_w),
                ],
                [
                  "Falde utilizzate",
                  String(
                    state.preliminary_layout.surfaces.filter(
                      (surfaceLayout) => surfaceLayout.module_count > 0,
                    ).length,
                  ),
                ],
                [
                  "Stato target",
                  state.preliminary_layout.target_reached === null
                    ? "Non applicabile"
                    : state.preliminary_layout.target_reached
                      ? "Raggiunto"
                      : "Non raggiunto",
                ],
              ]}
            />
            {state.preliminary_layout.messages.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
                {state.preliminary_layout.messages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
            <div className="space-y-3">
              {state.preliminary_layout.surfaces.map((surfaceLayout) => (
                <div
                  key={surfaceLayout.surface_id}
                  className="rounded-lg border border-[var(--border)] p-4 text-sm"
                >
                  <p className="font-semibold">{surfaceLayout.surface_name}</p>
                  <p className="mt-1 text-[var(--muted)]">
                    Orientamento: {surfaceLayout.selected_orientation}. Moduli:{" "}
                    {surfaceLayout.module_count}. Potenza:{" "}
                    {formattaKilowattPicco(surfaceLayout.total_power_w)}.
                  </p>
                  {surfaceLayout.messages.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--muted)]">
                      {surfaceLayout.messages.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Layout moduli non ancora calcolato.
          </p>
        )}
      </ReviewSection>

      <ReviewSection title="Foto sopralluogo" onEdit={() => actions.cambiaStep("foto")}>
        <DescriptionList
          items={[
            ["Foto caricate", String(state.photos.length)],
            [
              "Obbligo foto",
              state.active_client_profile?.require_photos_before_submit
                ? "Attivo per il profilo cliente"
                : "Non attivo",
            ],
          ]}
        />
        {state.photos.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Nessuna foto inserita.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {state.photos.map((photo) => (
              <div
                key={photo.photo_id}
                className="rounded-lg border border-[var(--border)] p-4 text-sm"
              >
                <p className="font-semibold">
                  {getSurveyPhotoTypeLabel(photo.type)}
                </p>
                <p className="mt-1 text-[var(--muted)]">
                  File: {photo.file_name || "Nome file non disponibile"}.
                </p>
                <p className="mt-1 text-[var(--muted)]">
                  Nota: {photo.note || "Nessuna nota"}.
                </p>
              </div>
            ))}
          </div>
        )}
      </ReviewSection>

      <section className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h3 className="text-lg font-semibold">Stato invio</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {payloadResult.ok
            ? "La struttura del payload finale è costruibile."
            : "Il payload finale non è ancora costruibile."}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          L’integrazione reale con n8n non è configurata in questa base: il
          pulsante prepara il flusso e segnala chiaramente lo stato.
        </p>

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

        <button
          className="mt-5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!finalValidation.valid || submitState.status === "loading"}
          type="button"
          onClick={handleSubmit}
        >
          {submitState.status === "loading"
            ? "Invio in corso..."
            : "Conferma dati e invia"}
        </button>
      </section>
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
    <section className="rounded-lg border border-[var(--border)] bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          type="button"
          onClick={onEdit}
        >
          Modifica
        </button>
      </div>
      {children}
    </section>
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

function getObstacleDisplayName(obstacleId: string, obstacleType: string): string {
  if (!obstacleId.startsWith("ostacolo_")) {
    return obstacleId;
  }

  return obstacleType;
}

function getLayoutModeLabel(mode: "max_modules" | "target_power"): string {
  return mode === "target_power"
    ? "Potenza target impianto"
    : "Massimo numero di moduli possibile";
}
