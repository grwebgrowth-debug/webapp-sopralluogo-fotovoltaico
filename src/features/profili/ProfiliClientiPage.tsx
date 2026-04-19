"use client";

import { useMemo, useState } from "react";
import type {
  ClientProfile,
  ClientProfileDraft,
  ClientThemePreference,
} from "@/types/profiles";
import {
  createEmptyClientProfileDraft,
  useClientProfiles,
} from "@/lib/clientProfiles";

const inputClassName =
  "mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";
const labelClassName = "text-sm font-medium";

const THEME_OPTIONS: Array<{ value: ClientThemePreference; label: string }> = [
  { value: "scuro_teal", label: "Scuro teal" },
  { value: "scuro_verde", label: "Scuro verde" },
  { value: "scuro_blu", label: "Scuro blu" },
];

export function ProfiliClientiPage() {
  const {
    activeProfile,
    createProfile,
    deleteProfile,
    profiles,
    selectActiveProfile,
    updateProfile,
  } = useClientProfiles();
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ClientProfileDraft>(() =>
    createEmptyClientProfileDraft(),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const editingProfile = useMemo(
    () =>
      profiles.find((profile) => profile.profile_id === editingProfileId) ??
      null,
    [editingProfileId, profiles],
  );

  function startNewProfile() {
    setEditingProfileId(null);
    setDraft(createEmptyClientProfileDraft());
    setFormError(null);
  }

  function startEditProfile(profile: ClientProfile) {
    setEditingProfileId(profile.profile_id);
    setDraft({
      profile_name: profile.profile_name,
      company_name: profile.company_name,
      client_code: profile.client_code,
      default_technician: profile.default_technician,
      preferred_theme: profile.preferred_theme,
      n8n_base_url: profile.n8n_base_url,
      survey_submit_endpoint: profile.survey_submit_endpoint,
      panel_catalog_endpoint: profile.panel_catalog_endpoint,
      google_sheet_panel_catalog: profile.google_sheet_panel_catalog,
      google_sheet_surveys: profile.google_sheet_surveys,
      google_sheet_price_list: profile.google_sheet_price_list,
      require_photos_before_submit: profile.require_photos_before_submit,
      demo_mode: profile.demo_mode,
    });
    setFormError(null);
  }

  function saveProfile() {
    if (!draft.profile_name.trim()) {
      setFormError("Nome profilo obbligatorio.");
      return;
    }

    if (!draft.client_code.trim()) {
      setFormError("Codice cliente / slug cliente obbligatorio.");
      return;
    }

    if (editingProfile) {
      updateProfile(editingProfile.profile_id, draft);
    } else {
      createProfile(draft);
    }

    startNewProfile();
  }

  function updateDraft(field: keyof ClientProfileDraft, value: string | boolean) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
      <aside className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Impostazioni
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Profili cliente</h1>
          </div>
          <button
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-slate-950"
            type="button"
            onClick={startNewProfile}
          >
            Nuovo
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          I profili sono salvati nel browser e contengono solo configurazioni
          operative. Non inserire API key, token, password o segreti: quelli
          vanno gestiti lato n8n o backend.
        </p>

        <div className="mt-5 space-y-3">
          {profiles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)]">
              Nessun profilo creato. Compila il form per preparare il primo
              cliente.
            </div>
          ) : (
            profiles.map((profile) => {
              const isActive = profile.profile_id === activeProfile?.profile_id;

              return (
                <article
                  key={profile.profile_id}
                  className={`rounded-lg border p-4 text-sm ${
                    isActive
                      ? "border-[var(--accent)] bg-[color:rgba(20,184,166,0.12)]"
                      : "border-[var(--border)] bg-[var(--surface-soft)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{profile.profile_name}</h2>
                      <p className="mt-1 text-[var(--muted)]">
                        {profile.company_name || "Azienda non indicata"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Codice: {profile.client_code}
                      </p>
                    </div>
                    {isActive && (
                      <span className="rounded-lg border border-[var(--accent)] px-2 py-1 text-xs text-[var(--accent)]">
                        Attivo
                      </span>
                    )}
                    {profile.demo_mode && (
                      <span className="rounded-lg border border-amber-300/70 bg-amber-200/15 px-2 py-1 text-xs text-amber-200">
                        Demo
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs"
                      type="button"
                      onClick={() => selectActiveProfile(profile.profile_id)}
                    >
                      Usa profilo
                    </button>
                    <button
                      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs"
                      type="button"
                      onClick={() => startEditProfile(profile)}
                    >
                      Modifica
                    </button>
                    <button
                      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--danger)]"
                      type="button"
                      onClick={() => deleteProfile(profile.profile_id)}
                    >
                      Elimina
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </aside>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            {editingProfile ? "Modifica profilo" : "Nuovo profilo"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Configurazione cliente
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Attiva la demo per mostrare il flusso con dati simulati, oppure
            prepara le integrazioni live quando saranno disponibili.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm md:col-span-2">
            <span className="flex items-start gap-3">
              <input
                checked={draft.demo_mode}
                className="mt-1"
                type="checkbox"
                onChange={(event) =>
                  updateDraft("demo_mode", event.target.checked)
                }
              />
              <span>
                <span className="block font-medium">Modalita demo</span>
                <span className="mt-1 block text-[var(--muted)]">
                  La modalita demo usa dati simulati e non invia dati reali a
                  sistemi esterni.
                </span>
              </span>
            </span>
          </label>

          <TextField
            label="Nome profilo"
            required
            value={draft.profile_name}
            onChange={(value) => updateDraft("profile_name", value)}
          />
          <TextField
            label="Nome azienda"
            value={draft.company_name}
            onChange={(value) => updateDraft("company_name", value)}
          />
          <TextField
            label="Codice cliente / slug cliente"
            required
            value={draft.client_code}
            onChange={(value) => updateDraft("client_code", value)}
          />
          <TextField
            label="Tecnico predefinito"
            value={draft.default_technician}
            onChange={(value) => updateDraft("default_technician", value)}
          />
          <label className={labelClassName}>
            Tema preferito
            <select
              className={inputClassName}
              value={draft.preferred_theme}
              onChange={(event) =>
                updateDraft(
                  "preferred_theme",
                  event.target.value as ClientThemePreference,
                )
              }
            >
              {THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <details
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 md:col-span-2"
            open={!draft.demo_mode}
          >
            <summary className="cursor-pointer text-sm font-semibold">
              Integrazioni live
              {draft.demo_mode ? " - non usate in demo" : ""}
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextField
                label="URL base n8n"
                value={draft.n8n_base_url}
                onChange={(value) => updateDraft("n8n_base_url", value)}
              />
              <TextField
                label="Endpoint invio sopralluogo"
                value={draft.survey_submit_endpoint}
                onChange={(value) => updateDraft("survey_submit_endpoint", value)}
              />
              <TextField
                label="Endpoint catalogo pannelli"
                value={draft.panel_catalog_endpoint}
                onChange={(value) => updateDraft("panel_catalog_endpoint", value)}
              />
              <TextField
                label="ID o URL Google Sheet Catalogo Pannelli"
                value={draft.google_sheet_panel_catalog}
                onChange={(value) =>
                  updateDraft("google_sheet_panel_catalog", value)
                }
              />
              <TextField
                label="ID o URL Google Sheet Sopralluoghi"
                value={draft.google_sheet_surveys}
                onChange={(value) => updateDraft("google_sheet_surveys", value)}
              />
              <TextField
                label="ID o URL Google Sheet Listino"
                value={draft.google_sheet_price_list}
                onChange={(value) =>
                  updateDraft("google_sheet_price_list", value)
                }
              />
            </div>
          </details>
          <label className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm">
            <span className="flex items-start gap-3">
              <input
                checked={draft.require_photos_before_submit}
                className="mt-1"
                type="checkbox"
                onChange={(event) =>
                  updateDraft(
                    "require_photos_before_submit",
                    event.target.checked,
                  )
                }
              />
              <span>
                <span className="block font-medium">
                  Obbligo foto prima dell'invio
                </span>
                <span className="mt-1 block text-[var(--muted)]">
                  Se attivo, la revisione richiede almeno una foto sopralluogo.
                </span>
              </span>
            </span>
          </label>
        </div>

        {formError && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            {formError}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-slate-950"
            type="button"
            onClick={saveProfile}
          >
            {editingProfile ? "Salva modifiche" : "Crea profilo"}
          </button>
          <button
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm"
            type="button"
            onClick={startNewProfile}
          >
            Pulisci form
          </button>
        </div>
      </section>
    </div>
  );
}

type TextFieldProps = {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
};

function TextField({ label, onChange, required = false, value }: TextFieldProps) {
  return (
    <label className={labelClassName}>
      {label}
      {required ? " *" : ""}
      <input
        className={inputClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
