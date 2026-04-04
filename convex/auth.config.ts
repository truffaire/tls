import type { AuthConfig } from "convex/server";

const authConfig: AuthConfig = {
  providers: [
    {
      domain: "https://clerk.truffaire.in",
      applicationID: "convex",
    },
  ],
};

export default authConfig;
