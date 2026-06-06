export function formatExportTimestamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-") + `-${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

export function formatDisplayDateTime(value?: string): string {
  if (!value) {
    return "jamais";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function getDateRange(values: string[]): { fromDate?: string; toDate?: string } {
  const validDates = values.filter(Boolean).sort();

  return {
    fromDate: validDates[0],
    toDate: validDates.at(-1)
  };
}
