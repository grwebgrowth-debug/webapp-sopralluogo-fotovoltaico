"use client";

import { useState, type ChangeEvent } from "react";
import type { SurveyPhoto, SurveyPhotoType } from "@/types/photos";
import { useWizard } from "@/features/wizard/WizardProvider";

const PHOTO_TYPE_OPTIONS: Array<{ value: SurveyPhotoType; label: string }> = [
  { value: "tetto_panoramica", label: "Tetto panoramica" },
  { value: "falda", label: "Falda" },
  { value: "ostacolo", label: "Ostacolo" },
  { value: "quadro_elettrico", label: "Quadro elettrico" },
  { value: "contatore", label: "Contatore" },
  { value: "altro", label: "Altro" },
];

const inputClassName =
  "mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";
const labelClassName = "text-sm font-medium";

export function FotoStep() {
  const { actions, state } = useWizard();
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(
    state.photos[0]?.photo_id ?? null,
  );
  const photosRequired =
    state.active_client_profile?.require_photos_before_submit ?? false;
  const selectedPhoto =
    state.photos.find((photo) => photo.photo_id === selectedPhotoId) ??
    state.photos[0] ??
    null;

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const nextPhotos: SurveyPhoto[] = files.map((file) => ({
      photo_id: createPhotoId(),
      type: "tetto_panoramica",
      note: "",
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      added_at: new Date().toISOString(),
      preview_url: URL.createObjectURL(file),
    }));

    actions.aggiungiFotoSopralluogo(nextPhotos);
    setSelectedPhotoId(nextPhotos[0].photo_id);
    event.target.value = "";
  }

  function deletePhoto(photo: SurveyPhoto) {
    if (photo.preview_url) {
      URL.revokeObjectURL(photo.preview_url);
    }

    actions.eliminaFotoSopralluogo(photo.photo_id);
    setSelectedPhotoId(null);
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
            <label className="cursor-pointer rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-slate-950">
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
        <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
            {state.photos.map((photo, index) => {
              const selected = selectedPhoto?.photo_id === photo.photo_id;

              return (
                <button
                  key={photo.photo_id}
                  className={`min-w-0 overflow-hidden rounded-lg border text-left transition ${
                    selected
                      ? "border-[var(--accent)] bg-[var(--surface-soft)]"
                      : "border-[var(--border)] bg-white"
                  }`}
                  type="button"
                  onClick={() => setSelectedPhotoId(photo.photo_id)}
                >
                  <div className="aspect-square bg-[var(--surface)]">
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
                  <div className="p-2.5">
                    <p className="truncate text-sm font-semibold">
                      {getSurveyPhotoTypeLabel(photo.type)}
                    </p>
                    <p className="mt-1 truncate text-xs text-[var(--muted)]">
                      Foto {index + 1}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedPhoto && (
            <aside className="rounded-lg border border-[var(--border)] bg-white p-4 lg:sticky lg:top-5 lg:self-start">
              <h3 className="text-lg font-semibold">Dettagli foto</h3>
              <p className="mt-1 truncate text-xs text-[var(--muted)]">
                {selectedPhoto.file_name || "Foto sopralluogo"} -{" "}
                {formatFileSize(selectedPhoto.file_size)}
              </p>

              <div className="mt-4 space-y-4">
                <label className={labelClassName}>
                  Tipo
                  <select
                    className={inputClassName}
                    value={selectedPhoto.type}
                    onChange={(event) =>
                      actions.aggiornaFotoSopralluogo(selectedPhoto.photo_id, {
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
                  Nota
                  <textarea
                    className={`${inputClassName} min-h-24 resize-y`}
                    value={selectedPhoto.note}
                    onChange={(event) =>
                      actions.aggiornaFotoSopralluogo(selectedPhoto.photo_id, {
                        note: event.target.value,
                      })
                    }
                  />
                </label>

                <button
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--danger)]"
                  type="button"
                  onClick={() => deletePhoto(selectedPhoto)}
                >
                  Elimina foto
                </button>
              </div>
            </aside>
          )}
        </section>
      )}
    </div>
  );
}

export function getSurveyPhotoTypeLabel(type: SurveyPhotoType): string {
  return PHOTO_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

function createPhotoId(): string {
  return `foto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatFileSize(size: number): string {
  if (size <= 0) {
    return "Dimensione non disponibile";
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
