import { useEffect, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listSongs, myVoteIds, toggleVote } from "@/lib/circle/api";
import { errText } from "@/lib/circle/format";
import { Notice, PageIntro } from "@/components/site/ui";

export const Route = createFileRoute("/ballot")({
  loader: () => listSongs(),
  component: BallotPage,
});

function BallotPage() {
  const songs = Route.useLoaderData();
  const router = useRouter();
  const { user, isPending } = useCurrentUserState();
  const [mine, setMine] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const max = Math.max(1, ...songs.map((song) => song.votes));

  useEffect(() => {
    if (isPending || !user) {
      setMine([]);
      return;
    }
    let live = true;
    myVoteIds()
      .then((ids) => {
        if (live) setMine(ids);
      })
      .catch(() => {
        if (live) setMine([]);
      });
    return () => {
      live = false;
    };
  }, [isPending, user?.id]);

  async function onVote(id: number) {
    setBusy(id);
    setError(null);
    try {
      await toggleVote({ data: id });
      setMine(await myVoteIds());
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
        kicker="Setlist ballot"
        title="Three songs. That’s the rule."
        lede="Vote for what you want in the room. Take a vote back if you change your mind. The tally is public, so the desk can see a city leaning before the night is locked."
      />
      {!isPending && !user ? (
        <p className="mt-6 text-sm text-bone-dim">
          <Link to="/login" className="text-bone underline decoration-line underline-offset-4">
            Sign in
          </Link>{" "}
          to cast yours. The numbers stay visible either way.
        </p>
      ) : (
        <p className="mt-6 text-sm text-mute">{mine.length} of 3 used.</p>
      )}
      {error ? <div className="mt-4"><Notice tone="stage">{error}</Notice></div> : null}
      <ol className="mt-8 space-y-3">
        {songs.map((song, index) => {
          const picked = mine.includes(song.id);
          const full = mine.length >= 3 && !picked;
          return (
            <li key={song.id} className="panel p-4 md:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-widest text-mute uppercase tabular-nums">{String(index + 1).padStart(2, "0")}</p>
                  <h2 className="mt-1 font-serif text-2xl md:text-3xl">{song.title}</h2>
                  <p className="text-sm text-mute">
                    {song.subtitle}
                    {song.album ? ` · ${song.album}` : ""}
                  </p>
                </div>
                <p className="text-sm tabular-nums text-bone-dim">{song.votes}</p>
              </div>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-ink">
                <div className="h-full bg-stage" style={{ width: `${(song.votes / max) * 100}%` }} />
              </div>
              {user ? (
                <button
                  type="button"
                  className="btn btn-ghost mt-4"
                  disabled={busy === song.id || full}
                  onClick={() => onVote(song.id)}
                >
                  {busy === song.id ? "Saving…" : picked ? "Remove" : full ? "Ballot full" : "Add"}
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
