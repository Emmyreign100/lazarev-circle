import { createFileRoute, Link } from "@tanstack/react-router";
import { getHome } from "@/lib/circle/api";
import { CITIES } from "@/lib/circle/content";
import { isTonight } from "@/lib/circle/format";
import stage from "@/assets/lazarev.jpg";

export const Route = createFileRoute("/")({
  loader: () => getHome(),
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  const next = data.next;
  const tonight = next ? isTonight(next.startsAt) : false;
  const loop = [...CITIES, ...CITIES];

  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <img
          src={stage}
          alt="Sergey Lazarev performing on stage"
          className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/35" />
        <div className="wrap relative grid items-end gap-8 py-14 md:grid-cols-12 md:py-20">
          <div className="md:col-span-7">
            <p className="text-xs font-medium tracking-widest text-stage uppercase">
              {tonight ? "Tonight · Showman" : "On the road · Showman"}
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-none md:text-7xl">
              Sergey Lazarev
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-bone-dim">
              The fan board opens here. Sign in on the fan door before you apply for a card. The staff door is a different room.
            </p>
          </div>
          <div className="grid gap-3 md:col-span-5">
            <Link to="/login" className="panel block p-5 hover:border-bone">
              <p className="text-xs tracking-widest text-stage uppercase">Fans</p>
              <h2 className="mt-2 font-serif text-3xl">Fan login</h2>
              <p className="mt-2 text-sm leading-relaxed text-bone-dim">
                Register or sign in with your own email. Cards, calls, serenatas, and the setlist live behind this door.
              </p>
            </Link>
            <Link to="/staff" className="panel block p-5 hover:border-bone">
              <p className="text-xs tracking-widest text-mute uppercase">Desk</p>
              <h2 className="mt-2 font-serif text-3xl">Staff login</h2>
              <p className="mt-2 text-sm leading-relaxed text-bone-dim">
                Only the Lazarev desk. Fans cannot use this door, and staff do not use the fan one.
              </p>
            </Link>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-line py-4">
        <div className="marquee flex w-max gap-10">
          {loop.map((city, index) => (
            <span key={`${city}-${index}`} className="font-serif text-2xl text-bone-dim">
              {city}
            </span>
          ))}
        </div>
      </div>

      <section className="wrap grid gap-4 py-16 md:grid-cols-3">
        <Link to="/ballot" className="panel block p-6 hover:border-bone-dim">
          <p className="text-xs tracking-widest text-stage uppercase">Setlist</p>
          <h2 className="mt-3 font-serif text-3xl">Setlist ballot</h2>
          <p className="mt-3 text-bone-dim">Pick up to three songs. Anyone can see the tally. Your account keeps the votes.</p>
          {data.leaders[0] ? (
            <p className="mt-5 text-sm text-mute">Leading now: {data.leaders[0].title}</p>
          ) : null}
        </Link>
        <Link to="/wall" className="panel block p-6 hover:border-bone-dim">
          <p className="text-xs tracking-widest text-stage uppercase">Notes</p>
          <h2 className="mt-3 font-serif text-3xl">Fan wall</h2>
          <p className="mt-3 text-bone-dim">Leave a short note and a city. Five notes per member. A good one can be pinned.</p>
        </Link>
        <Link to="/chapters" className="panel block p-6 hover:border-bone-dim">
          <p className="text-xs tracking-widest text-stage uppercase">Cities</p>
          <h2 className="mt-3 font-serif text-3xl">City chapters</h2>
          <p className="mt-3 text-bone-dim">Gold and VIP members join one city. Moscow, the tour stops, and Abuja for fans far from the road.</p>
        </Link>
      </section>

      <section className="wrap grid gap-4 pb-4 md:grid-cols-3">
        <Link to="/serenatas" className="panel block p-6 hover:border-bone-dim">
          <p className="text-xs tracking-widest text-stage uppercase">Dedication</p>
          <h2 className="mt-3 font-serif text-3xl">Serenatas</h2>
          <p className="mt-3 text-bone-dim">Ask for a song to be named for someone. It stays off the board until the desk says yes.</p>
          {data.serenatas[0] ? (
            <p className="mt-5 text-sm text-mute">Latest: {data.serenatas[0].songTitle} for {data.serenatas[0].dedicatee}</p>
          ) : (
            <p className="mt-5 text-sm text-mute">None approved yet.</p>
          )}
        </Link>
        <Link to="/hats" className="panel block p-6 hover:border-bone-dim">
          <p className="text-xs tracking-widest text-stage uppercase">The list</p>
          <h2 className="mt-3 font-serif text-3xl">Hat signing</h2>
          <p className="mt-3 text-bone-dim">Gold and VIP can put one hat on a show. A yes is a place on the list, not a promise from the stage.</p>
        </Link>
        <Link to="/going" className="panel block p-6 hover:border-bone-dim">
          <p className="text-xs tracking-widest text-stage uppercase">Travel</p>
          <h2 className="mt-3 font-serif text-3xl">Who’s going</h2>
          <p className="mt-3 text-bone-dim">Mark the nights you are traveling to. The count is public. Your number is not.</p>
        </Link>
      </section>

      <section className="wrap py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-4xl">Updates</h2>
          <Link to="/news" className="text-sm text-bone-dim hover:text-bone">
            All notes
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {data.news.map((note) => (
            <Link key={note.slug} to="/news/$slug" params={{ slug: note.slug }} className="border-t border-line py-5">
              <h3 className="font-serif text-2xl">{note.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-bone-dim">{note.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
