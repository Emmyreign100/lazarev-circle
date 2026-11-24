import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ADMIN_EMAIL } from "@/lib/circle/content";
import { emailAuth } from "@/lib/circle/email-auth";
import { errText } from "@/lib/circle/format";
import { useSession } from "@/components/site/session";
import { Field, Notice } from "@/components/site/ui";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const { profile, profileReady } = useSession();
  const [mode, setMode] = useState<"join" | "sign-in" | "reset">("join");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (email.trim().toLowerCase() === ADMIN_EMAIL) {
        throw new Error("That email is the staff door. Fans use their own email here.");
      }
      if (mode === "join") {
        if (password.length < 8) throw new Error("Use at least 8 characters.");
        await emailAuth("sign-up", { name, email, password });
      } else if (mode === "reset") {
        const res = await fetch("/api/auth/request-password-reset", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email,
            redirectTo: `${window.location.origin}/reset-password`,
          }),
        });
        const payload = (await res.json().catch(() => null)) as { message?: string } | null;
        if (!res.ok) throw new Error(payload?.message || "The reset email did not send.");
        setSent(true);
        return;
      } else {
        await emailAuth("sign-in", { email, password });
      }
      window.location.assign("/me");
    } catch (cause) {
      setError(errText(cause));
    } finally {
      setBusy(false);
    }
  }

  if (isPending) {
    return <div className="wrap py-20 text-mute">Checking the door…</div>;
  }

  if (user && profileReady && profile) {
    return (
      <div className="wrap py-16">
        <h1 className="font-serif text-5xl">You are already in.</h1>
        <div className="mt-6">
          {profile.role === "admin" ? (
            <Link to="/admin" className="btn btn-primary">Staff desk</Link>
          ) : (
            <Link to="/me" className="btn btn-primary">Fan dashboard</Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="wrap grid gap-10 py-12 md:grid-cols-2 md:py-16">
      <div>
        <p className="text-xs tracking-widest text-stage uppercase">Fan door</p>
        <h1 className="mt-3 font-serif text-5xl">
          {mode === "join" ? "Join as a fan." : mode === "reset" ? "Reset a fan password." : "Fan sign in."}
        </h1>
        <div className="mt-6 flex gap-2">
          <button type="button" className={mode === "join" ? "btn btn-primary" : "btn btn-ghost"} onClick={() => setMode("join")}>
            Register
          </button>
          <button type="button" className={mode === "sign-in" ? "btn btn-primary" : "btn btn-ghost"} onClick={() => { setMode("sign-in"); setSent(false); }}>
            Sign in
          </button>
          <button type="button" className={mode === "reset" ? "btn btn-primary" : "btn btn-ghost"} onClick={() => { setMode("reset"); setSent(false); }}>
            Reset
          </button>
        </div>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          {mode === "join" ? (
            <Field label="Name">
              <input className="field" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </Field>
          ) : null}
          <Field label="Email">
            <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          {mode === "reset" ? null : (
            <Field label="Password">
              <input className="field" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "join" ? "new-password" : "current-password"} />
            </Field>
          )}
          {sent ? <Notice>If sending is connected, the link comes from sergeylazarev010@gmail.com. Open that email and choose a new password.</Notice> : null}
          {error ? <Notice tone="stage">{error}</Notice> : null}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "One moment…" : mode === "join" ? "Create account" : mode === "reset" ? "Email me a link" : "Sign in"}
          </button>
        </form>
        <div className="mt-8 space-y-2">
          <p className="text-xs tracking-widest text-mute uppercase">Or continue with</p>
          {GROK_PROVIDERS.map((provider) => (
            <button
              key={provider.providerId}
              type="button"
              className="btn btn-ghost w-full"
              onClick={() => void signIn(provider.providerId, { callbackURL: "/me" })}
            >
              Continue with {provider.label}
            </button>
          ))}
        </div>
      </div>
      <aside className="panel h-fit p-6">
        <p className="text-xs tracking-widest text-mute uppercase">Your account</p>
        <h2 className="mt-3 font-serif text-3xl">What fans use it for</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-bone-dim">
          <li>Apply for a membership card and see what that card includes.</li>
          <li>Request a call with Sergey Lazarev. The €650 fee is the next page, before the desk can approve it. No card is charged here.</li>
          <li>Request a serenata, or a hat if you hold Gold or VIP.</li>
          <li>Request a meet window once a Gold or VIP card is approved.</li>
          <li>Vote on the setlist, mark the shows you are traveling to, and join a city chapter.</li>
        </ul>
        <p className="mt-4 text-sm text-mute">
          Staff do not use this page. The desk signs in on the <Link to="/staff" className="text-bone hover:text-bone-dim">staff door</Link>.
        </p>
      </aside>
    </div>
  );
}
