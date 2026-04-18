"use client";

import type { ChangeEvent } from "react";
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
  const photosRequired =
    state.active_client_profile?.require_photos_before_submit ?? false;

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
    event.target.value = "";
  }

  function deletePhoto(photo: SurveyPhoto) {
    if (photo.preview_url) {
      URL.revokeObjectURL(photo.preview_url);
    }

    actions.eliminaFotoSopralluogo(photo.photo_id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Foto sopralluogo</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Aggiungi le immagini raccolte in sopralluogo. Le anteprime restano
          disponibili nella sessione corrente; dopo un ricaricamento vengono
          mantenuti i metadati, non il file immagine completo.
        </p>
      </div>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Carica foto</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Da mobile puoi usare anche la fotocamera del dispositivo.
            </p>
          </div>
          {photosRequired && (
            <span className="w-fit rounded-lg border border-[var(--accent)] px-3 py-1 text-sm text-[var(--accent)]">
              Foto obbligatorie per il profilo attivo
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className={labelClassName}>
            Aggiungi da file o fotocamera
            <input
              accept="image/*"
              capture="environment"
              className={inputClassName}
              multiple
              type="file"
              onChange={handleFilesSelected}
            />
          </label>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--muted)]">
            Nessun upload remoto in questa fase. I file veri non vengono salvati
            in localStorage e non vengono inviati a n8n.
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">Foto inserite</h3>
          <span className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm text-[var(--muted)]">
            {state.photos.length}
          </span>
        </div>

        {state.photos.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)]">
            Nessuna foto inserita.
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {state.photos.map((photo) => (
              <article
                key={photo.photo_id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4"
              >
                <div className="aspect-video overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  {photo.preview_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={`Anteprima ${photo.file_name}`}
                      className="h-full w-full object-cover"
                      src={photo.preview_url}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[var(--muted)]">
                      Anteprima non disponibile dopo il ricaricamento.
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <p className="truncate text-sm font-semibold">
                      {photo.file_name || "Foto sopralluogo"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatFileSize(photo.file_size)}
                    </p>
                  </div>

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
                    Nota foto
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
                    Elimina foto
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
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
