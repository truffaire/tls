import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTLSAuth } from "@/lib/auth";

export default function Callback() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useTLSAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#FFFFFF",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 24, height: 24, margin: "0 auto 16px", borderRadius: "50%",
          border: "2px solid #00464333", borderTopColor: "#004643",
          animation: "spin 1s linear infinite",
        }} />
        <div style={{ fontSize: 14, color: "#0C1618" }}>Completing sign-in...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
