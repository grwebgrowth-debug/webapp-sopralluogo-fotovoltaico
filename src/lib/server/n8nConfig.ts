import { N8nProxyError } from "./n8nErrors";

export type N8nServerConfig = {
  webappSecret: string;
  workflowUrl: string;
};

export type N8nWorkflowName =
  | "catalogo_pannelli"
  | "ricezione_sopralluogo"
  | "upload_foto";

const N8N_WORKFLOW_ENV_MAP: Record<N8nWorkflowName, string> = {
  catalogo_pannelli: "N8N_WF01_CATALOGO_WEBHOOK_URL",
  ricezione_sopralluogo: "N8N_WF02_RICEZIONE_WEBHOOK_URL",
  upload_foto: "N8N_WF03_UPLOAD_FOTO_WEBHOOK_URL",
};

export function getN8nServerConfig(workflow: N8nWorkflowName): N8nServerConfig {
  return {
    webappSecret: readRequiredEnv("N8N_WEBAPP_SECRET"),
    workflowUrl: readRequiredEnv(N8N_WORKFLOW_ENV_MAP[workflow]),
  };
}

function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new N8nProxyError(
      `Variabile ambiente mancante: ${name}`,
      500,
      "not_configured",
      { env: name },
    );
  }

  return value;
}
