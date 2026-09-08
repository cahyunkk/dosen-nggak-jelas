import { PageHeader } from "@/components/ui/card";
import { GpuForm } from "../gpu-form";

export const metadata = { title: "Tambah GPU" };

export default function NewGpuPage() {
  return (
    <>
      <PageHeader
        step="Tahap 3 · Kandidat"
        title="Tambah Kandidat GPU"
        description="Masukkan data GPU nyata yang akan dinilai pada tahap assessment."
      />
      <GpuForm />
    </>
  );
}
