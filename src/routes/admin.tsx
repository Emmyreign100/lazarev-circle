import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import {
  adminBundle,
  createNews,
  deleteEvent,
  deleteNews,
  markMail,
  moderateWall,
  reviewCall,
  reviewHat,
  reviewMeet,
  reviewMembership,
  reviewSerenata,
  saveEvent,
  type Show,
} from "@/lib/circle/api";
import { ADMIN_EMAIL, TIERS } from "@/lib/circle/content";
import { errText, euros, tierName, whenParts } from "@/lib/circle/format";
import { useSession } from "@/components/site/session";
import { Field, Notice, Pill, ShowPill } from "@/components/site/ui";
import portrait from "@/assets/lazarev.jpg";

export const Route = createFileRoute("/admin")({
  component: AdminGate,
});

type Bundle = Awaited<ReturnType<typeof adminBundle>>;
type Tab = "overview" | "cards" | "calls" | "serenatas" | "hats" | "meets" | "dates" | "wall" | "mail" | "notes";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "cards", label: "Cards" },
  { id: "calls", label: "Calls" },
  { id: "serenatas", label: "Serenatas" },
  { id: "hats", label: "Hats" },
  { id: "meets", label: "Meets" },
  { id: "dates", label: "Dates" },
  { id: "wall", label: "Wall" },
  { id: "mail", label: "Mail" },
  { id: "notes", label: "Notes" },
];

function AdminGate() {
  const { authPending, profileReady, profile } = useSession();
  if (authPending || !profileReady) {
    return <div className="wrap py-20 text-mute">Checking the desk…</div>;
  }
  if (!profile) return <RedirectToSignIn />;
  if (profile.role !== "admin") {
    return (
      <div className="wrap py-16">
        <h1 className="font-serif text-5xl">Staff only.</h1>
        <p className="mt-4 max-w-lg text-bone-dim">
          This page is not part of the fan dashboard. Your account can use the card, serenatas, and the rest of the board.
        </p>
        <Link to="/me" className="btn btn-primary mt-6">Back to your dashboard</Link>
      </div>
    );
  }
  return <AdminDesk />;
}

