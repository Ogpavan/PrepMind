"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import type { ActionResult } from "@/shared/errors/application-error";
import { loginSchema } from "../schemas/login-schema";

export async function loginAction(values: { email: string; password: string; callbackUrl?: string }): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  const callbackUrl = parsed.data.callbackUrl?.startsWith("/") ? parsed.data.callbackUrl : "/";
  try {
    await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirectTo: callbackUrl });
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, message: error.type === "CredentialsSignin" ? "Email or password is incorrect, or the account is inactive." : "Unable to sign in. Please try again." };
    throw error;
  }
}

export async function logoutAction() { await signOut({ redirectTo: "/login" }); }
