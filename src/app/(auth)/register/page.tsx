import { notFound } from "next/navigation";
import { RegisterForm } from "./register-form";
import { allowAdminSignup } from "@/lib/supabase/config";

export const metadata = { title: "Daftar Admin" };

export default function RegisterPage() {
  if (!allowAdminSignup) notFound();
  return <RegisterForm />;
}
