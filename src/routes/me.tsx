import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useSession } from "@/components/site/session";
import { useMine } from "@/components/site/use-mine";
import { Notice, PassCard, SuccessTicket } from "@/components/site/ui";
import { SERVICES, TIERS } from "@/lib/circle/content";
import { euros, statusLabel, ticketCode, tierName, whenParts } from "@/lib/circle/format";
import portrait from "@/assets/lazarev.jpg";

export const Route = createFileRoute("/me")({
  component: DashboardPage,
});

function ticketState(status: string): "received" | "confirmed" | "declined" {
  if (status === "approved") return "confirmed";
  if (status === "rejected") return "declined";
  return "received";
}

function DashboardPage() {
  const { authPending, profileReady, profile } = useSession();
  const { mine, loading, error } = useMine(Boolean(profile));

  if (authPending || !profileReady) {
    return <div className="wrap py-20 text-mute">Opening your dashboard…</div>;
  }
  if (!profile) return <RedirectToSignIn />;
  if (profile.role === "admin") return <Navigate to="/admin" />;

  const card = mine?.membership;
  const tier = TIERS.find((item) => item.id === card?.tier);
  const meetFeatures = SERVICES.find((item) => item.to === "/meets")?.features ?? [];

  return (
    <div className="wrap py-10 md:py-14">
      <figure className="relative overflow-hidden rounded-3xl border border-line">
        <img src={portrait} alt="Sergey Lazarev on stage" className="h-56 w-full object-cover object-[center_20%] md:h-72" />
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/80 to-transparent p-5 md:p-7">
          <p className="text-xs tracking-widest text-stage uppercase">Fan dashboard</p>
          <h1 className="mt-1 font-serif text-4xl md:text-5xl">{profile.name}</h1>
        </figcaption>
      </figure>
      <p className="mt-4 text-bone-dim">Your card, calls, serenatas, and the nights you marked.</p>

      {loading ? <p className="mt-10 text-mute">Loading your dashboard…</p> : null}
      {error ? <div className="mt-6"><Notice tone="stage">{error}</Notice></div> : null}

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl">Membership</h2>
          <Link to="/membership" className="text-sm text-bone-dim hover:text-bone">
            {card ? "Card details" : "Apply"}
          </Link>
        </div>
        {card && tier ? (
          <div className="mt-5 grid items-start gap-6 lg:grid-cols-2">
            <SuccessTicket
              code={card.cardNumber ?? ticketCode("M", card.id)}
              service={`${tierName(card.tier)} membership`}
              holder={card.fullName}
              lines={[card.city, euros(tier.price), card.status === "approved" ? "Card issued" : "Application on file"]}
              features={tier.points}
              state={ticketState(card.status)}
            />
            <div>
              {card.status === "approved" ? (
                <PassCard
                  name={card.fullName}
                  city={card.city}
                  tier={card.tier}
                  number={card.cardNumber}
                  status={card.status}
                />
              ) : (
                <div className="panel p-6">
                  <p className="text-xs tracking-widest text-mute uppercase">{tier.name} · {euros(tier.price)}</p>
                  <ul className="mt-4 space-y-3 text-sm leading-relaxed">
                    {tier.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <p className="mt-5 text-sm text-mute">
                    {card.status === "rejected"
                      ? "This application was not approved. You can send a new one."
                      : "Your number is added when the application is approved."}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : !loading ? (
          <div className="panel mt-5 p-6">
            <h3 className="font-serif text-2xl">No card yet</h3>
            <p className="mt-2 max-w-xl text-bone-dim">
              Pick Regular, Gold, or VIP. The price shows as soon as you choose the card: €3,000, €7,000, or €15,000.
            </p>
            <Link to="/membership" className="btn btn-primary mt-5">Choose a card</Link>
          </div>
        ) : null}
      </section>

      <section className="mt-14">
        <h2 className="font-serif text-3xl">What you can apply for</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {SERVICES.map((service) => (
            <Link key={service.to} to={service.to} className="panel block p-5 hover:border-bone-dim">
              <h3 className="font-serif text-2xl">{service.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-bone-dim">{service.summary}</p>
              <ul className="mt-4 space-y-1 text-sm">
                {service.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl">Call with Sergey</h2>
          <Link to="/calls" className="text-sm text-bone-dim hover:text-bone">Request a call</Link>
        </div>
        <p className="mt-2 max-w-xl text-sm text-bone-dim">
          Write the reason, then the next page is the €650 fee. The desk can approve only after that fee is recorded.
        </p>
        {mine && mine.calls.length === 0 && !loading ? (
          <div className="panel mt-5 p-6">
            <h3 className="font-serif text-2xl">No call request yet</h3>
            <Link to="/calls" className="btn btn-primary mt-5">Apply for a call</Link>
          </div>
        ) : null}
        <div className="mt-5 grid gap-4">
          {mine?.calls.map((row) => (
            <div key={row.id} className="grid items-start gap-4 lg:grid-cols-2">
              <SuccessTicket
                code={ticketCode("C", row.id)}
                service="Call with Sergey Lazarev"
                holder={euros(row.amountEur)}
                lines={[statusLabel(row.status), row.reason]}
                features={["Reason on file", row.status === "unpaid" ? "€650 still due" : "Fee recorded before approval"]}
                state={ticketState(row.status)}
              />
              {row.status === "unpaid" ? (
                <div className="panel p-6">
                  <p className="text-xs tracking-widest text-mute uppercase">Next step</p>
                  <p className="mt-2 font-serif text-4xl tabular-nums">{euros(row.amountEur)}</p>
                  <p className="mt-2 text-sm text-bone-dim">Pay this before the desk can approve the call.</p>
                  <Link to="/calls" className="btn btn-primary mt-5">Open the fee page</Link>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl">Meet tickets</h2>
          <Link to="/meets" className="text-sm text-bone-dim hover:text-bone">Request a window</Link>
        </div>
        {mine && mine.meets.length === 0 && !loading ? (
          <p className="mt-4 text-bone-dim">No meet requests yet. Gold and VIP cards can ask for a window.</p>
        ) : null}
        <div className="mt-5 grid gap-4">
          {mine?.meets.map((row) => {
            const when = whenParts(row.startsAt, true);
            return (
              <SuccessTicket
                key={row.id}
                code={ticketCode("W", row.id)}
                service={`Meet window · ${row.city}`}
                holder={row.fullName}
                lines={[`${when.weekday} ${when.date}`, `${row.guests} ${row.guests === 1 ? "person" : "people"}`]}
                features={[...meetFeatures]}
                state={ticketState(row.status)}
              />
            );
          })}
        </div>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <h2 className="font-serif text-2xl">Serenatas</h2>
          <ul className="mt-3 space-y-1 text-sm text-bone-dim">
            {mine?.serenatas.length
              ? mine.serenatas.map((row) => (
                  <li key={row.id}>{row.songTitle} · {row.status}</li>
                ))
              : <li>None yet. Any approved card can ask.</li>}
          </ul>
          <Link to="/serenatas" className="mt-4 inline-block text-sm text-bone hover:text-bone-dim">Request one</Link>
        </div>
        <div className="panel p-5">
          <h2 className="font-serif text-2xl">Hats</h2>
          <ul className="mt-3 space-y-1 text-sm text-bone-dim">
            {mine?.hats.length
              ? mine.hats.map((row) => (
                  <li key={row.id}>{row.city} · {row.hatColor} · {row.status}</li>
                ))
              : <li>None yet. Gold and VIP only.</li>}
          </ul>
          <Link to="/hats" className="mt-4 inline-block text-sm text-bone hover:text-bone-dim">Hat list</Link>
        </div>
        <div className="panel p-5">
          <h2 className="font-serif text-2xl">Going</h2>
          <ul className="mt-3 space-y-1 text-sm text-bone-dim">
            {mine?.going.length
              ? mine.going.map((row) => <li key={row.id}>{row.city}</li>)
              : <li>No nights marked.</li>}
          </ul>
          <Link to="/going" className="mt-4 inline-block text-sm text-bone hover:text-bone-dim">Who’s going</Link>
        </div>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <h2 className="font-serif text-2xl">Chapter</h2>
          <p className="mt-3 text-bone-dim">
            {mine?.chapter ? `${mine.chapter.city}, ${mine.chapter.country}` : "Not joined. Gold and VIP cards can pick one city."}
          </p>
          <Link to="/chapters" className="mt-4 inline-block text-sm text-bone hover:text-bone-dim">Chapters</Link>
        </div>
        <div className="panel p-5">
          <h2 className="font-serif text-2xl">Ballot</h2>
          <ul className="mt-3 space-y-1 text-bone-dim">
            {mine?.votes.length ? mine.votes.map((vote) => <li key={vote.id}>{vote.title}</li>) : <li>No songs chosen. You can pick three.</li>}
          </ul>
          <Link to="/ballot" className="mt-4 inline-block text-sm text-bone hover:text-bone-dim">Open the ballot</Link>
        </div>
        <div className="panel p-5">
          <h2 className="font-serif text-2xl">Wall</h2>
          <p className="mt-3 text-sm text-bone-dim">
            {mine?.posts.length ? `${mine.posts.length} note${mine.posts.length === 1 ? "" : "s"} posted.` : "No notes yet. Five is the limit."}
          </p>
          <Link to="/wall" className="mt-4 inline-block text-sm text-bone hover:text-bone-dim">Fan wall</Link>
        </div>
      </section>
    </div>
  );
}
