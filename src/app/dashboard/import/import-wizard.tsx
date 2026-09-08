"use client";

import { useMemo, useState, useTransition, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  Upload,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/card";
import {
  buildCsvTemplate,
  guessMapping,
  validateCsvRow,
  type ColumnMapping,
  type ParsedRespondentRow,
} from "@/lib/csv";
import { importRespondentsAction } from "./actions";
import type { Variable } from "@/lib/types";

type Step = "upload" | "mapping" | "preview";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function ImportWizard({ variables }: { variables: Variable[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const validated: ParsedRespondentRow[] = useMemo(() => {
    if (!mapping) return [];
    return rows.map((row, index) => validateCsvRow(row, index + 2, mapping, variables));
  }, [rows, mapping, variables]);

  const validRows = validated.filter((row) => row.errors.length === 0);
  const invalidRows = validated.filter((row) => row.errors.length > 0);
  const unmappedVariables = mapping
    ? variables.filter((variable) => !mapping.variables[variable.id])
    : [];

  function reset() {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping(null);
    setFileError(null);
    setServerError(null);
  }

  function handleFile(file: File) {
    setFileError(null);
    setServerError(null);

    const isCsv =
      file.name.toLowerCase().endsWith(".csv") ||
      ["text/csv", "application/vnd.ms-excel", "text/plain"].includes(file.type);
    if (!isCsv) {
      setFileError("Format file harus .csv (bukan .xlsx). Export Google Form ke CSV terlebih dahulu.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError("Ukuran file melebihi 5 MB.");
      return;
    }

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete: (result) => {
        const parsedHeaders = (result.meta.fields ?? []).filter((header) => header.length > 0);
        if (parsedHeaders.length === 0) {
          setFileError("File CSV tidak memiliki baris header.");
          return;
        }
        const dataRows = result.data.filter((row) =>
          Object.values(row).some((value) => String(value ?? "").trim().length > 0),
        );
        if (dataRows.length === 0) {
          setFileError("File CSV tidak berisi baris data.");
          return;
        }
        setFileName(file.name);
        setHeaders(parsedHeaders);
        setRows(dataRows);
        setMapping(guessMapping(parsedHeaders, variables));
        setStep("mapping");
      },
      error: (error) => setFileError(`Gagal membaca file: ${error.message}`),
    });
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
    event.target.value = "";
  }

  function downloadTemplate() {
    const csv = buildCsvTemplate(variables);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template-kuesioner-gpu.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function confirmImport() {
    setServerError(null);
    startTransition(async () => {
      const result = await importRespondentsAction(
        validRows.map((row) => ({
          name: row.name,
          age: row.age,
          gaming_experience: row.gaming_experience,
          gpu_knowledge: row.gpu_knowledge,
          scores: row.scores,
        })),
      );
      if (!result.ok) {
        setServerError(result.message);
        return;
      }
      router.push("/dashboard/respondents?saved=imported");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {(["upload", "mapping", "preview"] as Step[]).map((item, index) => {
          const labels = { upload: "Upload File", mapping: "Mapping Kolom", preview: "Preview & Validasi" };
          const active = step === item;
          const done = (["upload", "mapping", "preview"] as Step[]).indexOf(step) > index;
          return (
            <div
              key={item}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
                active
                  ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-200"
                  : done
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-slate-800 bg-slate-900/50 text-slate-500"
              }`}
            >
              <span className="font-mono">{index + 1}</span>
              {labels[item]}
            </div>
          );
        })}
        <button type="button" onClick={downloadTemplate} className="btn-secondary btn-sm ml-auto">
          <Download className="h-3.5 w-3.5" /> Download Template CSV
        </button>
      </div>

      {fileError ? <Alert tone="error">{fileError}</Alert> : null}
      {serverError ? <Alert tone="error">{serverError}</Alert> : null}

      {step === "upload" ? (
        <>
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
              dragging
                ? "border-indigo-400 bg-indigo-500/10"
                : "border-slate-700 bg-slate-900/30 hover:border-slate-600"
            }`}
          >
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={onSelect} />
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/60 text-indigo-300">
              <Upload className="h-6 w-6" />
            </span>
            <p className="text-base font-semibold text-slate-100">
              Tarik file CSV ke sini, atau klik untuk memilih
            </p>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              Mendukung export Google Form (.csv, maks 5 MB). Baris pertama harus berisi header
              kolom. Nilai Likert wajib 1–5.
            </p>
          </label>

          <Alert tone="info" title="Template CSV kosong">
            Template hanya berisi header kolom, tanpa baris contoh. Isi sendiri dengan data
            responden nyata sebelum diimport.
          </Alert>
        </>
      ) : null}

      {step === "mapping" && mapping ? (
        <div className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-indigo-300" />
              <div>
                <p className="text-sm font-semibold text-slate-100">{fileName}</p>
                <p className="text-xs text-slate-500">
                  {rows.length} baris data · {headers.length} kolom terdeteksi
                </p>
              </div>
            </div>
            <button type="button" onClick={reset} className="btn-secondary btn-sm">
              <RotateCcw className="h-3.5 w-3.5" /> Ganti File
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <MappingSelect
              label="Nama atau ID Responden"
              headers={headers}
              value={mapping.name}
              onChange={(value) => setMapping({ ...mapping, name: value })}
            />
            <MappingSelect
              label="Usia (opsional)"
              headers={headers}
              value={mapping.age}
              onChange={(value) => setMapping({ ...mapping, age: value })}
            />
            <MappingSelect
              label="Pengalaman Bermain Game (opsional)"
              headers={headers}
              value={mapping.gaming_experience}
              onChange={(value) => setMapping({ ...mapping, gaming_experience: value })}
            />
            <MappingSelect
              label="Pengetahuan mengenai GPU (opsional)"
              headers={headers}
              value={mapping.gpu_knowledge}
              onChange={(value) => setMapping({ ...mapping, gpu_knowledge: value })}
            />
          </div>

          <h3 className="mt-8 mb-3 text-sm font-semibold text-slate-100">
            Pemetaan 10 Variabel Likert <span className="text-rose-400">*</span>
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {variables.map((variable) => (
              <MappingSelect
                key={variable.id}
                label={variable.name}
                headers={headers}
                value={mapping.variables[variable.id] ?? ""}
                onChange={(value) =>
                  setMapping({
                    ...mapping,
                    variables: { ...mapping.variables, [variable.id]: value },
                  })
                }
              />
            ))}
          </div>

          {unmappedVariables.length > 0 ? (
            <Alert tone="warning" className="mt-5" title="Masih ada variabel yang belum dipetakan">
              {unmappedVariables.map((variable) => variable.name).join(", ")}
            </Alert>
          ) : null}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="btn-primary"
              disabled={unmappedVariables.length > 0 || !mapping.name}
              onClick={() => setStep("preview")}
            >
              Lanjut ke Preview
            </button>
            <button type="button" className="btn-secondary" onClick={reset}>
              Batal
            </button>
          </div>
          {!mapping.name ? (
            <p className="mt-2 text-xs text-amber-400">
              Kolom nama/ID responden wajib dipetakan.
            </p>
          ) : null}
        </div>
      ) : null}

      {step === "preview" && mapping ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <p className="text-sm text-slate-400">Total Baris</p>
              <p className="mt-2 text-2xl font-bold text-white">{validated.length}</p>
            </div>
            <div className="card border-emerald-800/50 p-5">
              <p className="text-sm text-emerald-300">Data Valid</p>
              <p className="mt-2 text-2xl font-bold text-emerald-300">{validRows.length}</p>
            </div>
            <div className="card border-rose-900/50 p-5">
              <p className="text-sm text-rose-300">Data Error</p>
              <p className="mt-2 text-2xl font-bold text-rose-300">{invalidRows.length}</p>
            </div>
          </div>

          {invalidRows.length > 0 ? (
            <div className="card p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-300">
                <AlertTriangle className="h-4 w-4" /> Baris bermasalah (tidak akan diimport)
              </h3>
              <div className="max-h-56 space-y-2 overflow-auto pr-1">
                {invalidRows.slice(0, 100).map((row) => (
                  <div
                    key={row.rowNumber}
                    className="rounded-lg border border-rose-900/40 bg-rose-950/20 px-3 py-2 text-xs"
                  >
                    <span className="font-mono text-rose-300">Baris {row.rowNumber}</span>{" "}
                    <span className="text-slate-300">{row.name}</span>
                    <ul className="mt-1 list-inside list-disc text-slate-400">
                      {row.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="card overflow-hidden">
            <div className="border-b border-slate-800/80 p-4">
              <h3 className="text-sm font-semibold text-slate-100">
                Preview Data ({Math.min(validated.length, 50)} baris pertama)
              </h3>
            </div>
            <div className="max-h-96 overflow-auto">
              <table className="table-base">
                <thead className="sticky top-0 bg-slate-900">
                  <tr>
                    <th>#</th>
                    <th>Status</th>
                    <th>Nama / ID</th>
                    <th>Usia</th>
                    {variables.map((variable) => (
                      <th key={variable.id} className="text-center whitespace-nowrap">
                        {variable.name.length > 16
                          ? `${variable.name.slice(0, 15)}…`
                          : variable.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {validated.slice(0, 50).map((row) => (
                    <tr key={row.rowNumber}>
                      <td className="font-mono text-xs text-slate-500">{row.rowNumber}</td>
                      <td>
                        {row.errors.length === 0 ? (
                          <Badge tone="emerald">Valid</Badge>
                        ) : (
                          <Badge tone="rose">Error</Badge>
                        )}
                      </td>
                      <td className="whitespace-nowrap">{row.name}</td>
                      <td>{row.age ?? "—"}</td>
                      {variables.map((variable) => (
                        <td key={variable.id} className="text-center font-mono">
                          {row.scores[variable.id] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-primary"
              disabled={validRows.length === 0 || pending}
              onClick={confirmImport}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {pending ? "Mengimport…" : `Konfirmasi Import ${validRows.length} Data`}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setStep("mapping")}>
              Kembali ke Mapping
            </button>
            <button type="button" className="btn-ghost" onClick={reset}>
              Batal
            </button>
          </div>
          {validRows.length === 0 ? (
            <Alert tone="warning">
              Tidak ada baris valid. Perbaiki file CSV atau pemetaan kolom terlebih dahulu.
            </Alert>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MappingSelect({
  label,
  headers,
  value,
  onChange,
}: {
  label: string;
  headers: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">— tidak dipetakan —</option>
        {headers.map((header) => (
          <option key={header} value={header}>
            {header}
          </option>
        ))}
      </select>
    </div>
  );
}
