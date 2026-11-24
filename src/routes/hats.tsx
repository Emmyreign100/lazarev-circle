import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listEvents, requestHat } from "@/lib/circle/api";
import { errText, ticketCode, tierName, whenParts } from "@/lib/circle/format";
import { useMine } from "@/components/site/use-mine";
import { Field, Notice, PageIntro, ShowPill, SuccessTicket, When } from "@/components/site/ui";

export const Route = createFileRoute("/hats")({
  loader: () => listEvents({ data: "concert" }),
  component: HatsPage,
});

function HatsPage() {
  const shows = Route.useLoaderData().filter((show) => new Date(show.startsAt).getTime() >= Date.now());
  const { user, isPending } = useCurrentUserState();
  const { mine, reload } = useMine(!isPending && Boolean(user));
  const [eventId, setEventId] = useState<number | null>(shows[0]?.id ?? null);
  const [hatColor, setHatColor] = useState("");
  const [inscription, setInscription] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [freshId, setFreshId] = useState<number | null>(null);

  const card = mine?.membership;
  const eligible = card?.status === "approved" && (card.tier === "pit" || card.tier === "stage");
  const selected = shows.find((show) => show.id === eventId) ?? null;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!eventId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await requestHat({ data: { eventId, hatColor, inscription, note } });
      setFreshId(result.id);
      reload();
    } catch (cause) {
      setError(errText(cause));
    } finally {
      setBusy(false);
    }
  }

  const fresh = mine?.hats.find((row) => row.id === freshId) ?? null;

  return (
    <div className="wrap py-12 md:py-16">
      <PageIntro
        kicker="Hat signing"
        title="Put a hat on the night’s list."
        lede="Gold and VIP can ask for one hat at one show. Say the color and the name to write. A yes from the desk is a place on that list. It is not a promise he will sign every hat, and it is not a concert ticket."
      />

      <ul className="mt-10 divide-y divide-line border-t border-line">
        {shows.map((show) => {
          const mineRow = mine?.hats.find((row) => row.eventId === show.id);
          return (
            <li key={show.id} className="grid gap-3 py-5 md:grid-cols-12 md:items-center">
              <div className="md:col-span-8">
                <p className="text-lg">{show.city}</p>
                <p className="text-sm text-mute">
                  <When iso={show.startsAt} timeKnown={show.timeKnown} /> · {show.venue}
                </p>
                {mineRow ? (
                  <p className="mt-2 text-sm">
                    {ticketCode("H", mineRow.id)} · {mineRow.hatColor} · {mineRow.status === "approved" ? "on the list" : mineRow.status === "rejected" ? "not this time" : "in review"}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-3 md:col-span-4 md:justify-end">
                <ShowPill show={show} />
                <button type="button" className="btn btn-ghost" onClick={() => setEventId(show.id)}>
                  {eventId === show.id ? "Selected" : "This show"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-12 grid items-start gap-8 lg:grid-cols-2">
        {!isPending && !user ? (
          <div className="panel p-6">
            <h2 className="font-serif text-3xl">Sign in to request a hat</h2>
            <p className="mt-2 text-bone-dim">You will need an approved Gold or VIP card.</p>
            <Link to="/login" className="btn btn-primary mt-5">Join or sign in</Link>
          </div>
        ) : null}
        {user && !eligible ? (
          <div className="panel p-6">
            <h2 className="font-serif text-3xl">Gold or VIP required</h2>
            <p className="mt-2 text-bone-dim">
              {card
                ? `Your ${tierName(card.tier)} card is ${card.status === "approved" ? "approved, and Regular does not include the hat list" : "still in review"}.`
                : "Apply for a Gold or VIP card first."}
            </p>
            <Link to="/membership" className="btn btn-primary mt-5">See the cards</Link>
          </div>
        ) : null}
        {user && eligible && selected ? (
          <form className="panel grid gap-4 p-6" onSubmit={onSubmit}>
            <h2 className="font-serif text-3xl">{selected.city}</h2>
            <p className="text-sm text-mute">{selected.venue}</p>
            <Field label="Hat color">
              <input className="field" required minLength={2} maxLength={40} value={hatColor} onChange={(event) => setHatColor(event.target.value)} placeholder="Black, tan, cream…" />
            </Field>
            <Field label="Name to write">
              <input className="field" required minLength={2} maxLength={40} value={inscription} onChange={(event) => setInscription(event.target.value)} placeholder="The name on the brim" />
            </Field>
            <Field label="Note">
              <textarea className="field min-h-28" maxLength={300} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional. Where you will be in the room." />
            </Field>
            {error ? <Notice tone="stage">{error}</Notice> : null}
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Sending…" : "Ask for this hat"}
            </button>
          </form>
        ) : null}
        {fresh ? (
          <SuccessTicket
            code={ticketCode("H", fresh.id)}
            service={`Hat · ${fresh.city}`}
            holder={fresh.inscription}
            lines={[fresh.hatColor, fresh.status === "approved" ? "On the list" : "In review"]}
            features={["One hat for this show", "VIP requests are read first"]}
            state={fresh.status === "approved" ? "confirmed" : fresh.status === "rejected" ? "declined" : "received"}
          />
        ) : null}
      </div>
    </div>
  );
}
