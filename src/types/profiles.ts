export const CLIENT_THEME_PREFERENCES = [
  "scuro_teal",
  "scuro_verde",
  "scuro_blu",
  "chiaro_pulito",
  "chiaro_contrasto",
] as const;

export type ClientThemePreference = (typeof CLIENT_THEME_PREFERENCES)[number];

export type ClientProfile = {
  profile_id: string;
  profile_name: string;
  company_name: string;
  client_code: string;
  default_technician: string;
  preferred_theme: ClientThemePreference;
  require_photos_before_submit: boolean;
  demo_mode: boolean;
  created_at: string;
  updated_at: string;
};

export type ClientProfileDraft = Omit<
  ClientProfile,
  "profile_id" | "created_at" | "updated_at"
>;

export type ActiveClientProfileSnapshot = Pick<
  ClientProfile,
  | "profile_id"
  | "profile_name"
  | "company_name"
  | "client_code"
  | "default_technician"
  | "preferred_theme"
  | "require_photos_before_submit"
  | "demo_mode"
>;
