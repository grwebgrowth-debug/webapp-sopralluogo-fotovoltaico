export const CLIENT_THEME_PREFERENCES = [
  "scuro_teal",
  "scuro_verde",
  "scuro_blu",
] as const;

export type ClientThemePreference = (typeof CLIENT_THEME_PREFERENCES)[number];

export type ClientProfile = {
  profile_id: string;
  profile_name: string;
  company_name: string;
  client_code: string;
  default_technician: string;
  preferred_theme: ClientThemePreference;
  n8n_base_url: string;
  survey_submit_endpoint: string;
  panel_catalog_endpoint: string;
  google_sheet_panel_catalog: string;
  google_sheet_surveys: string;
  google_sheet_price_list: string;
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
  | "n8n_base_url"
  | "survey_submit_endpoint"
  | "panel_catalog_endpoint"
  | "google_sheet_panel_catalog"
  | "google_sheet_surveys"
  | "google_sheet_price_list"
  | "require_photos_before_submit"
  | "demo_mode"
>;
