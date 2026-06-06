import "./popup.css";
import { sendToPatrimoineApp } from "../app/sendToPatrimoineApp";
import { fetchAllBankinData, testBankinConnection } from "../bankin/bankinClient";
import { normalizeBankinExport } from "../bankin/normalizer";
import { downloadCsvExport } from "../export/exportCsv";
import { downloadJsonExport } from "../export/exportJson";
import { clearBankinHeaders, getBankinHeaders, getSettings, saveSettings } from "../storage/storage";
import type { PatrimoineBankinExport } from "../types/patrimoine";
import { formatDisplayDateTime } from "../utils/dates";

const sessionStatus = document.querySelector<HTMLParagraphElement>("#sessionStatus");
const captureTime = document.querySelector<HTMLParagraphElement>("#captureTime");
const mainView = document.querySelector<HTMLElement>("#mainView");
const settingsView = document.querySelector<HTMLElement>("#settingsView");
const summary = document.querySelector<HTMLElement>("#summary");
const sinceInput = document.querySelector<HTMLInputElement>("#sinceInput");
const untilInput = document.querySelector<HTMLInputElement>("#untilInput");
const appImportUrlInput = document.querySelector<HTMLInputElement>("#appImportUrlInput");
const importKeyInput = document.querySelector<HTMLInputElement>("#importKeyInput");
const defaultStartDateInput = document.querySelector<HTMLInputElement>("#defaultStartDateInput");
const buttons = {
  testConnection: document.querySelector<HTMLButtonElement>("#testConnectionButton"),
  exportJson: document.querySelector<HTMLButtonElement>("#exportJsonButton"),
  exportCsv: document.querySelector<HTMLButtonElement>("#exportCsvButton"),
  sendToApp: document.querySelector<HTMLButtonElement>("#sendToAppButton"),
  settings: document.querySelector<HTMLButtonElement>("#settingsButton"),
  clearSession: document.querySelector<HTMLButtonElement>("#clearSessionButton"),
  saveSettings: document.querySelector<HTMLButtonElement>("#saveSettingsButton"),
  back: document.querySelector<HTMLButtonElement>("#backButton")
};

let lastExport: PatrimoineBankinExport | null = null;

function setSummary(message: string): void {
  if (summary) {
    summary.textContent = message;
  }
}

function setBusy(isBusy: boolean): void {
  Object.values(buttons).forEach((button) => {
    if (button) {
      button.disabled = isBusy;
    }
  });
}

async function refreshSessionStatus(): Promise<void> {
  const bankinHeaders = await getBankinHeaders();
  const detected = Boolean(bankinHeaders?.authorization);

  if (sessionStatus) {
    sessionStatus.textContent = `Session Bankin : ${detected ? "detectee" : "non detectee"}`;
  }

  if (captureTime) {
    captureTime.textContent = `Derniere capture : ${formatDisplayDateTime(bankinHeaders?.capturedAt)}`;
  }
}

function getFetchOptions(): { since?: string; until?: string } {
  return {
    since: sinceInput?.value || undefined,
    until: untilInput?.value || undefined
  };
}

function renderExportSummary(data: PatrimoineBankinExport, status = "Export pret"): void {
  setSummary([
    `Comptes recuperes : ${data.metadata.accountCount}`,
    `Categories recuperees : ${data.metadata.categoryCount}`,
    `Transactions recuperees : ${data.metadata.transactionCount}`,
    `Periode : ${data.metadata.fromDate ?? "-"} au ${data.metadata.toDate ?? "-"}`,
    `Statut : ${status}`
  ].join("\n"));
}

function getReadableError(error: unknown): string {
  if (error instanceof TypeError) {
    return "Erreur reseau. Verifie ta connexion ou reessaie plus tard.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Erreur inconnue.";
}

async function fetchNormalizedExport(): Promise<PatrimoineBankinExport> {
  const raw = await fetchAllBankinData(getFetchOptions());
  const normalized = await normalizeBankinExport(raw);
  lastExport = normalized;

  if (normalized.transactions.length === 0) {
    setSummary("Aucune transaction trouvee. Verifie la periode selectionnee.");
  } else {
    renderExportSummary(normalized);
  }

  return normalized;
}

async function runAction(action: () => Promise<void>): Promise<void> {
  setBusy(true);
  try {
    await action();
    await refreshSessionStatus();
  } catch (error) {
    setSummary(getReadableError(error));
  } finally {
    setBusy(false);
  }
}

async function loadSettingsForm(): Promise<void> {
  const settings = await getSettings();

  if (appImportUrlInput) {
    appImportUrlInput.value = settings.appImportUrl ?? "";
  }

  if (importKeyInput) {
    importKeyInput.value = settings.importKey ?? "";
  }

  if (defaultStartDateInput) {
    defaultStartDateInput.value = settings.defaultStartDate ?? "";
  }

  if (sinceInput && settings.defaultStartDate && !sinceInput.value) {
    sinceInput.value = settings.defaultStartDate;
  }
}

function showSettings(show: boolean): void {
  mainView?.classList.toggle("hidden", show);
  settingsView?.classList.toggle("hidden", !show);
}

buttons.testConnection?.addEventListener("click", () => {
  void runAction(async () => {
    await testBankinConnection();
    setSummary("Connexion Bankin OK.");
  });
});

buttons.exportJson?.addEventListener("click", () => {
  void runAction(async () => {
    const data = await fetchNormalizedExport();
    await downloadJsonExport(data);
    renderExportSummary(data, "Export JSON telecharge");
  });
});

buttons.exportCsv?.addEventListener("click", () => {
  void runAction(async () => {
    const data = lastExport ?? await fetchNormalizedExport();
    await downloadCsvExport(data);
    renderExportSummary(data, "Export CSV telecharge");
  });
});

buttons.sendToApp?.addEventListener("click", () => {
  void runAction(async () => {
    const data = lastExport ?? await fetchNormalizedExport();
    const result = await sendToPatrimoineApp(data, await getSettings());
    renderExportSummary(
      data,
      [
        result.success ? "Import reussi" : "Import termine avec erreurs",
        `Comptes importes : ${result.accountsImported}`,
        `Comptes mis a jour : ${result.accountsUpdated}`,
        `Transactions importees : ${result.transactionsImported}`,
        `Doublons ignores : ${result.duplicatesIgnored}`,
        ...(result.errors?.length ? [`Erreurs : ${result.errors.join(", ")}`] : [])
      ].join("\n")
    );
  });
});

buttons.settings?.addEventListener("click", () => {
  showSettings(true);
});

buttons.back?.addEventListener("click", () => {
  showSettings(false);
});

buttons.saveSettings?.addEventListener("click", () => {
  void runAction(async () => {
    const settings = {
      appImportUrl: appImportUrlInput?.value || undefined,
      importKey: importKeyInput?.value || undefined,
      defaultStartDate: defaultStartDateInput?.value || undefined
    };

    await saveSettings(settings);
    if (sinceInput && settings.defaultStartDate) {
      sinceInput.value = settings.defaultStartDate;
    }
    showSettings(false);
    setSummary("Parametres enregistres.");
  });
});

buttons.clearSession?.addEventListener("click", () => {
  void runAction(async () => {
    await clearBankinHeaders();
    lastExport = null;
    setSummary("Session capturee effacee.");
  });
});

void Promise.all([refreshSessionStatus(), loadSettingsForm()]);
