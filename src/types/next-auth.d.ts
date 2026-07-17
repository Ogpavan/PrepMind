import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "SUPER_ADMIN" | "ADMIN" | "STUDENT";
      isActive: boolean;
    };
  }

  interface User {
    role: "SUPER_ADMIN" | "ADMIN" | "STUDENT";
    isActive: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "SUPER_ADMIN" | "ADMIN" | "STUDENT";
    isActive: boolean;
  }
}
