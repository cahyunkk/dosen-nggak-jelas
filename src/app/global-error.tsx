"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          background: "#05070f",
          color: "#e2e8f0",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Terjadi kesalahan</h1>
          <p style={{ marginTop: 12, fontSize: 14, color: "#94a3b8", lineHeight: 1.6 }}>
            {error.message}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "10px 18px",
              borderRadius: 12,
              background: "#6366f1",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
            }}
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
