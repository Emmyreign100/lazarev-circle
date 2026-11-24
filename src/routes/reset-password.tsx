import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Field, Notice } from "@/components/site/ui";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (!token) throw new Error("This reset link is missing its token. Ask for a new one.");
      if (password.length < 8) throw new Error("Use at least 8 characters.");
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ newPassword: password, token }),
      });
      const payload = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(payload?.message || "That link has expired. Ask for a new one.");
      await navigate({ to: "/login" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That link has expired.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap max-w-lg py-16">
      <p className="text-xs tracking-widest text-stage uppercase">New password</p>
      <h1 className="mt-3 font-serif text-5xl">Choose a new password.</h1>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <Field label="New password">
          <input className="field" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </Field>
        {error ? <Notice tone="stage">{error}</Notice> : null}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "One moment…" : "Save password"}
        </button>
      </form>
      <Link to="/login" className="mt-6 inline-block text-sm text-bone-dim hover:text-bone">Back to sign in</Link>
    </div>
  );
}
