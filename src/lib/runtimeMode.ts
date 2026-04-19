import type {
  ActiveClientProfileSnapshot,
  ClientProfile,
} from "@/types/profiles";

export type RuntimeMode = "demo" | "live";

type RuntimeProfile = Pick<ClientProfile, "demo_mode"> | ActiveClientProfileSnapshot | null;

export function resolveRuntimeMode(profile: RuntimeProfile): RuntimeMode {
  if (profile?.demo_mode) {
    return "demo";
  }

  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return "demo";
  }

  return "live";
}

export function isDemoMode(profile: RuntimeProfile): boolean {
  return resolveRuntimeMode(profile) === "demo";
}
