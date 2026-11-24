import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listWall, postWall } from "@/lib/circle/api";
import { errText, whenParts } from "@/lib/circle/format";
import { Field, Notice, PageIntro, Pill } from "@/components/site/ui";

export const Route = createFileRoute("/wall")({
  loader: () => listWall(),
  component: WallPage,
});

function WallPage() {
  const notes = Route.useLoaderData();
  const router = useRouter();
  const { user, isPending } = useCurrentUserState();
  const [body, setBody] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await postWall({ data: { body, city } });
      setBody("");
      setCity("");
      await router.invalidate();
    } catch (cause) {
      setError(errText(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap py-12 md:py-16">
      <PageIntro
        kicker="Fan wall"
        title="One line from the room."
        lede="Short notes, a city if you want one. The desk can pin a note or take it down. Five per account, so the wall stays a wall and not a feed."
      />
      <div className="mt-10 grid gap-10 md:grid-cols-12">
        <div className="md:col-span-7">
          <ul className="space-y-4">
            {notes.map((note) => {
              const when = whenParts(note.createdAt, true);
              return (
                <li key={note.id} className="border-t border-line py-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm">{note.authorName}</p>
                    {note.city ? <p className="text-sm text-mute">{note.city}</p> : null}
                    {note.pinned ? <Pill tone="stage">Pinned</Pill> : null}
                  </div>
                  <p className="mt-3 text-lg leading-relaxed">{note.body}</p>
                  <p className="mt-3 text-xs text-mute tabular-nums">{when.date}</p>
                </li>
              );
            })}
          </ul>
        </div>
        <aside className="md:col-span-5">
          {isPending ? <p className="text-mute">Checking the door…</p> : null}
          {!isPending && !user ? (
            <div className="panel p-6">
              <h2 className="font-serif text-3xl">Sign in to leave a note</h2>
              <Link to="/login" className="btn btn-primary mt-5">
                Join
              </Link>
            </div>
          ) : null}
          {user ? (
            <form className="panel space-y-4 p-6" onSubmit={onSubmit}>
              <h2 className="font-serif text-3xl">Leave one</h2>
              <Field label="Note">
                <textarea className="field min-h-32" required minLength={8} maxLength={400} value={body} onChange={(e) => setBody(e.target.value)} />
              </Field>
              <Field label="City, optional">
                <input className="field" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} />
              </Field>
              {error ? <Notice tone="stage">{error}</Notice> : null}
              <button className="btn btn-primary" disabled={busy} type="submit">
                {busy ? "Posting…" : "Post"}
              </button>
            </form>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
