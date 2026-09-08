"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

function optionalInt(raw: string, min: number, max: number, label: string, errors: Record<string, string>, key: string) {
  if (raw.length === 0) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    errors[key] = `${label} harus bilangan bulat ${min}–${max}.`;
    return null;
  }
  return value;
}

export async function saveGpuAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login ulang." };

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const series = String(formData.get("series") ?? "").trim();
  const vramRaw = String(formData.get("vram_gb") ?? "").trim();
  const yearRaw = String(formData.get("release_year") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const errors: Record<string, string> = {};
  if (name.length === 0) errors.name = "Nama GPU wajib diisi.";
  if (brand.length === 0) errors.brand = "Brand wajib diisi.";

  const vram = optionalInt(vramRaw, 0, 512, "VRAM", errors, "vram_gb");
  const releaseYear = optionalInt(yearRaw, 1990, 2100, "Tahun rilis", errors, "release_year");

  let price: number | null = null;
  if (priceRaw.length > 0) {
    const parsed = Number(priceRaw.replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) {
      errors.price = "Harga harus angka positif.";
    } else {
      price = parsed;
    }
  }

  if (imageUrl.length > 0 && !/^https?:\/\/.+/.test(imageUrl)) {
    errors.image_url = "URL gambar harus diawali http:// atau https://";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Periksa kembali isian form.", errors };
  }

  const payload = {
    name,
    brand,
    series: series || null,
    vram_gb: vram,
    release_year: releaseYear,
    price,
    image_url: imageUrl || null,
    description: description || null,
  };

  if (id.length > 0) {
    const { error } = await supabase.from("gpus").update(payload).eq("id", id);
    if (error) {
      return {
        ok: false,
        message:
          error.code === "23505"
            ? "Nama GPU sudah dipakai kandidat lain."
            : `Gagal memperbarui GPU: ${error.message}`,
      };
    }
  } else {
    const { error } = await supabase.from("gpus").insert({ ...payload, created_by: user.id });
    if (error) {
      return {
        ok: false,
        message:
          error.code === "23505"
            ? "Nama GPU sudah terdaftar sebagai kandidat."
            : `Gagal menyimpan GPU: ${error.message}`,
      };
    }
  }

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/gpus?saved=${id.length > 0 ? "updated" : "created"}`);
}

export async function deleteGpuAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (id.length === 0) return;
  const supabase = await createClient();
  await supabase.from("gpus").delete().eq("id", id);
  revalidatePath("/dashboard", "layout");
}
