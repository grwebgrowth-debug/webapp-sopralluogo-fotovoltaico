export const SURVEY_PHOTO_TYPES = [
  "tetto_panoramica",
  "falda",
  "ostacolo",
  "quadro_elettrico",
  "contatore",
  "altro",
] as const;

export type SurveyPhotoType = (typeof SURVEY_PHOTO_TYPES)[number];

export type SurveyPhoto = {
  photo_id: string;
  type: SurveyPhotoType;
  note: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  added_at: string;
  preview_url?: string;
};
