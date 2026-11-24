import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { listEvents, type Show } from "@/lib/circle/api";
import { OFFICIAL_TOUR } from "@/lib/circle/content";
import { monthLabel } from "@/lib/circle/format";
import { PageIntro, ShowPill, When } from "@/components/site/ui";

export const Route = createFileRoute("/tour")({
  loader: () => listEvents({ data: "concert" }),
  component: TourPage,
});

const FILTERS = [
  { id: "all", label: "All" },
  { id: "on_sale", label: "On sale" },
  { id: "last", label: "Last tickets" },
  { id: "sold_out", label: "Sold out" },
] as const;

function TourPage() {
  const shows = Route.useLoaderData();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shows.filter((show) => {
      if (filter !== "all" && show.status !== filter) return false;
      if (!q) return true;
      return `${show.city} ${show.venue}`.toLowerCase().includes(q);
    });
  }, [shows, filter, query]);

  const groups = new Map<string, Show[]>();
  for (const show of visible) {
    const key = monthLabel(show.startsAt);
    const list = groups.get(key) ?? [];
    list.push(show);
    groups.set(key, list);
  }

  return (
    <div className="wrap py-12 md:py-16">
      <PageIntro
        kicker="Tour"
        title="The road, in one list."
        lede="Dates follow the official Sergey Lazarev tour. A clock appears only when a poster names one — otherwise the night is Evening, in Moscow time. This page does not sell tickets."
      />
      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={item.id === filter ? "btn btn-primary" : "btn btn-ghost"}
            >
              {item.label}
            </button>
          ))}
        </div>
        <input
          className="field md:max-w-xs"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="City or hall"
          aria-label="Filter by city or hall"
        />
      </div>
      <p className="mt-6 text-sm text-mute">
        Buy and returns stay on the{" "}
        <a className="text-bone underline decoration-line underline-offset-4" href={OFFICIAL_TOUR} target="_blank" rel="noreferrer">
          official tour page
        </a>
        .
      </p>
      <div className="mt-10 space-y-12">
        {[...groups.entries()].map(([month, rows]) => (
          <section key={month}>
            <h2 className="font-serif text-3xl">{month}</h2>
            <ul className="mt-4 divide-y divide-line border-t border-line">
              {rows.map((show) => (
                <li key={show.id} className="grid gap-2 py-5 md:grid-cols-12 md:items-center">
                  <p className="text-sm md:col-span-4">
                    <When iso={show.startsAt} timeKnown={show.timeKnown} />
                  </p>
                  <div className="md:col-span-5">
                    <p className="text-lg">{show.city}</p>
                    <p className="text-sm text-mute">{show.venue}</p>
                    {show.note ? <p className="mt-1 text-sm text-bone-dim">{show.note}</p> : null}
                  </div>
                  <div className="md:col-span-3 md:text-right">
                    <ShowPill show={show} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {visible.length === 0 ? <p className="text-bone-dim">Nothing matches that filter.</p> : null}
      </div>
    </div>
  );
}
