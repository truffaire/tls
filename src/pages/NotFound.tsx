import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", color: "#0C1618" }}>
      <Navbar />
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "96px 28px 40px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            background: "#0C1618",
            borderRadius: 28,
            padding: "40px 28px",
            color: "#FFFFFF",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.56)", marginBottom: 12 }}>
            Error 404
          </div>
          <h1 style={{ fontSize: "clamp(34px, 8vw, 56px)", fontWeight: 300, lineHeight: 1, letterSpacing: "-0.04em", margin: 0 }}>
            Page not found
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.72)", margin: "16px 0 28px" }}>
            The page you requested does not exist in TLS. Return to the dashboard or start again from the landing page.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                border: "1px solid rgba(255,255,255,0.16)",
                background: "#FFFFFF",
                color: "#000000",
                borderRadius: 999,
                padding: "12px 20px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Go Home
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                border: "1px solid rgba(255,255,255,0.16)",
                background: "#004643",
                color: "#FFFFFF",
                borderRadius: 999,
                padding: "12px 20px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Open Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
