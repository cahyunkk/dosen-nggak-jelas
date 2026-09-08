import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Login Admin" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card h-72 animate-pulse p-7" />}>
      <LoginForm />
    </Suspense>
  );
}
