import "./popup.css";
import { sendToPatrimoineApp } from "../app/sendToPatrimoineApp";
import {
  fetchAllBankinData,
  getBankinDiagnostics,
  testBankinConnection,
  type BankinDiagnostics,
  type BankinProgressEvent
} from "../bankin/bankinClient";
import { normalizeBankinExport } from "../bankin/normalizer";
import { downloadCsvExport } from "../export/exportCsv";
import { downloadJsonExport } from "../export/exportJson";
import { validatePatrimoineExport, type ExportValidationResult } from "../export/validateExport";
import {
  clearAllLocalData,
  clearBankinHeaders,
  getBankinHeaders,
  getSettings,
  saveSettings
} from "../storage/storage";
import type { ExtensionSettings, PatrimoineBankinExport } from "../types/patrimoine";
import { formatDisplayDateTime } from "../utils/dates";

const sessionStatus = document.querySelector<HTMLParagraphElement>("#sessionStatus");
const captureTime = document.querySelector<HTMLParagraphElement>("#captureTime");
const sessionHelp = document.querySelector<HTMLParagraphElement>("#sessionHelp");
const mainView = document.querySelector<HTMLElement>("#mainView");
const settingsView = document.querySelector<HTMLElement>("#settingsView");
const summary = document.querySelector<HTMLElement>("#summary");
const sinceInput = document.querySelector<HTMLInputElement>("#sinceInput");
const untilInput = document.querySelector<HTMLInputElement>("#untilInput");
const appImportUrlInput = document.querySelector<HTMLInputElement>("#appImportUrlInput");
const importKeyInput = document.querySelector<HTMLInputElement>("#importKeyInput");
const defaultStartDateInput = document.querySelector<HTMLInputElement>("#defaultStartDateInput");
const includeEmptyAccountsInput = document.querySelector<HTMLInputElement>("#includeEmptyAccountsInput");
const showCsvExportInput = document.querySelector<HTMLInputElement>("#showCsvExportInput");
const debugModeInput = document.querySelector<HTMLInputElement>("#debugModeInput");
const buttons = {
  testConnection: document.querySelector<HTMLButtonElement>("#testConnectionButton"),
  preview: document.querySelector<HTMLButtonElement>("#previewButton"),
  exportJson: document.querySelector<HTMLButtonElement>("#exportJsonButton"),
  exportCsv: document.querySelector<HTMLButtonElement>("#exportCsvButton"),
  sendToApp: document.querySelector<HTMLButtonElement>("#sendToAppButton"),
  settings: document.querySelector<HTMLButtonElement>("#settingsButton"),
  clearSession: document.querySelector<HTMLButtonElement>("#clearSessionButton"),
  saveSettings: document.querySelector<HTMLButtonElement>("#saveSettingsButton"),
  clearAll: document.querySelector<HTMLButtonElement>("#clearAllButton"),
  back: document.querySelector<HTMLButtonElement>("#backButton")
};

let lastExport: PatrimoineBankinExport | null = null;
let currentSettings: ExtensionSettings = {};

