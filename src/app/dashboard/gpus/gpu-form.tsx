"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveGpuAction } from "./actions";
import type { ActionResult, Gpu } from "@/lib/types";

export function GpuForm({ initial }: { initial?: Gpu }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(saveGpuAction, null);

  return (
    <form action={formAction} className="space-y-6">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      {state && !state.ok ? <Alert tone="error">{state.message}</Alert> : null}

      <div className="card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">
              Nama GPU <span className="text-rose-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              className="input"
              defaultValue={initial?.name ?? ""}
              placeholder="Nama lengkap kartu grafis"
            />
            {state?.errors?.name ? (
              <p className="mt-1 text-xs text-rose-400">{state.errors.name}</p>
            ) : null}
          </div>
          <div>
            <label className="label" htmlFor="brand">
              Brand <span className="text-rose-400">*</span>
            </label>
            <input
              id="brand"
              name="brand"
              required
              className="input"
              defaultValue={initial?.brand ?? ""}
              placeholder="Produsen / vendor"
            />
            {state?.errors?.brand ? (
              <p className="mt-1 text-xs text-rose-400">{state.errors.brand}</p>
            ) : null}
          </div>
          <div>
            <label className="label" htmlFor="series">
              Series / Generasi
            </label>
            <input
              id="series"
              name="series"
              className="input"
              defaultValue={initial?.series ?? ""}
              placeholder="Seri atau generasi produk"
            />
          </div>
          <div>
            <label className="label" htmlFor="vram_gb">
              VRAM (GB)
            </label>
            <input
              id="vram_gb"
              name="vram_gb"
              type="number"
              min={0}
              max={512}
              className="input"
              defaultValue={initial?.vram_gb ?? ""}
            />
            {state?.errors?.vram_gb ? (
              <p className="mt-1 text-xs text-rose-400">{state.errors.vram_gb}</p>
            ) : null}
          </div>
          <div>
            <label className="label" htmlFor="release_year">
              Tahun Rilis
            </label>
            <input
              id="release_year"
              name="release_year"
              type="number"
              min={1990}
              max={2100}
              className="input"
              defaultValue={initial?.release_year ?? ""}
            />
            {state?.errors?.release_year ? (
              <p className="mt-1 text-xs text-rose-400">{state.errors.release_year}</p>
            ) : null}
          </div>
          <div>
            <label className="label" htmlFor="price">
              Harga (IDR)
            </label>
            <input
              id="price"
              name="price"
              inputMode="numeric"
              className="input"
              defaultValue={initial?.price ?? ""}
              placeholder="Harga pasar saat ini"
            />
            {state?.errors?.price ? (
              <p className="mt-1 text-xs text-rose-400">{state.errors.price}</p>
            ) : null}
          </div>
          <div>
            <label className="label" htmlFor="image_url">
              URL Gambar (opsional)
            </label>
            <input
              id="image_url"
              name="image_url"
              className="input"
              defaultValue={initial?.image_url ?? ""}
              placeholder="https://…"
            />
            {state?.errors?.image_url ? (
              <p className="mt-1 text-xs text-rose-400">{state.errors.image_url}</p>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="description">
              Deskripsi (opsional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="input resize-y"
              defaultValue={initial?.description ?? ""}
              placeholder="Catatan spesifikasi, sumber harga, atau pertimbangan lain"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingLabel="Menyimpan…">
          <Save className="h-4 w-4" /> {initial ? "Simpan Perubahan" : "Simpan Kandidat GPU"}
        </SubmitButton>
        <Link href="/dashboard/gpus" className="btn-secondary">
          Batal
        </Link>
      </div>
    </form>
  );
}
