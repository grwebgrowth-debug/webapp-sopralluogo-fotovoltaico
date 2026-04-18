"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ActiveClientProfileSnapshot,
  ClientProfile,
  ClientProfileDraft,
  ClientThemePreference,
} from "@/types/profiles";
import { CLIENT_THEME_PREFERENCES } from "@/types/profiles";

const CLIENT_PROFILES_STORAGE_KEY =
  "sopralluogo_fotovoltaico_v1_client_profiles";
const CLIENT_PROFILES_STORAGE_VERSION = 1;
const CLIENT_PROFILES_CHANGED_EVENT = "client-profiles-changed";

type ClientProfilesStore = {
  storage_version: typeof CLIENT_PROFILES_STORAGE_VERSION;
  active_profile_id: string | null;
  profiles: ClientProfile[];
};

export function createEmptyClientProfileDraft(): ClientProfileDraft {
  return {
    profile_name: "",
    company_name: "",
    client_code: "",
    default_technician: "",
    preferred_theme: "scuro_teal",
    n8n_base_url: "",
    survey_submit_endpoint: "",
    panel_catalog_endpoint: "",
    google_sheet_panel_catalog: "",
    google_sheet_surveys: "",
    google_sheet_price_list: "",
    require_photos_before_submit: false,
  };
}

export function createClientProfileSnapshot(
  profile: ClientProfile,
): ActiveClientProfileSnapshot {
  return {
    profile_id: profile.profile_id,
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
  };
}

export function useClientProfiles() {
  const [store, setStore] = useState<ClientProfilesStore>(() =>
    createEmptyClientProfilesStore(),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStore(loadClientProfilesStore());
    setHydrated(true);

    function handleProfilesChanged() {
      setStore(loadClientProfilesStore());
    }

    window.addEventListener(CLIENT_PROFILES_CHANGED_EVENT, handleProfilesChanged);
    window.addEventListener("storage", handleProfilesChanged);

    return () => {
      window.removeEventListener(
        CLIENT_PROFILES_CHANGED_EVENT,
        handleProfilesChanged,
      );
      window.removeEventListener("storage", handleProfilesChanged);
    };
  }, []);

  const persistStore = useCallback((nextStore: ClientProfilesStore) => {
    setStore(nextStore);
    saveClientProfilesStore(nextStore);
  }, []);

  const createProfile = useCallback(
    (draft: ClientProfileDraft) => {
      const now = new Date().toISOString();
      const nextProfile: ClientProfile = {
        ...sanitizeClientProfileDraft(draft),
        profile_id: createProfileId(),
        created_at: now,
        updated_at: now,
      };

      const nextStore: ClientProfilesStore = {
        storage_version: CLIENT_PROFILES_STORAGE_VERSION,
        active_profile_id: store.active_profile_id ?? nextProfile.profile_id,
        profiles: [...store.profiles, nextProfile],
      };

      persistStore(nextStore);
      return nextProfile;
    },
    [persistStore, store],
  );

  const updateProfile = useCallback(
    (profileId: string, draft: ClientProfileDraft) => {
      const nextStore: ClientProfilesStore = {
        storage_version: CLIENT_PROFILES_STORAGE_VERSION,
        active_profile_id: store.active_profile_id,
        profiles: store.profiles.map((profile) =>
          profile.profile_id === profileId
            ? {
                ...profile,
                ...sanitizeClientProfileDraft(draft),
                updated_at: new Date().toISOString(),
              }
            : profile,
        ),
      };

      persistStore(nextStore);
    },
    [persistStore, store],
  );

  const deleteProfile = useCallback(
    (profileId: string) => {
      const profiles = store.profiles.filter(
        (profile) => profile.profile_id !== profileId,
      );
      const activeProfileId =
        store.active_profile_id === profileId
          ? profiles[0]?.profile_id ?? null
          : store.active_profile_id;

      persistStore({
        storage_version: CLIENT_PROFILES_STORAGE_VERSION,
        active_profile_id: activeProfileId,
        profiles,
      });
    },
    [persistStore, store],
  );

  const selectActiveProfile = useCallback(
    (profileId: string | null) => {
      persistStore({
        storage_version: CLIENT_PROFILES_STORAGE_VERSION,
        active_profile_id: profileId,
        profiles: store.profiles,
      });
    },
    [persistStore, store],
  );

  const activeProfile = useMemo(
    () =>
      store.profiles.find(
        (profile) => profile.profile_id === store.active_profile_id,
      ) ?? null,
    [store.active_profile_id, store.profiles],
  );

  return {
    activeProfile,
    activeProfileId: store.active_profile_id,
    createProfile,
    deleteProfile,
    hydrated,
    profiles: store.profiles,
    selectActiveProfile,
    updateProfile,
  };
}

