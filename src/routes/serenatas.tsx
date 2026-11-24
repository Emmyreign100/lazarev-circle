import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listEvents, listPublicSerenatas, requestSerenata } from "@/lib/circle/api";
import { errText, ticketCode, whenParts } from "@/lib/circle/format";
import { useMine } from "@/components/site/use-mine";
import { Field, Notice, PageIntro, SuccessTicket } from "@/components/site/ui";

export const Route = createFileRoute("/serenatas")({
  loader: async () => {
    const [board, shows] = await Promise.all([
      listPublicSerenatas(),
      listEvents({ data: "concert" }),
    ]);
    return { board, shows };
  },
  component: SerenataPage,
});

function SerenataPage() {
  const { board, shows } = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const { mine, reload } = useMine(!isPending && Boolean(user));
  const upcoming = shows.filter((show) => new Date(show.startsAt).getTime() >= Date.now());
  const [eventId, setEventId] = useState<number | "open">(upcoming[0]?.id ?? "open");
  const [songTitle, setSongTitle] = useState("");
  const [dedicatee, setDedicatee] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [freshId, setFreshId] = useState<number | null>(null);

  const approved = mine?.membership?.status === "approved";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await requestSerenata({
        data: {
          eventId: eventId === "open" ? null : eventId,
          songTitle,
          dedicatee,
          note,
        },
      });
      setFreshId(result.id);
      setSongTitle("");
      setDedicatee("");
      setNote("");
      reload();
    } catch (cause) {
      setError(errText(cause));
    } finally {
      setBusy(false);
    }
  }

  const fresh = mine?.serenatas.find((row) => row.id === freshId) ?? null;

  return (
    <div className="wrap py-12 md:py-16">
      <PageIntro
        kicker="Serenata"
        title="A song, said out loud for someone."
        lede="Name the song and the person. An approved card can send it. The desk reads it first. Only a yes goes on the public board. This is not a ticket, and it does not charge a card."
      />

      <section className="mt-10">
        <h2 className="font-serif text-3xl">On the board</h2>
        {board.length === 0 ? (
          <p className="mt-3 text-bone-dim">No dedication has been approved yet. Yours can be the first.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-t border-line">
            {board.map((row) => (
              <li key={row.id} className="py-5">
                <p className="font-serif text-2xl">{row.songTitle}</p>
                <p className="mt-1 text-bone-dim">For {row.dedicatee}{row.showCity ? ` · ${row.showCity}` : ""}{row.city ? ` · from ${row.city}` : ""}</p>
                {row.note ? <p className="mt-2 max-w-2xl text-sm leading-relaxed">{row.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12 grid items-start gap-8 lg:grid-cols-2">
        {!isPending && !user ? (
          <div className="panel p-6">
            <h2 className="font-serif text-3xl">Sign in to request one</h2>
            <p className="mt-2 text-bone-dim">You will need an approved membership card. Regular, Gold, and VIP can all ask.</p>
            <Link to="/login" className="btn btn-primary mt-5">Join or sign in</Link>
          </div>
        ) : null}
        {user && !approved ? (
          <div className="panel p-6">
            <h2 className="font-serif text-3xl">Card first</h2>
            <p className="mt-2 text-bone-dim">Serenatas open once a membership card is approved.</p>
            <Link to="/membership" className="btn btn-primary mt-5">Choose a card</Link>
          </div>
        ) : null}
        {user && approved ? (
          <form className="panel grid gap-4 p-6" onSubmit={onSubmit}>
            <h2 className="font-serif text-3xl">Request a serenata</h2>
            <Field label="Show">
              <select className="field" value={String(eventId)} onChange={(event) => setEventId(event.target.value === "open" ? "open" : Number(event.target.value))}>
                <option value="open">No specific night</option>
                {upcoming.map((show) => (
                  <option key={show.id} value={show.id}>
                    {show.city} · {whenParts(show.startsAt, show.timeKnown).date}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Song">
              <input className="field" required minLength={2} maxLength={80} value={songTitle} onChange={(event) => setSongTitle(event.target.value)} placeholder="A Través del Vaso" />
            </Field>
            <Field label="For">
              <input className="field" required minLength={2} maxLength={80} value={dedicatee} onChange={(event) => setDedicatee(event.target.value)} placeholder="Who it is for" />
            </Field>
            <Field label="Note">
              <textarea className="field min-h-28" required minLength={8} maxLength={400} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Why this song, in a sentence or two" />
            </Field>
            {error ? <Notice tone="stage">{error}</Notice> : null}
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Sending…" : "Send to the desk"}
            </button>
          </form>
        ) : null}
        {fresh ? (
          <SuccessTicket
            code={ticketCode("S", fresh.id)}
            service={`Serenata · ${fresh.songTitle}`}
            holder={fresh.dedicatee}
            lines={[fresh.showCity ?? "Any night", fresh.status === "approved" ? "On the board" : "In review"]}
            features={["Song and person on file", "Public only after approval"]}
            state={fresh.status === "approved" ? "confirmed" : fresh.status === "rejected" ? "declined" : "received"}
          />
        ) : (
          <div className="panel p-6">
            <p className="text-xs tracking-widest text-mute uppercase">Your requests</p>
            {mine && mine.serenatas.length === 0 ? <p className="mt-3 text-bone-dim">None yet.</p> : null}
            <ul className="mt-3 space-y-3 text-sm">
              {mine?.serenatas.map((row) => (
                <li key={row.id}>
                  <span className="text-bone">{row.songTitle}</span>
                  <span className="text-mute"> · for {row.dedicatee} · {row.status}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
