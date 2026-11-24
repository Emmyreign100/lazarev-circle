import { authClient } from "@/lib/auth/client";

const BEARER_KEY = "grok-auth.bearer-token";

function messageFrom(payload: unknown) {
  if (payload && typeof payload === "object") {
    const record = payload as { message?: unknown; error?: { message?: unknown } };
    if (typeof record.message === "string" && record.message) return record.message;
    if (typeof record.error?.message === "string" && record.error.message) return record.error.message;
  }
  return "That did not go through. Check the details and try again.";
}

export async function emailAuth(
  kind: "sign-up" | "sign-in",
  body: { name?: string; email: string; password: string },
) {
  const path = kind === "sign-up" ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email";
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const token = res.headers.get("set-auth-token");
  if (token) {
    try {
      window.sessionStorage.setItem(BEARER_KEY, token);
    } catch {
      /* private mode */
    }
  }
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (!res.ok) throw new Error(messageFrom(payload));
  await authClient.getSession();
}
