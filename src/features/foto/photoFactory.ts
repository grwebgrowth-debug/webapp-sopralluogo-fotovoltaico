import type { SurveyPhoto } from "@/types/photos";

export function createSurveyPhotosFromFiles(files: File[]): SurveyPhoto[] {
  return files.map((file) => ({
    photo_id: createPhotoId(),
    type: "tetto_panoramica",
    note: "",
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
    added_at: new Date().toISOString(),
    preview_url: URL.createObjectURL(file),
    raw_file: file,
  }));
}

function createPhotoId(): string {
  return `foto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
