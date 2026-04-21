"use client";

import type { ChangeEvent } from "react";
import type { SurveyPhoto, SurveyPhotoType } from "@/types/photos";
import { useWizard } from "@/features/wizard/WizardProvider";
import { createSurveyPhotosFromFiles } from "./photoFactory";

const PHOTO_TYPE_OPTIONS: Array<{ value: SurveyPhotoType; label: string }> = [
  { value: "tetto_panoramica", label: "Tetto panoramica" },
  { value: "falda_1", label: "Falda 1" },
  { value: "falda_2", label: "Falda 2" },
  { value: "ostacolo", label: "Ostacolo" },
  { value: "quadro_elettrico", label: "Quadro elettrico" },
  { value: "contatore", label: "Contatore" },
  { value: "inverter_esistente", label: "Inverter esistente" },
  { value: "copertura", label: "Copertura" },
  { value: "altro", label: "Altro" },
];

const inputClassName =
  "mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";
const labelClassName = "text-sm font-medium";

export function FotoStep() {
  const { actions, state } = useWizard();
  const photosRequired =
    state.active_client_profile?.require_photos_before_submit ?? false;

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const nextPhotos = createSurveyPhotosFromFiles(files);

    actions.aggiungiFotoSopralluogo(nextPhotos);
    event.target.value = "";
  }

  function deletePhoto(photo: SurveyPhoto) {
    if (photo.preview_url) {
      URL.revokeObjectURL(photo.preview_url);
    }

    actions.eliminaFotoSopralluogo(photo.photo_id);
  }

  return (
    <div className="min-w-0 space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Foto</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Aggiungi le immagini del sopralluogo e, se serve, una nota rapida.
        </p>
      </div>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Foto sopralluogo</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {state.photos.length} {state.photos.length === 1 ? "foto" : "foto"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {photosRequired && (
              <span className="rounded-lg border border-[var(--accent)] px-3 py-2 text-sm text-[var(--accent)]">
                Foto obbligatorie
              </span>
            )}
            <label className="cursor-pointer rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)]">
              Aggiungi foto
              <input
                accept="image/*"
                className="sr-only"
                multiple
                type="file"
                onChange={handleFilesSelected}
              />
            </label>
            <label className="cursor-pointer rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold">
              Fotocamera
              <input
                accept="image/*"
                capture="environment"
                className="sr-only"
                multiple
                type="file"
                onChange={handleFilesSelected}
              />
            </label>
          </div>
        </div>
      </section>

      {state.photos.length === 0 ? (
        <section className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-5 text-sm text-[var(--muted)]">
          Nessuna foto inserita.
        </section>
      ) : (
        <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {state.photos.map((photo, index) => (
            <article
              key={photo.photo_id}
              className="rounded-lg border border-[var(--border)] bg-white p-3"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[var(--surface)]">
                {photo.preview_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={`Foto ${index + 1}`}
                    className="h-full w-full object-cover"
                    src={photo.preview_url}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-3 text-center text-xs text-[var(--muted)]">
                    Anteprima non disponibile
                  </div>
                )}
              </div>

              <div className="mt-3 space-y-3">
                <label className={labelClassName}>
                  Tipo foto
                  <select
                    className={inputClassName}
                    value={photo.type}
                    onChange={(event) =>
                      actions.aggiornaFotoSopralluogo(photo.photo_id, {
                        type: event.target.value as SurveyPhotoType,
                      })
                    }
                  >
                    {PHOTO_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={labelClassName}>
                  Nota opzionale
                  <textarea
                    className={`${inputClassName} min-h-20 resize-y`}
                    value={photo.note}
                    onChange={(event) =>
                      actions.aggiornaFotoSopralluogo(photo.photo_id, {
                        note: event.target.value,
                      })
                    }
                  />
                </label>

                <button
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--danger)]"
                  type="button"
                  onClick={() => deletePhoto(photo)}
                >
                  Elimina
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export function getSurveyPhotoTypeLabel(type: SurveyPhotoType): string {
  return PHOTO_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}
