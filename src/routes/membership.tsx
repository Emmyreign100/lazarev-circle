import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { applyMembership } from "@/lib/circle/api";
import { TIERS } from "@/lib/circle/content";
import { errText, euros, ticketCode, tierName } from "@/lib/circle/format";
import { useMine } from "@/components/site/use-mine";
import { Field, Notice, PageIntro, PassCard, SuccessTicket } from "@/components/site/ui";

export const Route = createFileRoute("/membership")({
  component: MembershipPage,
});

function MembershipPage() {
  const { user, isPending } = useCurrentUserState();
  const { mine, loading, reload, error: mineError } = useMine(!isPending && Boolean(user));
  const [tier, setTier] = useState<(typeof TIERS)[number]["id"]>("pit");
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [story, setStory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [freshId, setFreshId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const chosen = TIERS.find((item) => item.id === tier) ?? TIERS[1];

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await applyMembership({ data: { fullName, city, tier, story } });
      setFreshId(result.id);
      reload();
    } catch (cause) {
      setError(errText(cause));
    } finally {
      setBusy(false);
    }
  }

  const card = mine?.membership;
  const ticketId = card?.id ?? freshId;
  const ticketTier = TIERS.find((item) => item.id === (card?.tier ?? tier)) ?? chosen;

  return (
    <div className="wrap py-12 md:py-16">
      <PageIntro
        kicker="Membership"
        title="Choose a card. The price shows at once."
        lede="Regular is €3,000, Gold is €7,000, and VIP is €15,000. Click a card and that fee is the one you are applying for. These are fan cards, not concert tickets."
      />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {TIERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTier(item.id)}
            className={`panel p-5 text-left ${tier === item.id ? "border-bone" : ""}`}
          >
            <p className="text-xs tracking-widest text-mute uppercase">{tier === item.id ? "Selected" : "Card"}</p>
            <p className="mt-2 font-serif text-3xl">{item.name}</p>
            <p className="mt-1 font-serif text-4xl tabular-nums">{euros(item.price)}</p>
            <p className="mt-2 text-sm leading-relaxed text-bone-dim">{item.line}</p>
            <p className="mt-4 text-xs tracking-widest text-stage uppercase">Benefits</p>
            <ul className="mt-2 space-y-2 text-sm">
              {item.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div className="mt-12 grid items-start gap-10 lg:grid-cols-2">
        <div>
          <div className="panel p-6">
            <p className="text-xs tracking-widest text-mute uppercase">You are applying for</p>
            <h2 className="mt-2 font-serif text-3xl">{chosen.name}</h2>
            <p className="mt-1 font-serif text-5xl tabular-nums">{euros(chosen.price)}</p>
            <p className="mt-2 text-sm text-bone-dim">This fee is for the {chosen.name} card.</p>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed">
              {chosen.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>

          {isPending || (user && loading && !card) ? <p className="mt-6 text-mute">Checking your card…</p> : null}
          {!isPending && !user ? (
            <div className="panel mt-6 p-6">
              <h2 className="font-serif text-3xl">Sign in to apply</h2>
              <p className="mt-2 text-bone-dim">The card is saved to your account, so you can open it later from the dashboard.</p>
              <Link to="/login" className="btn btn-primary mt-6">
                Fan login
              </Link>
            </div>
          ) : null}
          {user && card?.status === "approved" ? (
            <div className="mt-6">
              <PassCard
                name={card.fullName}
                city={card.city}
                tier={card.tier}
                number={card.cardNumber}
                status={card.status}
              />
              <p className="mt-4 text-sm text-bone-dim">This {tierName(card.tier)} card is already issued. It is also on your dashboard.</p>
            </div>
          ) : null}
          {user && card?.status !== "approved" ? (
            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <Field label="Name on the card">
                <input className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} />
              </Field>
              <Field label="City">
                <input className="field" value={city} onChange={(e) => setCity(e.target.value)} required minLength={2} />
              </Field>
              <Field label="Why this card">
                <textarea className="field min-h-28" value={story} onChange={(e) => setStory(e.target.value)} maxLength={600} />
              </Field>
              {card?.status === "rejected" ? <Notice>The last application was not approved. Sending this replaces it.</Notice> : null}
              {card?.status === "pending" ? <Notice>You already have an application in review. Sending this updates it.</Notice> : null}
              {error ? <Notice tone="stage">{error}</Notice> : null}
              {mineError ? <Notice tone="stage">{mineError}</Notice> : null}
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? "Sending…" : card ? `Update ${chosen.name} · ${euros(chosen.price)}` : `Apply for ${chosen.name} · ${euros(chosen.price)}`}
              </button>
            </form>
          ) : null}
        </div>
        <div className="space-y-4">
          {ticketId && (card || freshId) ? (
            <SuccessTicket
              code={card?.cardNumber ?? ticketCode("M", ticketId)}
              service={`${tierName(card?.tier ?? tier)} membership`}
              holder={card?.fullName ?? fullName}
              lines={[card?.city ?? city, euros(ticketTier.price), card?.status === "approved" ? "Card issued" : "Application received"]}
              features={ticketTier.points}
              state={card?.status === "approved" ? "confirmed" : card?.status === "rejected" ? "declined" : "received"}
            />
          ) : (
            <aside className="panel p-6 text-sm leading-relaxed text-bone-dim">
              <h2 className="font-serif text-2xl text-bone">After you apply</h2>
              <p className="mt-3">You get a ticket number straight away. That means the application arrived. The printed card number comes only after approval.</p>
              <p className="mt-3">Regular is the card, the wall, and the ballot, at {euros(TIERS[0].price)}. Gold adds a city chapter and meet windows, at {euros(TIERS[1].price)}. VIP is read first, at {euros(TIERS[2].price)}.</p>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
