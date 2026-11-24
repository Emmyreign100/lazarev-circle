import { createFileRoute } from "@tanstack/react-router";
import { ALBUMS } from "@/lib/circle/content";
import { PageIntro } from "@/components/site/ui";

export const Route = createFileRoute("/discography")({
  component: DiscographyPage,
});

function DiscographyPage() {
  return (
    <div className="wrap py-12 md:py-16">
      <PageIntro
        kicker="Records"
        title="From El Malo to MUDA."
        lede="The studio records the ballot draws from, plus MudaH. Titles only — this board does not reprint lyrics. Tickets stay on the official tour."
      />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <article className="panel p-6">
          <p className="text-xs tracking-widest text-stage uppercase">Latin Grammy 2023</p>
          <h2 className="mt-2 font-serif text-3xl">Colmillo de Leche</h2>
          <p className="mt-2 text-bone-dim">Best Norteño Album.</p>
        </article>
        <article className="panel p-6">
          <p className="text-xs tracking-widest text-stage uppercase">Latin Grammy 2024</p>
          <h2 className="mt-2 font-serif text-3xl">Boca Chueca, Vol. 1</h2>
          <p className="mt-2 text-bone-dim">Best Contemporary Mexican Music Album.</p>
        </article>
      </div>
      <ol className="mt-10 divide-y divide-line border-t border-line">
        {ALBUMS.map((album) => (
          <li key={`${album.year}-${album.title}`} className="grid gap-2 py-5 md:grid-cols-12">
            <p className="text-sm tabular-nums text-mute md:col-span-2">{album.year}</p>
            <h2 className="font-serif text-2xl md:col-span-4">{album.title}</h2>
            <p className="text-sm leading-relaxed text-bone-dim md:col-span-6">{album.note}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
