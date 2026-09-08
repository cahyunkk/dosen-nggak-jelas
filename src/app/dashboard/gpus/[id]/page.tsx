import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { GpuForm } from "../gpu-form";
import type { Gpu } from "@/lib/types";

export const metadata = { title: "Edit GPU" };

export default async function EditGpuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("gpus").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  return (
    <>
      <PageHeader
        step="Tahap 3 · Kandidat"
        title={`Edit: ${data.name}`}
        description="Perbarui data kandidat GPU."
      />
      <GpuForm initial={data as Gpu} />
    </>
  );
}
