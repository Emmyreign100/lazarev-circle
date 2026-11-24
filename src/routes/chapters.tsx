import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { joinChapter, leaveChapter, listChapters } from "@/lib/circle/api";
import { errText } from "@/lib/circle/format";
import { useMine } from "@/components/site/use-mine";
import { Notice, PageIntro } from "@/components/site/ui";

export const Route = createFileRoute("/chapters")({
  loader: () => listChapters(),
  component: ChaptersPage,
});

function ChaptersPage() {
  const chapters = Route.useLoaderData();
  const router = useRouter();
  const { user, isPending } = useCurrentUserState();
  const { mine, reload } = useMine(!isPending && Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | "leave" | null>(null);

  async function join(id: number) {
    setBusy(id);
    setError(null);
    try {
      await joinChapter({ data: id });
      reload();
      await router.invalidate();
    } catch (cause) {
      setError(errText(cause));
    } finally {
      setBusy(null);
    }
  }

  async function leave() {
    setBusy("leave");
    setError(null);
    try {
      await leaveChapter();
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
        kicker="Chapters"
        title="One city. One pin."
        lede="A chapter is one city of fans. Gold and VIP cards can join after the card is approved. You can hold one city. Los Angeles is here for people following the Mexican dates from far away."
      />
      {user && mine && !(mine.membership?.status === "approved" && (mine.membership.tier === "pit" || mine.membership.tier === "stage")) ? (
        <p className="mt-6 text-sm text-bone-dim">
          Chapters open with an approved Gold or VIP card.{" "}
          <Link to="/membership" className="text-bone underline decoration-line underline-offset-4">See the cards</Link>
        </p>
      ) : null}
      {mine?.chapter ? (
        <p className="mt-6 text-sm text-bone-dim">
          You are in {mine.chapter.city}.{" "}
          <button type="button" className="underline decoration-line underline-offset-4" onClick={leave} disabled={busy === "leave"}>
            Leave
          </button>
        </p>
      ) : null}
      {error ? <div className="mt-4"><Notice tone="stage">{error}</Notice></div> : null}
      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {chapters.map((chapter) => {
          const joined = mine?.chapter?.id === chapter.id;
          return (
            <li key={chapter.id} className="panel p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-serif text-3xl">{chapter.city}</h2>
                <p className="text-sm tabular-nums text-mute">{chapter.memberCount}</p>
              </div>
              <p className="mt-1 text-xs tracking-widest text-mute uppercase">{chapter.country}</p>
              <p className="mt-4 text-sm leading-relaxed text-bone-dim">{chapter.blurb}</p>
              {user && mine?.membership?.status === "approved" && (mine.membership.tier === "pit" || mine.membership.tier === "stage") ? (
                <button
                  type="button"
                  className="btn btn-ghost mt-5"
                  disabled={joined || busy === chapter.id}
                  onClick={() => join(chapter.id)}
                >
                  {joined ? "Your chapter" : busy === chapter.id ? "Joining…" : "Join"}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
      {!isPending && !user ? (
        <p className="mt-8 text-sm text-bone-dim">
          <Link to="/login" className="text-bone underline decoration-line underline-offset-4">
            Sign in
          </Link>{" "}
          to take a pin.
        </p>
      ) : null}
    </div>
  );
}
