import { createFileRoute, Link } from "@tanstack/react-router";
import { listNews } from "@/lib/circle/api";
import { whenParts } from "@/lib/circle/format";
import { PageIntro } from "@/components/site/ui";

export const Route = createFileRoute("/news")({
  loader: () => listNews(),
  component: NewsPage,
});

function NewsPage() {
  const notes = Route.useLoaderData();
  return (
    <div className="wrap py-12 md:py-16">
      <PageIntro
        kicker="Notes"
        title="Notes from the board."
        lede="Short updates on the tour, the membership card, serenatas, and the hat list."
      />
      <ul className="mt-10 max-w-3xl divide-y divide-line border-t border-line">
        {notes.map((note) => {
          const when = whenParts(note.publishedAt, true);
          return (
            <li key={note.slug} className="py-6">
              <p className="text-xs tracking-widest text-mute uppercase tabular-nums">{when.date}</p>
              <Link to="/news/$slug" params={{ slug: note.slug }} className="mt-2 block font-serif text-3xl hover:text-bone-dim">
                {note.title}
              </Link>
              <p className="mt-2 text-bone-dim">{note.excerpt}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