function createEmptyClientProfilesStore(): ClientProfilesStore {
  return {
    storage_version: CLIENT_PROFILES_STORAGE_VERSION,
    active_profile_id: null,
    profiles: [],
  };
}

function loadClientProfilesStore(): ClientProfilesStore {
  if (!canUseLocalStorage()) {
    return createEmptyClientProfilesStore();
  }

  const rawValue = window.localStorage.getItem(CLIENT_PROFILES_STORAGE_KEY);

  if (!rawValue) {
    return createEmptyClientProfilesStore();
  }

  try {
    return normalizeClientProfilesStore(JSON.parse(rawValue));
  } catch {
    return createEmptyClientProfilesStore();
  }
}

function saveClientProfilesStore(store: ClientProfilesStore): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(CLIENT_PROFILES_STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event(CLIENT_PROFILES_CHANGED_EVENT));
}

function normalizeClientProfilesStore(value: unknown): ClientProfilesStore {
  if (!isRecord(value) || value.storage_version !== CLIENT_PROFILES_STORAGE_VERSION) {
    return createEmptyClientProfilesStore();
  }

  const profiles = Array.isArray(value.profiles)
    ? value.profiles.map(normalizeClientProfile).filter(isClientProfile)
    : [];
  const activeProfileId =
    isString(value.active_profile_id) &&
    profiles.some((profile) => profile.profile_id === value.active_profile_id)
      ? value.active_profile_id
      : profiles[0]?.profile_id ?? null;

  return {
    storage_version: CLIENT_PROFILES_STORAGE_VERSION,
    active_profile_id: activeProfileId,
    profiles,
  };
}

function normalizeClientProfile(value: unknown): ClientProfile | null {
  if (!isRecord(value) || !isString(value.profile_id)) {
    return null;
  }

  return {
    ...sanitizeClientProfileDraft({
      profile_name: readStringField(value, "profile_name"),
      company_name: readStringField(value, "company_name"),
      client_code: readStringField(value, "client_code"),
      default_technician: readStringField(value, "default_technician"),
      preferred_theme: readThemePreference(value.preferred_theme),
      n8n_base_url: readStringField(value, "n8n_base_url"),
      survey_submit_endpoint: readStringField(value, "survey_submit_endpoint"),
      panel_catalog_endpoint: readStringField(value, "panel_catalog_endpoint"),
      google_sheet_panel_catalog: readStringField(
        value,
        "google_sheet_panel_catalog",
      ),
      google_sheet_surveys: readStringField(value, "google_sheet_surveys"),
      google_sheet_price_list: readStringField(
        value,
        "google_sheet_price_list",
      ),
      require_photos_before_submit: Boolean(
        value.require_photos_before_submit,
      ),
    }),
    profile_id: value.profile_id,
    created_at: readStringField(value, "created_at") || new Date().toISOString(),
    updated_at: readStringField(value, "updated_at") || new Date().toISOString(),
  };
}

function sanitizeClientProfileDraft(
  draft: ClientProfileDraft,
): ClientProfileDraft {
  return {
    profile_name: draft.profile_name.trim(),
    company_name: draft.company_name.trim(),
    client_code: draft.client_code.trim(),
    default_technician: draft.default_technician.trim(),
    preferred_theme: draft.preferred_theme,
    n8n_base_url: draft.n8n_base_url.trim(),
    survey_submit_endpoint: draft.survey_submit_endpoint.trim(),
    panel_catalog_endpoint: draft.panel_catalog_endpoint.trim(),
    google_sheet_panel_catalog: draft.google_sheet_panel_catalog.trim(),
    google_sheet_surveys: draft.google_sheet_surveys.trim(),
    google_sheet_price_list: draft.google_sheet_price_list.trim(),
    require_photos_before_submit: draft.require_photos_before_submit,
  };
}

function createProfileId(): string {
  return `profilo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readStringField(value: unknown, field: string): string {
  return isRecord(value) && isString(value[field]) ? value[field] : "";
}

function readThemePreference(value: unknown): ClientThemePreference {
  return isString(value) && CLIENT_THEME_PREFERENCES.includes(value as never)
    ? (value as ClientThemePreference)
    : "scuro_teal";
}

function isClientProfile(value: ClientProfile | null): value is ClientProfile {
  return value !== null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