function AdminDesk() {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<Bundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setData(await adminBundle());
      setError(null);
    } catch (cause) {
      setError(errText(cause));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="wrap py-10 md:py-14">
      <figure className="relative overflow-hidden rounded-3xl border border-line">
        <img src={portrait} alt="Sergey Lazarev on stage" className="h-56 w-full object-cover object-[center_20%] md:h-72" />
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/80 to-transparent p-5 md:p-7">
          <p className="text-xs tracking-widest text-stage uppercase">Staff desk</p>
          <h1 className="mt-1 font-serif text-4xl md:text-5xl">Lazarev desk</h1>
        </figcaption>
      </figure>
      <p className="mt-4 text-sm text-mute">{ADMIN_EMAIL}</p>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? "btn btn-primary shrink-0" : "btn btn-ghost shrink-0"}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {item.id === "cards" && data?.stats.pendingCards ? ` ${data.stats.pendingCards}` : ""}
            {item.id === "calls" && data?.stats.pendingCalls ? ` ${data.stats.pendingCalls}` : ""}
            {item.id === "serenatas" && data?.stats.pendingSerenatas ? ` ${data.stats.pendingSerenatas}` : ""}
            {item.id === "hats" && data?.stats.pendingHats ? ` ${data.stats.pendingHats}` : ""}
            {item.id === "mail" && data?.stats.unread ? ` ${data.stats.unread}` : ""}
          </button>
        ))}
      </div>
      {loading && !data ? <p className="mt-8 text-mute">Loading the desk…</p> : null}
      {error ? <div className="mt-6"><Notice tone="stage">{error}</Notice></div> : null}
      {data ? (
        <div className="mt-8">
          {tab === "overview" ? <Overview data={data} /> : null}
          {tab === "cards" ? <Cards data={data} reload={load} /> : null}
          {tab === "calls" ? <Calls data={data} reload={load} /> : null}
          {tab === "serenatas" ? <Serenatas data={data} reload={load} /> : null}
          {tab === "hats" ? <Hats data={data} reload={load} /> : null}
          {tab === "meets" ? <Meets data={data} reload={load} /> : null}
          {tab === "dates" ? <Dates data={data} reload={load} /> : null}
          {tab === "wall" ? <Wall data={data} reload={load} /> : null}
          {tab === "mail" ? <Mail data={data} reload={load} /> : null}
          {tab === "notes" ? <Notes data={data} reload={load} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function Overview({ data }: { data: Bundle }) {
  const max = Math.max(1, ...data.songs.map((song) => song.votes));
  const stats = [
    ["Cards waiting", data.stats.pendingCards],
    ["Calls ready", data.stats.pendingCalls],
    ["Serenatas", data.stats.pendingSerenatas],
    ["Hats", data.stats.pendingHats],
    ["Meets waiting", data.stats.pendingMeets],
    ["Unread mail", data.stats.unread],
    ["Accounts", data.stats.accounts],
  ] as const;
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="panel p-4">
            <p className="text-xs tracking-widest text-mute uppercase">{label}</p>
            <p className="mt-2 font-serif text-4xl tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-bone-dim">
        {data.stats.store === "permanent"
          ? "Accounts, cards, calls, serenatas, and hat requests are kept in the permanent database. They stay after the site goes idle."
          : "This copy is temporary. Records disappear when the server restarts."}
      </p>
      <h2 className="mt-10 font-serif text-3xl">Ballot</h2>
      <ul className="mt-4 space-y-3">
        {data.songs.map((song) => (
          <li key={song.id}>
            <div className="flex justify-between text-sm">
              <span>{song.title}</span>
              <span className="tabular-nums text-mute">{song.votes}</span>
            </div>
            <div className="mt-2 h-1 rounded-full bg-panel">
              <div className="h-full bg-stage" style={{ width: `${(song.votes / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Cards({ data, reload }: { data: Bundle; reload: () => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  async function review(id: number, status: "approved" | "rejected") {
    setError(null);
    try {
      await reviewMembership({ data: { id, status } });
      await reload();
    } catch (cause) {
      setError(errText(cause));
    }
  }
  return (
    <div className="space-y-4">
      {error ? <Notice tone="stage">{error}</Notice> : null}
      {data.memberships.length === 0 ? <p className="text-bone-dim">No applications yet.</p> : null}
      {data.memberships.map((row) => (
        <article key={row.id} className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl">{row.fullName}</h2>
              <p className="text-sm text-mute">
                {row.email} · {row.city} · {tierName(row.tier)}
                {TIERS.find((item) => item.id === row.tier) ? ` · ${euros(TIERS.find((item) => item.id === row.tier)!.price)}` : ""}
              </p>
            </div>
            <Pill tone={row.status === "approved" ? "bone" : row.status === "rejected" ? "stage" : "mute"}>
              {row.status}
            </Pill>
          </div>
          {row.story ? <p className="mt-3 text-sm leading-relaxed text-bone-dim">{row.story}</p> : null}
          {row.cardNumber ? <p className="mt-3 text-sm tabular-nums">{row.cardNumber}</p> : null}
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn btn-primary" onClick={() => review(row.id, "approved")}>Approve</button>
            <button type="button" className="btn btn-ghost" onClick={() => review(row.id, "rejected")}>Decline</button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Calls({ data, reload }: { data: Bundle; reload: () => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  async function review(id: number, status: "approved" | "rejected") {
    setError(null);
    try {
      await reviewCall({ data: { id, status } });
      await reload();
    } catch (cause) {
      setError(errText(cause));
    }
  }
  return (
    <div className="space-y-4">
      {error ? <Notice tone="stage">{error}</Notice> : null}
      {data.calls.length === 0 ? <p className="text-bone-dim">No call requests yet.</p> : null}
      {data.calls.map((row) => (
        <article key={row.id} className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl">{row.name || row.email || "Fan"}</h2>
              <p className="text-sm text-mute">
                {row.email} · {euros(row.amountEur)} · {row.status === "paid" ? "Paid, ready to approve" : row.status}
              </p>
            </div>
            <Pill tone={row.status === "approved" ? "bone" : row.status === "rejected" ? "stage" : "mute"}>{row.status}</Pill>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-bone-dim">{row.reason}</p>
          {row.status !== "paid" && row.status !== "approved" ? (
            <p className="mt-3 text-sm text-mute">Approve stays closed until the €650 is recorded as paid.</p>
          ) : null}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="btn btn-primary"
              disabled={row.status !== "paid"}
              onClick={() => review(row.id, "approved")}
            >
              {row.status === "paid" ? "Approve" : "Approve after €650"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => review(row.id, "rejected")}>
              Decline
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Meets({ data, reload }: { data: Bundle; reload: () => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  async function review(id: number, status: "approved" | "rejected") {
    setError(null);
    try {
      await reviewMeet({ data: { id, status } });
      await reload();
    } catch (cause) {
      setError(errText(cause));
    }
  }
  return (
    <div className="space-y-4">
      {error ? <Notice tone="stage">{error}</Notice> : null}
      {data.meets.length === 0 ? <p className="text-bone-dim">No meet requests yet.</p> : null}
      {data.meets.map((row) => (
        <article key={row.id} className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl">{row.fullName}</h2>
              <p className="text-sm text-mute">
                {row.city} · {whenParts(row.startsAt, true).date} · {row.guests} guests · {row.email}
              </p>
            </div>
            <Pill>{row.status}</Pill>
          </div>
          {row.note ? <p className="mt-3 text-sm text-bone-dim">{row.note}</p> : null}
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn btn-primary" onClick={() => review(row.id, "approved")}>Confirm</button>
            <button type="button" className="btn btn-ghost" onClick={() => review(row.id, "rejected")}>Decline</button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Serenatas({ data, reload }: { data: Bundle; reload: () => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  async function review(id: number, status: "approved" | "rejected") {
    setError(null);
    try {
      await reviewSerenata({ data: { id, status } });
      await reload();
    } catch (cause) {
      setError(errText(cause));
    }
  }
  return (
    <div className="space-y-4">
      {error ? <Notice tone="stage">{error}</Notice> : null}
      {data.serenatas.length === 0 ? <p className="text-bone-dim">No serenatas yet.</p> : null}
      {data.serenatas.map((row) => (
        <article key={row.id} className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl">{row.songTitle}</h2>
              <p className="text-sm text-mute">
                For {row.dedicatee}
                {row.showCity ? ` · ${row.showCity}` : " · any night"}
                {row.email ? ` · ${row.email}` : ""}
              </p>
            </div>
            <Pill>{row.status}</Pill>
          </div>
          {row.note ? <p className="mt-3 text-sm text-bone-dim">{row.note}</p> : null}
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn btn-primary" onClick={() => review(row.id, "approved")}>Approve</button>
            <button type="button" className="btn btn-ghost" onClick={() => review(row.id, "rejected")}>Decline</button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Hats({ data, reload }: { data: Bundle; reload: () => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  async function review(id: number, status: "approved" | "rejected") {
    setError(null);
    try {
      await reviewHat({ data: { id, status } });
      await reload();
    } catch (cause) {
      setError(errText(cause));
    }
  }
  return (
    <div className="space-y-4">
      {error ? <Notice tone="stage">{error}</Notice> : null}
      {data.hats.length === 0 ? <p className="text-bone-dim">No hat requests yet.</p> : null}
      {data.hats.map((row) => (
        <article key={row.id} className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl">{row.inscription}</h2>
              <p className="text-sm text-mute">
                {row.hatColor} · {row.city} · {whenParts(row.startsAt, true).date}
                {row.email ? ` · ${row.email}` : ""}
              </p>
            </div>
            <Pill>{row.status}</Pill>
          </div>
          {row.note ? <p className="mt-3 text-sm text-bone-dim">{row.note}</p> : null}
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn btn-primary" onClick={() => review(row.id, "approved")}>Approve</button>
            <button type="button" className="btn btn-ghost" onClick={() => review(row.id, "rejected")}>Decline</button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Dates({ data, reload }: { data: Bundle; reload: () => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  async function run(task: () => Promise<unknown>) {
    setError(null);
    try {
      await task();
      await reload();
    } catch (cause) {
      setError(errText(cause));
    }
  }
  return (
    <div>
      <button type="button" className="btn btn-primary" onClick={() => setOpen((value) => !value)}>
        {open ? "Close form" : "Add a date"}
      </button>
      {open ? <EventForm onSave={(input) => run(() => saveEvent({ data: input }))} /> : null}
      {error ? <div className="mt-4"><Notice tone="stage">{error}</Notice></div> : null}
      <ul className="mt-6 divide-y divide-line border-t border-line">
        {data.events.map((show) => (
          <li key={show.id} className="grid gap-3 py-4 md:grid-cols-12 md:items-center">
            <div className="md:col-span-7">
              <p>{show.city} · {show.title}</p>
              <p className="text-sm text-mute">{show.kind} · {show.venue} · {whenParts(show.startsAt, show.timeKnown).date}</p>
            </div>
            <div className="md:col-span-3">
              <ShowPill show={show} />
            </div>
            <div className="flex gap-2 md:col-span-2 md:justify-end">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  if (window.confirm(`Remove ${show.city}?`)) void run(() => deleteEvent({ data: show.id }));
                }}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EventForm({
  onSave,
}: {
  onSave: (input: {
    title: string;
    city: string;
    venue: string;
    startsAt: string;
    timeKnown: boolean;
    status: Show["status"];
    kind: Show["kind"];
    note?: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("En Vivo");
  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [timeKnown, setTimeKnown] = useState(false);
  const [kind, setKind] = useState<Show["kind"]>("concert");
  const [status, setStatus] = useState<Show["status"]>("on_sale");
  const [note, setNote] = useState("");
  return (
    <form
      className="panel mt-4 grid gap-4 p-5 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave({
          title,
          city,
          venue,
          startsAt,
          timeKnown,
          status,
          kind,
          note,
        });
      }}
    >
      <Field label="Title"><input className="field" value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
      <Field label="City"><input className="field" value={city} onChange={(e) => setCity(e.target.value)} required /></Field>
      <Field label="Venue"><input className="field" value={venue} onChange={(e) => setVenue(e.target.value)} required /></Field>
      <Field label="Start">
        <input className="field" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
      </Field>
      <label className="flex items-center gap-3 text-sm md:col-span-2">
        <input type="checkbox" checked={timeKnown} onChange={(e) => setTimeKnown(e.target.checked)} />
        Clock is on the poster. Leave this off and the date shows as Evening.
      </label>
      <Field label="Kind">
        <select className="field" value={kind} onChange={(e) => setKind(e.target.value as Show["kind"])}>
          <option value="concert">Concert</option>
          <option value="meet">Meet window</option>
        </select>
      </Field>
      <Field label="Status">
        <select className="field" value={status} onChange={(e) => setStatus(e.target.value as Show["status"])}>
          <option value="on_sale">On sale</option>
          <option value="last">Last tickets</option>
          <option value="sold_out">Sold out</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </Field>
      <div className="md:col-span-2">
        <Field label="Note">
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
      <button className="btn btn-primary md:col-span-2" type="submit">Save date</button>
    </form>
  );
}

function Wall({ data, reload }: { data: Bundle; reload: () => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  async function setFlag(id: number, patch: { pinned?: boolean; hidden?: boolean }) {
    setError(null);
    try {
      await moderateWall({ data: { id, ...patch } });
      await reload();
    } catch (cause) {
      setError(errText(cause));
    }
  }
  return (
    <div className="space-y-4">
      {error ? <Notice tone="stage">{error}</Notice> : null}
      {data.wall.map((note) => (
        <article key={note.id} className="panel p-5">
          <p className="text-sm text-mute">{note.authorName}{note.city ? ` · ${note.city}` : ""}{note.hidden ? " · hidden" : ""}{note.pinned ? " · pinned" : ""}</p>
          <p className="mt-2">{note.body}</p>
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setFlag(note.id, { pinned: !note.pinned })}>
              {note.pinned ? "Unpin" : "Pin"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setFlag(note.id, { hidden: !note.hidden })}>
              {note.hidden ? "Show" : "Hide"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Mail({ data, reload }: { data: Bundle; reload: () => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      {error ? <Notice tone="stage">{error}</Notice> : null}
      {data.mail.length === 0 ? <p className="text-bone-dim">The inbox is empty.</p> : null}
      {data.mail.map((mail) => (
        <article key={mail.id} className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-2xl">{mail.topic}</h2>
            {!mail.seen ? <Pill tone="stage">New</Pill> : null}
          </div>
          <p className="mt-1 text-sm text-mute">{mail.name} · {mail.email}</p>
          <p className="mt-3 text-sm leading-relaxed">{mail.body}</p>
          {!mail.seen ? (
            <button
              type="button"
              className="btn btn-ghost mt-4"
              onClick={() => {
                markMail({ data: mail.id })
                  .then(reload)
                  .catch((cause: unknown) => setError(errText(cause)));
              }}
            >
              Mark read
            </button>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function Notes({ data, reload }: { data: Bundle; reload: () => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          createNews({ data: { title, excerpt, body } })
            .then(async () => {
              setTitle("");
              setExcerpt("");
              setBody("");
              await reload();
            })
            .catch((cause: unknown) => setError(errText(cause)));
        }}
      >
        <Field label="Title"><input className="field" value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
        <Field label="Excerpt"><input className="field" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required /></Field>
        <Field label="Body"><textarea className="field min-h-32" value={body} onChange={(e) => setBody(e.target.value)} required /></Field>
        {error ? <Notice tone="stage">{error}</Notice> : null}
        <button className="btn btn-primary" type="submit">Publish</button>
      </form>
      <ul className="mt-8 divide-y divide-line border-t border-line">
        {data.news.map((note) => (
          <li key={note.slug} className="flex items-center justify-between gap-4 py-4">
            <p>{note.title}</p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                deleteNews({ data: note.slug }).then(reload).catch((cause: unknown) => setError(errText(cause)));
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
