import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { AuthProvider } from "@/lib/auth";
import App from "./App";
import "./styles/index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ClerkProvider
    publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
    afterSignInUrl="/dashboard"
    afterSignUpUrl="/dashboard"
  >
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ConvexProviderWithClerk>
  </ClerkProvider>
);
