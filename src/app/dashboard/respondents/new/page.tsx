import { PageHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { getVariables } from "@/lib/data";
import { RespondentForm } from "../respondent-form";

export const metadata = { title: "Tambah Responden" };

export default async function NewRespondentPage() {
  const variables = await getVariables();

  return (
    <>
      <PageHeader
        step="Tahap 1 · Input Manual"
        title="Tambah Responden"
        description="Masukkan satu data responden beserta penilaian Skala Likert untuk 10 variabel."
      />
      {variables.length === 0 ? (
        <Alert tone="error" title="Tabel variabel kosong">
          Jalankan SQL migration (supabase/migrations/0001_init.sql) agar 10 variabel penelitian
          tersedia di database.
        </Alert>
      ) : (
        <RespondentForm variables={variables} />
      )}
    </>
  );
}
