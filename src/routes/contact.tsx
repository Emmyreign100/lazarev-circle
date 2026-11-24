import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { sendMessage } from "@/lib/circle/api";
import { ADMIN_EMAIL, OFFICIAL_TICKETS } from "@/lib/circle/content";
import { errText } from "@/lib/circle/format";
import { Field, Notice, PageIntro } from "@/components/site/ui";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

const TOPICS = ["Membership", "Meet window", "Tour date", "Press", "Other"] as const;

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("Membership");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      await sendMessage({ data: { name, email, topic, body } });
      setDone(true);
      setBody("");
    } catch (cause) {
      setError(errText(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap py-12 md:py-16">
      <PageIntro
        kicker="Contact"
        title="Write to the desk."
        lede="Use this form for the card, a serenata, a hat, or a date on the board. Ticket returns do not come here."
      />
      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Name">
            <input className="field" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Your email">
            <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Topic">
            <select className="field" value={topic} onChange={(e) => setTopic(e.target.value as (typeof TOPICS)[number])}>
              {TOPICS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Message">
            <textarea className="field min-h-36" required minLength={8} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          {error ? <Notice tone="stage">{error}</Notice> : null}
          {done ? <Notice>Sent. The team will read it.</Notice> : null}
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? "Sending…" : "Send"}
          </button>
        </form>
        <aside>
          <p className="text-xs tracking-widest text-mute uppercase">Desk email</p>
          <a className="mt-2 block font-serif text-3xl break-all md:text-4xl" href={`mailto:${ADMIN_EMAIL}`}>
            {ADMIN_EMAIL}
          </a>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-bone-dim">
            Use the form on this page. Replies are handled by the desk. This address does not sell or refund concert tickets.
          </p>
          <p className="mt-6 text-sm text-mute">Promoter, tickets and returns: {OFFICIAL_TICKETS}</p>
        </aside>
      </div>
    </div>
  );
}
