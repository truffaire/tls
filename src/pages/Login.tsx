import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTLSAuth, useTLSClerk } from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, isSignedIn } = useTLSAuth();
  const { openSignIn } = useTLSClerk();
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      navigate("/dashboard", { replace: true });
      return;
    }
    if (requestedRef.current) return;

    requestedRef.current = true;
    const state = location.state as { returnTo?: string } | null;
    openSignIn({ redirectUrl: state?.returnTo || "/dashboard" });
  }, [isLoaded, isSignedIn, location.state, navigate, openSignIn]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF", color: "#0C1618" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 24, height: 24, margin: "0 auto 16px", borderRadius: "50%", border: "2px solid #00464333", borderTopColor: "#004643", animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 14 }}>Redirecting to Google sign-in...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
