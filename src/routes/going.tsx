import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { attendanceCounts, listEvents, toggleGoing } from "@/lib/circle/api";
import { errText } from "@/lib/circle/format";
import { useMine } from "@/components/site/use-mine";
import { Notice, PageIntro, ShowPill, When } from "@/components/site/ui";

export const Route = createFileRoute("/going")({
  loader: async () => {
    const [shows, counts] = await Promise.all([
      listEvents({ data: "concert" }),
      attendanceCounts(),
    ]);
    return { shows, counts };
  },
  component: GoingPage,
});

function GoingPage() {
  const { shows, counts } = Route.useLoaderData();
  const router = useRouter();
  const { user, isPending } = useCurrentUserState();
  const { mine, reload } = useMine(!isPending && Boolean(user));
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const approved = mine?.membership?.status === "approved";
  const mineIds = new Set(mine?.going.map((row) => row.eventId) ?? []);

  async function toggle(eventId: number) {
    setBusy(eventId);
    setError(null);
    try {
      await toggleGoing({ data: eventId });
      reload();
      await router.invalidate();
    } catch (cause) {
      setError(errText(cause));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="wrap py-12 md:py-16">
      <PageIntro
        kicker="Who’s going"
        title="Mark the nights you are traveling to."
        lede="Any approved card can say they are going. Other members see the count, not a phone number. Take the mark off if the plan changes."
      />
      {error ? <div className="mt-6"><Notice tone="stage">{error}</Notice></div> : null}
      {!isPending && !user ? (
        <p className="mt-6 text-sm text-bone-dim">
          <Link to="/login" className="text-bone underline decoration-line underline-offset-4">Sign in</Link> to mark a show. You can already see who has marked one.
        </p>
      ) : null}
      {user && !approved ? (
        <p className="mt-6 text-sm text-bone-dim">
          The list opens with an approved card.{" "}
          <Link to="/membership" className="text-bone underline decoration-line underline-offset-4">See the cards</Link>
        </p>
      ) : null}
      <ul className="mt-8 divide-y divide-line border-t border-line">
        {shows.map((show) => {
          const fans = counts.find((row) => row.eventId === show.id)?.fans ?? 0;
          const mineOn = mineIds.has(show.id);
          return (
            <li key={show.id} className="grid gap-3 py-5 md:grid-cols-12 md:items-center">
              <div className="md:col-span-7">
                <p className="text-lg">{show.city}</p>
                <p className="text-sm text-mute">
                  <When iso={show.startsAt} timeKnown={show.timeKnown} /> · {show.venue}
                </p>
              </div>
              <div className="flex items-center gap-3 md:col-span-5 md:justify-end">
                <p className="text-sm tabular-nums text-bone-dim">{fans} going</p>
                <ShowPill show={show} />
                {user && approved ? (
                  <button type="button" className="btn btn-ghost" disabled={busy === show.id} onClick={() => toggle(show.id)}>
                    {mineOn ? "You’re in" : "I’m going"}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
