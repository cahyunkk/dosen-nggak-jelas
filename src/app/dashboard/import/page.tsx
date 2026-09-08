import { PageHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { getVariables } from "@/lib/data";
import { ImportWizard } from "./import-wizard";

export const metadata = { title: "Import CSV" };

export default async function ImportPage() {
  const variables = await getVariables();

  return (
    <>
      <PageHeader
        step="Tahap 1 · Import Data"
        title="Import Hasil Kuesioner (CSV)"
        description="Upload file CSV hasil Google Form atau kuesioner lain. Data hanya tersimpan setelah Anda menekan tombol konfirmasi."
      />
      {variables.length === 0 ? (
        <Alert tone="error" title="Tabel variabel kosong">
          Jalankan SQL migration terlebih dahulu agar 10 variabel penelitian tersedia.
        </Alert>
      ) : (
        <ImportWizard variables={variables} />
      )}
    </>
  );
}
