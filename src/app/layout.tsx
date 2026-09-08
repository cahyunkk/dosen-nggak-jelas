import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GPU Preference Ranking System",
    template: "%s · GPU Preference Ranking System",
  },
  description:
    "Sistem analisis preferensi pengguna dalam pemilihan GPU gaming berbasis Skala Likert, seleksi TOP 5 variabel, dan perankingan Weighted Average.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
