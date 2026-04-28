"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(_prev: { error?: string } | null, formData: FormData) {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: true,
      redirectTo: "/",
    });
    return null;
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Credenciales inválidas" };
    }
    // signIn throws a NEXT_REDIRECT internally on success — let it bubble.
    throw e;
  }
}
