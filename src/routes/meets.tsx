import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { applyMeet, listEvents } from "@/lib/circle/api";
import { SERVICES } from "@/lib/circle/content";
import { errText, ticketCode, tierName } from "@/lib/circle/format";
import { useMine } from "@/components/site/use-mine";
import { Field, Notice, PageIntro, ShowPill, SuccessTicket, When } from "@/components/site/ui";

export const Route = createFileRoute("/meets")({
  loader: () => listEvents({ data: "meet" }),
  component: MeetsPage,
});

const MEET = SERVICES.find((item) => item.to === "/meets");

function MeetsPage() {
  const windows = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const { mine, reload } = useMine(!isPending && Boolean(user));
  const [eventId, setEventId] = useState<number | null>(windows[0]?.id ?? null);
  const [fullName, setFullName] = useState("");
  const [guests, setGuests] = useState(1);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState<{ id: number; eventId: number; name: string; guests: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const card = mine?.membership;
  const eligible = card?.status === "approved" && (card.tier === "pit" || card.tier === "stage");
  const selected = windows.find((show) => show.id === eventId) ?? null;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!eventId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await applyMeet({ data: { eventId, fullName, guests, note } });
      setFresh({ id: result.id, eventId, name: fullName, guests });
      reload();
    } catch (cause) {
      setError(errText(cause));
    } finally {
      setBusy(false);
    }
  }

  const shown = mine?.meets.find((row) => row.eventId === (fresh?.eventId ?? eventId)) ?? null;

  return (
    <div className="wrap py-12 md:py-16">
      <PageIntro
        kicker="Meet windows"
        title="Ask to be named after a show."
        lede="A meet window is a list the desk keeps for a few nights. It is not a private meeting, and it is not a concert ticket."
      />
      {MEET ? (
        <div className="panel mt-8 p-6">
          <p className="text-xs tracking-widest text-mute uppercase">What you are applying for</p>
          <h2 className="mt-2 font-serif text-3xl">{MEET.name}</h2>
          <p className="mt-2 text-sm text-bone-dim">{MEET.summary}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {MEET.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="mt-10 divide-y divide-line border-t border-line">
        {windows.map((show) => {
          const mineRow = mine?.meets.find((row) => row.eventId === show.id);
          return (
            <li key={show.id} className="grid gap-3 py-5 md:grid-cols-12 md:items-center">
              <div className="md:col-span-8">
                <p className="text-lg">{show.city}</p>
                <p className="text-sm text-mute">
                  <When iso={show.startsAt} timeKnown={show.timeKnown} /> · {show.venue}
                </p>
                {show.note ? <p className="mt-2 text-sm text-bone-dim">{show.note}</p> : null}
                {mineRow ? (
                  <p className="mt-2 text-sm">
                    Your ticket {ticketCode("W", mineRow.id)} · {mineRow.status === "approved" ? "confirmed" : mineRow.status === "rejected" ? "not approved" : "in review"}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-3 md:col-span-4 md:justify-end">
                <ShowPill show={show} />
                <button type="button" className="btn btn-ghost" onClick={() => setEventId(show.id)}>
                  {eventId === show.id ? "Selected" : "Request"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-12 grid items-start gap-8 lg:grid-cols-2">
        <div>
          {!isPending && !user ? (
            <div className="panel p-6">
              <h2 className="font-serif text-3xl">Sign in to request a window</h2>
              <p className="mt-2 text-bone-dim">You will need an approved Gold or VIP card.</p>
              <Link to="/login" className="btn btn-primary mt-5">
                Join or sign in
              </Link>
            </div>
          ) : null}
          {user && !eligible ? (
            <div className="panel p-6">
              <h2 className="font-serif text-3xl">Gold or VIP required</h2>
              <p className="mt-2 text-bone-dim">
                {card
                  ? `Your ${tierName(card.tier)} card is ${card.status === "approved" ? "approved, and Regular does not include meet windows" : "still in review"}.`
                  : "Apply for a Gold or VIP card first. Regular does not include meet windows."}
              </p>
              <Link to="/membership" className="btn btn-primary mt-5">See the cards</Link>
            </div>
          ) : null}
          {user && eligible ? (
            <form className="space-y-4" onSubmit={onSubmit}>
              <h2 className="font-serif text-3xl">Your name for the list</h2>
              <Field label="Window">
                <select className="field" value={eventId ?? ""} onChange={(e) => setEventId(Number(e.target.value))}>
                  {windows.map((show) => (
                    <option key={show.id} value={show.id}>
                      {show.city} · {show.venue}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Full name">
                <input className="field" required minLength={2} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </Field>
              <Field label="People, including you">
                <select className="field" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                </select>
              </Field>
              <Field label="Note">
                <textarea className="field min-h-28" value={note} onChange={(e) => setNote(e.target.value)} maxLength={400} />
              </Field>
              {error ? <Notice tone="stage">{error}</Notice> : null}
              <button className="btn btn-primary" disabled={busy || !eventId} type="submit">
                {busy ? "Sending…" : "Send request"}
              </button>
            </form>
          ) : null}
        </div>
        {shown && MEET ? (
          <SuccessTicket
            code={ticketCode("W", shown.id)}
            service={`Meet window · ${shown.city}`}
            holder={shown.fullName}
            lines={[selected && selected.id === shown.eventId ? selected.venue : shown.city, `${shown.guests} ${shown.guests === 1 ? "person" : "people"}`]}
            features={[...MEET.features]}
            state={shown.status === "approved" ? "confirmed" : shown.status === "rejected" ? "declined" : "received"}
          />
        ) : fresh && selected && MEET ? (
          <SuccessTicket
            code={ticketCode("W", fresh.id)}
            service={`Meet window · ${selected.city}`}
            holder={fresh.name}
            lines={[selected.venue, `${fresh.guests} ${fresh.guests === 1 ? "person" : "people"}`]}
            features={[...MEET.features]}
            state="received"
          />
        ) : null}
      </div>
    </div>
  );
}
