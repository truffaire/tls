import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useTLSAuth } from "@/lib/auth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Scan from "@/pages/Scan";
import Report from "@/pages/Report";
import History from "@/pages/History";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import Callback from "@/pages/Callback";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const { isSignedIn, isLoaded } = useTLSAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Navigate
        to="/"
        replace
        state={{ returnTo: `${location.pathname}${location.search}${location.hash}` || "/dashboard" }}
      />
    );
  }

  return children;
}

export default function App() {
  const { isSignedIn, isLoaded } = useTLSAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={isSignedIn ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<Callback />} />
      <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
      <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/scan" element={<ProtectedRoute><Scan /></ProtectedRoute>} />
      <Route path="/report/:id" element={<ProtectedRoute><Report /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