function setSummary(message: string, tone: "default" | "warning" | "error" = "default"): void {
  if (summary) {
    summary.textContent = message;
    summary.classList.toggle("warning", tone === "warning");
    summary.classList.toggle("error", tone === "error");
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

  sessionHelp?.classList.toggle("visible", !detected);

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

function getValidationLines(validation?: ExportValidationResult): string[] {
  if (!validation) {
    return [];
  }

  return [
    ...validation.errors.map((issue) => `Erreur validation : ${issue.message}`),
    ...validation.warnings.map((issue) => `Attention : ${issue.message}`)
  ];
}

function renderDiagnostics(diagnostics: BankinDiagnostics): string[] {
  if (!currentSettings.debugMode) {
    return [];
  }

  return [
    "Diagnostic :",
    `Authorization capture : ${diagnostics.hasAuthorization ? "oui" : "non"}`,
    `Bankin-Version capture : ${diagnostics.hasBankinVersion ? "oui" : "non"}`,
    `Client-Id capture : ${diagnostics.hasClientId ? "oui" : "non"}`,
    `Client-Secret capture : ${diagnostics.hasClientSecret ? "oui" : "non"}`,
    `Endpoint teste : ${diagnostics.lastTestedEndpoint ?? "-"}`,
    `Dernier statut HTTP : ${diagnostics.lastStatus ?? "-"} ${diagnostics.lastStatusText ?? ""}`.trim()
  ];
}

function renderExportSummary(
  data: PatrimoineBankinExport,
  status = "Export pret",
  validation?: ExportValidationResult
): void {
  const accountIdsWithTransactions = new Set(data.transactions.map((transaction) => transaction.sourceAccountId));
  const accountsWithoutTransactions = data.accounts.filter(
    (account) => !accountIdsWithTransactions.has(account.sourceAccountId)
  ).length;
  const tone = validation?.errors.length ? "error" : validation?.warnings.length ? "warning" : "default";

  setSummary([
    `Comptes recuperes : ${data.metadata.accountCount}`,
    `Comptes sans transaction : ${accountsWithoutTransactions}`,
    `Categories recuperees : ${data.metadata.categoryCount}`,
    `Transactions recuperees : ${data.metadata.transactionCount}`,
    `Periode : ${data.metadata.fromDate ?? "-"} au ${data.metadata.toDate ?? "-"}`,
    `Statut : ${status}`,
    ...getValidationLines(validation)
  ].join("\n"), tone);
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

function applyAccountSettings(data: PatrimoineBankinExport): PatrimoineBankinExport {
  if (currentSettings.includeAccountsWithoutTransactions !== false) {
    return data;
  }

  const accountIdsWithTransactions = new Set(data.transactions.map((transaction) => transaction.sourceAccountId));
  const accounts = data.accounts.filter((account) => accountIdsWithTransactions.has(account.sourceAccountId));

  return {
    ...data,
    accounts,
    metadata: {
      ...data.metadata,
      accountCount: accounts.length
    }
  };
}

function updateProgress(event: BankinProgressEvent): void {
  const labels: Record<BankinProgressEvent["resource"], string> = {
    accounts: "comptes",
    categories: "categories",
    transactions: "transactions"
  };

  setSummary(`Recuperation ${labels[event.resource]} : page ${event.page}, ${event.count} element(s).`);
}

async function fetchNormalizedExport(): Promise<{ data: PatrimoineBankinExport; validation: ExportValidationResult }> {
  const raw = await fetchAllBankinData({
    ...getFetchOptions(),
    onProgress: updateProgress
  });
  const normalized = await normalizeBankinExport(raw);
  const data = applyAccountSettings(normalized);
  const validation = validatePatrimoineExport(data);
  lastExport = data;

  if (data.transactions.length === 0) {
    setSummary("Aucune transaction trouvee. Verifie la periode selectionnee.");
  } else {
    renderExportSummary(data, validation.valid ? "Export pret" : "Export invalide", validation);
  }

  return { data, validation };
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
  currentSettings = settings;

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

  if (includeEmptyAccountsInput) {
    includeEmptyAccountsInput.checked = settings.includeAccountsWithoutTransactions !== false;
  }

  if (showCsvExportInput) {
    showCsvExportInput.checked = settings.showCsvExport !== false;
  }

  if (debugModeInput) {
    debugModeInput.checked = Boolean(settings.debugMode);
  }

  buttons.exportCsv?.classList.toggle("hidden", settings.showCsvExport === false);
}

function showSettings(show: boolean): void {
  mainView?.classList.toggle("hidden", show);
  settingsView?.classList.toggle("hidden", !show);
}

buttons.testConnection?.addEventListener("click", () => {
  void runAction(async () => {
    const diagnostics = await testBankinConnection();
    setSummary([
      "Connexion Bankin OK.",
      ...renderDiagnostics(diagnostics)
    ].join("\n"));
  });
});

buttons.preview?.addEventListener("click", () => {
  void runAction(async () => {
    const { data, validation } = await fetchNormalizedExport();
    renderExportSummary(data, validation.valid ? "Previsualisation prete" : "Previsualisation invalide", validation);
  });
});

buttons.exportJson?.addEventListener("click", () => {
  void runAction(async () => {
    const { data, validation } = await fetchNormalizedExport();
    if (!validation.valid) {
      renderExportSummary(data, "Export bloque par la validation", validation);
      return;
    }

    await downloadJsonExport(data);
    renderExportSummary(data, "Export JSON telecharge", validation);
  });
});

buttons.exportCsv?.addEventListener("click", () => {
  void runAction(async () => {
    const result = lastExport
      ? { data: lastExport, validation: validatePatrimoineExport(lastExport) }
      : await fetchNormalizedExport();
    if (!result.validation.valid) {
      renderExportSummary(result.data, "Export bloque par la validation", result.validation);
      return;
    }

    const data = result.data;
    await downloadCsvExport(data);
    renderExportSummary(data, "Export CSV telecharge", result.validation);
  });
});

buttons.sendToApp?.addEventListener("click", () => {
  void runAction(async () => {
    const exportResult = lastExport
      ? { data: lastExport, validation: validatePatrimoineExport(lastExport) }
      : await fetchNormalizedExport();
    if (!exportResult.validation.valid) {
      renderExportSummary(exportResult.data, "Import bloque par la validation", exportResult.validation);
      return;
    }

    const data = exportResult.data;
    const importResult = await sendToPatrimoineApp(data, await getSettings());
    renderExportSummary(
      data,
      [
        importResult.success ? "Import reussi" : "Import termine avec erreurs",
        `Comptes importes : ${importResult.accountsImported}`,
        `Comptes mis a jour : ${importResult.accountsUpdated}`,
        `Transactions importees : ${importResult.transactionsImported}`,
        `Doublons ignores : ${importResult.duplicatesIgnored}`,
        ...(importResult.errors?.length ? [`Erreurs : ${importResult.errors.join(", ")}`] : [])
      ].join("\n"),
      validatePatrimoineExport(data)
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
      defaultStartDate: defaultStartDateInput?.value || undefined,
      includeAccountsWithoutTransactions: includeEmptyAccountsInput?.checked ?? true,
      showCsvExport: showCsvExportInput?.checked ?? true,
      debugMode: debugModeInput?.checked ?? false
    };

    await saveSettings(settings);
    currentSettings = settings;
    if (sinceInput && settings.defaultStartDate) {
      sinceInput.value = settings.defaultStartDate;
    }
    buttons.exportCsv?.classList.toggle("hidden", settings.showCsvExport === false);
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

buttons.clearAll?.addEventListener("click", () => {
  void runAction(async () => {
    await clearAllLocalData();
    lastExport = null;
    await loadSettingsForm();
    await refreshSessionStatus();
    setSummary("Session et parametres locaux effaces.");
  });
});

void getBankinDiagnostics().then((diagnostics) => {
  if (diagnostics.hasAuthorization && currentSettings.debugMode) {
    setSummary(renderDiagnostics(diagnostics).join("\n"));
  }
});

void Promise.all([refreshSessionStatus(), loadSettingsForm()]);
