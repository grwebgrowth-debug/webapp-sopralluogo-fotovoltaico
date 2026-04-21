"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ActiveClientProfileSnapshot,
  ClientProfile,
  ClientProfileDraft,
  ClientThemePreference,
} from "@/types/profiles";
import { CLIENT_THEME_PREFERENCES } from "@/types/profiles";

const CLIENT_PROFILES_STORAGE_KEY =
  "sopralluogo_fotovoltaico_v1_client_profiles";
const CLIENT_PROFILES_STORAGE_VERSION = 2;
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
    require_photos_before_submit: false,
    demo_mode: false,
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
    require_photos_before_submit: profile.require_photos_before_submit,
    demo_mode: profile.demo_mode,
  };
}

export function useClientProfiles() {
  const [store, setStore] = useState<ClientProfilesStore>(() =>
    createEmptyClientProfilesStore(),
  );
  const storeRef = useRef(store);
  const [hydrated, setHydrated] = useState(false);

  const replaceStore = useCallback((nextStore: ClientProfilesStore) => {
    storeRef.current = nextStore;
    setStore(nextStore);
  }, []);

  useEffect(() => {
    replaceStore(loadClientProfilesStore(storeRef.current));
    setHydrated(true);

    function handleProfilesChanged() {
      replaceStore(loadClientProfilesStore(storeRef.current));
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
  }, [replaceStore]);

  const persistStore = useCallback(
    (createNextStore: (currentStore: ClientProfilesStore) => ClientProfilesStore) => {
      const currentStore = loadClientProfilesStore(storeRef.current);
      const nextStore = normalizeClientProfilesStore(
        createNextStore(currentStore),
      );

      replaceStore(nextStore);
      saveClientProfilesStore(nextStore);

      return nextStore;
    },
    [replaceStore],
  );

  const createProfile = useCallback(
    (draft: ClientProfileDraft) => {
      const now = new Date().toISOString();
      const nextProfile: ClientProfile = {
        ...sanitizeClientProfileDraft(draft),
        profile_id: createProfileId(),
        created_at: now,
        updated_at: now,
      };

      persistStore((currentStore) => ({
        storage_version: CLIENT_PROFILES_STORAGE_VERSION,
        active_profile_id: nextProfile.profile_id,
        profiles: [...currentStore.profiles, nextProfile],
      }));

      return nextProfile;
    },
    [persistStore],
  );

  const updateProfile = useCallback(
    (profileId: string, draft: ClientProfileDraft) => {
      persistStore((currentStore) => ({
        storage_version: CLIENT_PROFILES_STORAGE_VERSION,
        active_profile_id: currentStore.active_profile_id,
        profiles: currentStore.profiles.map((profile) =>
          profile.profile_id === profileId
            ? {
                ...profile,
                ...sanitizeClientProfileDraft(draft),
                updated_at: new Date().toISOString(),
              }
            : profile,
        ),
      }));
    },
    [persistStore],
  );

  const deleteProfile = useCallback(
    (profileId: string) => {
      persistStore((currentStore) => {
        const profiles = currentStore.profiles.filter(
          (profile) => profile.profile_id !== profileId,
        );
        const activeProfileId =
          currentStore.active_profile_id === profileId
            ? profiles[0]?.profile_id ?? null
            : currentStore.active_profile_id;

        return {
          storage_version: CLIENT_PROFILES_STORAGE_VERSION,
          active_profile_id: activeProfileId,
          profiles,
        };
      });
    },
    [persistStore],
  );

  const selectActiveProfile = useCallback(
    (profileId: string | null) => {
      persistStore((currentStore) => {
        if (
          profileId !== null &&
          !currentStore.profiles.some((profile) => profile.profile_id === profileId)
        ) {
          return currentStore;
        }

        return {
          storage_version: CLIENT_PROFILES_STORAGE_VERSION,
          active_profile_id: profileId,
          profiles: currentStore.profiles,
        };
      });
    },
    [persistStore],
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

function loadClientProfilesStore(
  fallbackStore = createEmptyClientProfilesStore(),
): ClientProfilesStore {
  if (!canUseLocalStorage()) {
    return fallbackStore;
  }

  let rawValue: string | null;

  try {
    rawValue = window.localStorage.getItem(CLIENT_PROFILES_STORAGE_KEY);
  } catch {
    return fallbackStore;
  }

  if (!rawValue) {
    return fallbackStore;
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    const normalizedStore = normalizeClientProfilesStore(parsedValue);

    if (shouldPersistMigratedStore(parsedValue)) {
      saveClientProfilesStore(normalizedStore);
    }

    return normalizedStore;
  } catch {
    return createEmptyClientProfilesStore();
  }
}

function saveClientProfilesStore(store: ClientProfilesStore): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      CLIENT_PROFILES_STORAGE_KEY,
      JSON.stringify(store),
    );
    window.dispatchEvent(new Event(CLIENT_PROFILES_CHANGED_EVENT));
  } catch {
    // Se il browser blocca localStorage, manteniamo almeno lo stato in memoria.
  }
}

function normalizeClientProfilesStore(value: unknown): ClientProfilesStore {
  if (
    !isRecord(value) ||
    (value.storage_version !== 1 && value.storage_version !== CLIENT_PROFILES_STORAGE_VERSION)
  ) {
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
      require_photos_before_submit: Boolean(
        value.require_photos_before_submit,
      ),
      demo_mode: Boolean(value.demo_mode),
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
    require_photos_before_submit: draft.require_photos_before_submit,
    demo_mode: draft.demo_mode,
  };
}

function createProfileId(): string {
  return `profilo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function canUseLocalStorage(): boolean {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function readStringField(value: unknown, field: string): string {
  return isRecord(value) && isString(value[field]) ? value[field] : "";
}

function readThemePreference(value: unknown): ClientThemePreference {
  return isString(value) && CLIENT_THEME_PREFERENCES.includes(value as never)
    ? (value as ClientThemePreference)
    : "scuro_teal";
}

function shouldPersistMigratedStore(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.profiles)) {
    return false;
  }

  if (value.storage_version !== CLIENT_PROFILES_STORAGE_VERSION) {
    return true;
  }

  return value.profiles.some(hasDeprecatedProfileFields);
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

function hasDeprecatedProfileFields(value: unknown): boolean {
  return (
    isRecord(value) &&
    ("n8n_base_url" in value ||
      "survey_submit_endpoint" in value ||
      "panel_catalog_endpoint" in value ||
      "google_sheet_panel_catalog" in value ||
      "google_sheet_surveys" in value ||
      "google_sheet_price_list" in value)
  );
}
