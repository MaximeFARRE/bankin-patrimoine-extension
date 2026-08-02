import type { PatrimoineDuplicateStats } from "../types/patrimoine";

export function getDuplicateStats(values: string[]): PatrimoineDuplicateStats {
  const counts = values.reduce(
    (result, value) => result.set(value, (result.get(value) ?? 0) + 1),
    new Map<string, number>()
  );
  const duplicatedCounts = Array.from(counts.values()).filter((count) => count > 1);

  return {
    groupCount: duplicatedCounts.length,
    affectedLineCount: duplicatedCounts.reduce((total, count) => total + count, 0),
    excessLineCount: duplicatedCounts.reduce((total, count) => total + count - 1, 0)
  };
}
