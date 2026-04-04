import React, { createContext, useContext } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";

type TLSAuth = {
  isLoaded: boolean;
  isSignedIn: boolean;
  isDemo: boolean;
};

type TLSUser = {
  user: {
    id: string;
    firstName: string | null;
    fullName: string;
    emailAddresses: Array<{ emailAddress: string }>;
  } | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  isDemo: boolean;
};

type TLSClerk = {
  openSignIn: (opts?: { redirectUrl?: string }) => void;
  signOut: () => void;
  isDemo: boolean;
};

const AuthContext = createContext<TLSAuth>({
  isLoaded: false,
  isSignedIn: false,
  isDemo: false,
});

const UserContext = createContext<TLSUser>({
  user: null,
  isLoaded: false,
  isSignedIn: false,
  isDemo: false,
});

const ClerkContext = createContext<TLSClerk>({
  openSignIn: () => {},
  signOut: () => {},
  isDemo: false,
});

function ClerkContextBridge({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();

  const tlsUser = user
    ? {
        id: user.id,
        firstName: user.firstName ?? null,
        fullName:
          user.fullName?.trim() ||
          user.emailAddresses[0]?.emailAddress ||
          "",
        emailAddresses: user.emailAddresses.map((e) => ({
          emailAddress: e.emailAddress,
        })),
      }
    : null;

  const auth: TLSAuth = {
    isLoaded: !!isLoaded,
    isSignedIn: !!isSignedIn,
    isDemo: false,
  };

  const userCtx: TLSUser = {
    user: tlsUser,
    isLoaded: !!isLoaded,
    isSignedIn: !!isSignedIn,
    isDemo: false,
  };

  const clerkCtx: TLSClerk = {
    openSignIn: (opts) =>
      void clerk.openSignIn({ redirectUrl: opts?.redirectUrl ?? "/dashboard" }),
    signOut: () => void clerk.signOut({ redirectUrl: window.location.origin }),
    isDemo: false,
  };

  return (
    <AuthContext.Provider value={auth}>
      <UserContext.Provider value={userCtx}>
        <ClerkContext.Provider value={clerkCtx}>
          {children}
        </ClerkContext.Provider>
      </UserContext.Provider>
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <ClerkContextBridge>{children}</ClerkContextBridge>;
}

export function useTLSAuth() {
  return useContext(AuthContext);
}

export function useTLSUser() {
  return useContext(UserContext);
}

export function useTLSClerk() {
  return useContext(ClerkContext);
}
