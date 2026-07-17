import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { identityRepository } from "@/modules/identity/infrastructure/identity-repository";

const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
        const recentFailures = await identityRepository.countRecentFailures(email, ipAddress, new Date(Date.now() - 15 * 60 * 1000));
        if (recentFailures >= 5) throw new Error("Too many login attempts. Try again in 15 minutes.");

        const user = await identityRepository.findByEmail(email);
        const valid = Boolean(user?.isActive && (await compare(parsed.data.password, user.passwordHash)));
        await identityRepository.recordAttempt(email, ipAddress, valid);
        if (!valid || !user) return null;

        await identityRepository.updateLastLogin(user.id);
        return { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role as "SUPER_ADMIN" | "ADMIN" | "STUDENT";
        token.isActive = Boolean(user.isActive);
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.role = token.role === "SUPER_ADMIN" || token.role === "ADMIN" ? token.role : "STUDENT";
      session.user.isActive = token.isActive === true;
      return session;
    },
  },
});
