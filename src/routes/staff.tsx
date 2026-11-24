import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ADMIN_EMAIL } from "@/lib/circle/content";
import { emailAuth } from "@/lib/circle/email-auth";
import { errText } from "@/lib/circle/format";
import { useSession } from "@/components/site/session";
import { Field, Notice } from "@/components/site/ui";
import portrait from "@/assets/lazarev.jpg";

export const Route = createFileRoute("/staff")({
  component: StaffLoginPage,
});

function StaffLoginPage() {
  const { user, isPending } = useCurrentUserState();
  const { profile, profileReady } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
        throw new Error("This door is only for the desk. Fans sign in on the fan page.");
      }
      await emailAuth("sign-in", { email, password });
      window.location.assign("/admin");
    } catch (cause) {
      setError(errText(cause));
    } finally {
      setBusy(false);
    }
  }

  if (isPending) {
    return <div className="wrap py-20 text-mute">Checking the desk…</div>;
  }

  if (user && profileReady && profile?.role === "admin") {
    return (
      <div className="wrap py-16">
        <h1 className="font-serif text-5xl">The desk is open.</h1>
        <Link to="/admin" className="btn btn-primary mt-6">Staff desk</Link>
      </div>
    );
  }

  return (
    <div className="wrap grid items-start gap-10 py-12 md:grid-cols-2 md:py-16">
      <div>
        <p className="text-xs tracking-widest text-stage uppercase">Staff door</p>
        <h1 className="mt-3 font-serif text-5xl">Desk sign in.</h1>
        <p className="mt-4 max-w-md text-bone-dim">
          This is not the fan login. Only {ADMIN_EMAIL} opens the desk.
        </p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <Field label="Staff email">
            <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </Field>
          <Field label="Password">
            <input className="field" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          {error ? <Notice tone="stage">{error}</Notice> : null}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "One moment…" : "Open the desk"}
          </button>
        </form>
        <p className="mt-6 text-sm text-mute">
          Fans register on the <Link to="/login" className="text-bone hover:text-bone-dim">fan door</Link>.
        </p>
      </div>
      <figure className="overflow-hidden rounded-3xl border border-line">
        <img src={portrait} alt="Sergey Lazarev on stage" className="aspect-[4/5] w-full object-cover object-[center_18%]" />
      </figure>
    </div>
  );
}
