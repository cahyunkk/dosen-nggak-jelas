import { LIKERT_SCALE } from "./constants";
import type { Variable } from "./types";

/** Utilitas parsing & validasi CSV (pure, tanpa data contoh). */

export function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Mengubah nilai mentah CSV menjadi skor Likert 1–5. */
export function parseLikertValue(raw: unknown): { value: number | null; reason?: string } {
  if (raw === null || raw === undefined) return { value: null, reason: "kosong" };
  const text = String(raw).trim();
  if (text.length === 0) return { value: null, reason: "kosong" };

  const leadingNumber = text.match(/^([1-5])(?:\D|$)/);
  if (leadingNumber) return { value: Number(leadingNumber[1]) };

  const numeric = Number(text.replace(",", "."));
  if (Number.isFinite(numeric)) {
    if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 5) return { value: numeric };
    return { value: null, reason: `nilai "${text}" di luar rentang 1–5` };
  }

  const normalized = normalizeHeader(text);
  const byLabel = LIKERT_SCALE.find(
    (option) =>
      normalizeHeader(option.label) === normalized || normalizeHeader(option.short) === normalized,
  );
  if (byLabel) return { value: byLabel.value };

  return { value: null, reason: `nilai "${text}" tidak dikenali sebagai skala 1–5` };
}

export type ColumnMapping = {
  name: string;
  age: string;
  gaming_experience: string;
  gpu_knowledge: string;
  /** variable_id -> nama kolom CSV */
  variables: Record<string, string>;
};

const IDENTITY_HINTS: Record<keyof Omit<ColumnMapping, "variables">, string[]> = {
  name: ["nama", "name", "id responden", "responden", "respondent", "nama responden", "nama lengkap"],
  age: ["usia", "age", "umur"],
  gaming_experience: [
    "pengalaman bermain game",
    "pengalaman",
    "gaming experience",
    "lama bermain game",
  ],
  gpu_knowledge: ["pengetahuan mengenai gpu", "pengetahuan gpu", "gpu knowledge", "pengetahuan"],
};

/** Tebak otomatis pemetaan kolom CSV ke field & variabel. */
export function guessMapping(headers: string[], variables: Variable[]): ColumnMapping {
  const normalizedHeaders = headers.map((header) => ({
    raw: header,
    norm: normalizeHeader(header),
  }));

  const findByHints = (hints: string[]) => {
    for (const hint of hints) {
      const exact = normalizedHeaders.find((header) => header.norm === hint);
      if (exact) return exact.raw;
    }
    for (const hint of hints) {
      const partial = normalizedHeaders.find((header) => header.norm.includes(hint));
      if (partial) return partial.raw;
    }
    return "";
  };

  const variableMapping: Record<string, string> = {};
  const used = new Set<string>();

  for (const variable of variables) {
    const targets = [normalizeHeader(variable.name), normalizeHeader(variable.code)];
    let match =
      normalizedHeaders.find((header) => !used.has(header.raw) && targets.includes(header.norm))
        ?.raw ?? "";

    if (!match) {
      match =
        normalizedHeaders.find(
          (header) =>
            !used.has(header.raw) &&
            targets.some((target) => target.length > 3 && header.norm.includes(target)),
        )?.raw ?? "";
    }

    if (match) used.add(match);
    variableMapping[variable.id] = match;
  }

  return {
    name: findByHints(IDENTITY_HINTS.name),
    age: findByHints(IDENTITY_HINTS.age),
    gaming_experience: findByHints(IDENTITY_HINTS.gaming_experience),
    gpu_knowledge: findByHints(IDENTITY_HINTS.gpu_knowledge),
    variables: variableMapping,
  };
}

export type ParsedRespondentRow = {
  rowNumber: number;
  name: string;
  age: number | null;
  gaming_experience: string | null;
  gpu_knowledge: string | null;
  scores: Record<string, number>;
  errors: string[];
};

/** Validasi satu baris CSV terhadap mapping kolom. */
export function validateCsvRow(
  row: Record<string, unknown>,
  rowNumber: number,
  mapping: ColumnMapping,
  variables: Variable[],
): ParsedRespondentRow {
  const errors: string[] = [];

  const rawName = mapping.name ? String(row[mapping.name] ?? "").trim() : "";
  const name = rawName.length > 0 ? rawName : `Responden baris ${rowNumber}`;
  if (rawName.length === 0 && mapping.name) {
    errors.push("Nama/ID responden kosong");
  }

  let age: number | null = null;
  if (mapping.age) {
    const rawAge = String(row[mapping.age] ?? "").trim();
    if (rawAge.length > 0) {
      const parsed = Number(rawAge.replace(/[^\d.-]/g, ""));
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 5 || parsed > 120) {
        errors.push(`Usia "${rawAge}" tidak valid (5–120)`);
      } else {
        age = parsed;
      }
    }
  }

  const scores: Record<string, number> = {};
  for (const variable of variables) {
    const column = mapping.variables[variable.id];
    if (!column) {
      errors.push(`Kolom untuk variabel "${variable.name}" belum dipetakan`);
      continue;
    }
    const parsed = parseLikertValue(row[column]);
    if (parsed.value === null) {
      errors.push(`${variable.name}: ${parsed.reason}`);
      continue;
    }
    scores[variable.id] = parsed.value;
  }

  const asText = (column: string) => {
    if (!column) return null;
    const value = String(row[column] ?? "").trim();
    return value.length > 0 ? value : null;
  };

  return {
    rowNumber,
    name,
    age,
    gaming_experience: asText(mapping.gaming_experience),
    gpu_knowledge: asText(mapping.gpu_knowledge),
    scores,
    errors,
  };
}

/** Header template CSV — hanya header, tanpa baris contoh. */
export function buildCsvTemplate(variables: Variable[]): string {
  const headers = [
    "Nama atau ID Responden",
    "Usia",
    "Pengalaman Bermain Game",
    "Pengetahuan mengenai GPU",
    ...variables.map((variable) => variable.name),
  ];
  return `${headers.map(escapeCsvCell).join(",")}\n`;
}

export function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
