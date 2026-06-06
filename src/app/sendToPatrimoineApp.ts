import type { ImportResult, PatrimoineBankinExport, ExtensionSettings } from "../types/patrimoine";

export async function sendToPatrimoineApp(
  data: PatrimoineBankinExport,
  settings: ExtensionSettings
): Promise<ImportResult> {
  if (!settings.appImportUrl) {
    throw new Error("URL de l'application patrimoine manquante.");
  }

  if (!settings.importKey) {
    throw new Error("Cle d'import manquante.");
  }

  const response = await fetch(settings.appImportUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Import-Key": settings.importKey
    },
    body: JSON.stringify(data)
  });

  const body = await response.json().catch(() => null) as ImportResult | null;

  if (!response.ok) {
    throw new Error(body?.errors?.join("\n") || `Erreur import application ${response.status}`);
  }

  if (!body) {
    throw new Error("Reponse d'import invalide.");
  }

  return body;
}
