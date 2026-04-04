import { useNavigate } from "react-router-dom";
import { useTLSAuth, useTLSClerk, useTLSUser } from "@/lib/auth";

export default function Navbar() {
  const { isSignedIn } = useTLSAuth();
  const { user } = useTLSUser();
  const { openSignIn, signOut } = useTLSClerk();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
  };

  return (
    <nav
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        height: 58,
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Brand */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
        onClick={() => navigate(isSignedIn ? "/dashboard" : "/")}
      >
        <div style={{
          width: 30, height: 30, background: "#004643",
          borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3C9 3 6.5 6.5 6.5 11c0 3.5 2 6.5 5.5 8.5 3.5-2 5.5-5 5.5-8.5C17.5 6.5 15 3 12 3z"/>
            <line x1="12" y1="7" x2="12" y2="13"/>
          </svg>
        </div>
        {/* Full title — hidden on very small screens */}
        <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: "-0.01em", color: "#0C1618" }}
              className="hidden-xs">
          TLS <span style={{ color: "#AAAAAA", fontWeight: 300, fontSize: 13 }}>— Truffaire LeafScan</span>
        </span>
        {/* Short title for very small screens */}
        <span style={{ fontSize: 14, fontWeight: 600, color: "#0C1618" }} className="show-xs">
          TLS
        </span>
      </div>

      {/* Right side */}
      {isSignedIn ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: "1px solid #E8E8E8",
              borderRadius: 999,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              color: "#0C1618",
              fontFamily: "'DM Sans', sans-serif",
              padding: "8px 14px",
            }}
          >
            Logout
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 400, color: "#666666",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Dashboard
          </button>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "#004643", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: "white",
          }}
            onClick={() => navigate("/dashboard")}
          >
            {user?.firstName?.[0] ?? "U"}
          </div>
        </div>
      ) : (
        <button
          onClick={() => openSignIn({ redirectUrl: "/dashboard" })}
          style={{
            display: "flex", alignItems: "center", gap: 7, flexShrink: 0,
            background: "white", border: "1.5px solid #E8E8E8",
            padding: "8px 16px", borderRadius: 100,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, fontWeight: 500, color: "#0C1618",
            cursor: "pointer", whiteSpace: "nowrap",
            transition: "all 0.18s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#004643";
            (e.currentTarget as HTMLButtonElement).style.color = "#004643";
            (e.currentTarget as HTMLButtonElement).style.background = "#e8f0ef";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#E8E8E8";
            (e.currentTarget as HTMLButtonElement).style.color = "#0C1618";
            (e.currentTarget as HTMLButtonElement).style.background = "white";
          }}
        >
          <GoogleIcon />
          Sign in
        </button>
      )}

      <style>{`
        @media (max-width: 380px) {
          .hidden-xs { display: none !important; }
        }
        @media (min-width: 381px) {
          .show-xs { display: none !important; }
        }
      `}</style>
    </nav>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
