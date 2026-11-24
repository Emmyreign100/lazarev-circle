import type { ReactNode } from "react";
import { statusLabel, statusTone, tierName, whenParts } from "@/lib/circle/format";
import type { Show } from "@/lib/circle/api";

export function PageIntro({
  kicker,
  title,
  lede,
}: {
  kicker: string;
  title: string;
  lede: string;
}) {
  return (
    <header className="max-w-3xl">
      <p className="text-xs font-medium tracking-widest text-stage uppercase">{kicker}</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight md:text-6xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-bone-dim md:text-lg">{lede}</p>
    </header>
  );
}

export function Pill({
  children,
  tone = "bone",
}: {
  children: ReactNode;
  tone?: "bone" | "stage" | "mute";
}) {
  const toneClass =
    tone === "stage"
      ? "border-stage text-stage"
      : tone === "mute"
        ? "border-line text-mute"
        : "border-bone-dim text-bone";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs tracking-widest uppercase ${toneClass}`}>
      {children}
    </span>
  );
}

export function ShowPill({ show }: { show: Pick<Show, "status" | "startsAt"> }) {
  return <Pill tone={statusTone(show.status, show.startsAt)}>{statusLabel(show.status, show.startsAt)}</Pill>;
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs tracking-widest text-mute uppercase">{label}</span>
      {children}
    </label>
  );
}

export function Notice({ children, tone = "mute" }: { children: ReactNode; tone?: "mute" | "stage" }) {
  return (
    <p role="status" className={tone === "stage" ? "text-sm text-stage" : "text-sm text-bone-dim"}>
      {children}
    </p>
  );
}

export function Empty({ title, lede }: { title: string; lede: string }) {
  return (
    <div className="panel px-5 py-8">
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="mt-2 text-bone-dim">{lede}</p>
    </div>
  );
}

function Signature({ ink }: { ink: string }) {
  return (
    <p className="font-['Great_Vibes'] text-[1.85rem] leading-none whitespace-nowrap" style={{ color: ink }}>
      Sergey Lazarev
    </p>
  );
}

export function PassCard({
  name,
  city,
  tier,
  number,
  status,
}: {
  name: string;
  city: string;
  tier: string;
  number: string | null;
  status: string;
}) {
  const live = status === "approved" && number;
  const gold = tier === "pit";
  const vip = tier === "stage";
  const label = status === "approved" ? "Member" : status === "rejected" ? "Declined" : "In review";

  if (!gold && !vip) {
    return (
      <article className="relative aspect-[1.7/1] w-full max-w-md overflow-hidden rounded-3xl border border-line bg-ink-2">
        <div className="absolute inset-x-0 top-0 h-1 bg-stage" />
        <div className="flex h-full flex-col justify-between p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="font-serif text-lg">
              Sergey <span className="italic text-stage">Lazarev</span>
            </p>
            <p className="text-xs tracking-widest text-bone-dim uppercase">{tierName(tier)}</p>
          </div>
          <div>
            <p className="text-xs tracking-widest text-mute uppercase">{label}</p>
            <p className="mt-1 font-serif text-3xl leading-none">{name}</p>
            <div className="mt-4 flex items-end justify-between gap-3 text-sm text-bone-dim">
              <span>{city}</span>
              <span className="font-medium tracking-widest text-bone tabular-nums">{live ? number : "—"}</span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  const face = gold
    ? "linear-gradient(145deg, #7a4a16 0%, #f6e2a8 28%, #e0b154 52%, #a56b22 78%, #5c320c 100%)"
    : "linear-gradient(155deg, #140814 0%, #5c1230 36%, #8d2348 58%, #1a1028 100%)";

  return (
    <article
      className="relative aspect-[1.7/1] w-full max-w-md overflow-hidden rounded-3xl shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
      style={{ background: face, color: gold ? "#2a1608" : "#f8efe6" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_32%,rgba(255,255,255,0.38)_48%,transparent_64%)]" />
      <div
        className="pointer-events-none absolute -right-10 -bottom-16 h-48 w-48 rounded-full blur-2xl"
        style={{ background: gold ? "rgba(255,236,180,0.55)" : "rgba(224,161,90,0.35)" }}
      />
      <div className="absolute inset-2 rounded-[1.2rem] border" style={{ borderColor: gold ? "rgba(92,50,12,0.35)" : "rgba(224,161,90,0.55)" }} />
      <div className="relative flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-serif text-lg leading-none">
              Sergey <span className="italic">Lazarev</span>
            </p>
            <p className="mt-1 text-[0.65rem] tracking-[0.28em] uppercase opacity-70">Circle</p>
          </div>
          <p
            className="rounded-full px-2.5 py-1 text-[0.65rem] tracking-[0.22em] uppercase"
            style={{
              background: gold ? "rgba(42,22,8,0.12)" : "rgba(224,161,90,0.18)",
              color: gold ? "#3a220c" : "#f0d7a4",
            }}
          >
            {tierName(tier)}
          </p>
        </div>
        <div>
          <p className="text-[0.65rem] tracking-[0.22em] uppercase opacity-70">{label}</p>
          <p className="mt-1 truncate font-serif text-3xl leading-none">{name}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="text-sm">
              <p className="opacity-80">{city}</p>
              <p className="mt-1 font-medium tracking-widest tabular-nums">{live ? number : "—"}</p>
            </div>
            <Signature ink={gold ? "#3a220c" : "#f3d48a"} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function SuccessTicket({
  code,
  service,
  holder,
  lines,
  features,
  state,
}: {
  code: string;
  service: string;
  holder: string;
  lines: string[];
  features: string[];
  state: "received" | "confirmed" | "declined";
}) {
  const headline =
    state === "confirmed" ? "Confirmed" : state === "declined" ? "Not approved" : "Application successful";
  const detail =
    state === "confirmed"
      ? "This is yours."
      : state === "declined"
        ? "You can apply again."
        : "We have it. You can follow the answer on your dashboard.";
  return (
    <article className="ticket" aria-label={`${headline}. ${service}. ${code}`}>
      <div className="ticket-main">
        <p className="text-xs tracking-widest text-stage uppercase">{headline}</p>
        <h3 className="mt-2 font-serif text-3xl leading-none">{service}</h3>
        <p className="mt-3 text-lg">{holder}</p>
        <ul className="mt-3 space-y-1 text-sm text-bone-dim">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs tracking-widest text-mute uppercase">Included</p>
        <ul className="mt-2 space-y-1 text-sm">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-mute">{detail}</p>
      </div>
      <aside className="ticket-stub">
        <p className="text-xs tracking-widest text-mute uppercase">Ticket</p>
        <p className="font-serif text-xl tracking-wide text-bone">{code}</p>
        <p className="text-xs tracking-widest text-bone-dim uppercase">
          {state === "confirmed" ? "Live" : state === "declined" ? "Closed" : "In review"}
        </p>
      </aside>
    </article>
  );
}

export function When({ iso, timeKnown }: { iso: string; timeKnown: boolean }) {
  const parts = whenParts(iso, timeKnown);
  return (
    <span className="tabular-nums">
      {parts.weekday} {parts.date}
      <span className="text-mute"> · {parts.time}</span>
    </span>
  );
}
