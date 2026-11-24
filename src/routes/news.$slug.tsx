import { createFileRoute, Link } from "@tanstack/react-router";
import { getNews } from "@/lib/circle/api";
import { whenParts } from "@/lib/circle/format";

export const Route = createFileRoute("/news/$slug")({
  loader: ({ params }) => getNews({ data: params.slug }),
  component: NewsPiecePage,
});

function NewsPiecePage() {
  const note = Route.useLoaderData();
  const when = whenParts(note.publishedAt, true);
  const paragraphs = note.body.split(/\n\n+/);
  return (
    <article className="wrap max-w-3xl py-12 md:py-16">
      <Link to="/news" className="text-sm text-mute hover:text-bone">
        All notes
      </Link>
      <p className="mt-6 text-xs tracking-widest text-stage uppercase tabular-nums">{when.date}</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight md:text-6xl">{note.title}</h1>
      <p className="mt-4 text-lg text-bone-dim">{note.excerpt}</p>
      <div className="mt-8 space-y-5 text-base leading-relaxed">
        {paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
