import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { UserButton } from "@/lib/auth/gates";
import { ADMIN_EMAIL, APP_NAME, ARTIST, MORE, NAV, OFFICIAL_TICKETS, OFFICIAL_TOUR, SITE_HOST } from "@/lib/circle/content";
import { useSession } from "@/components/site/session";

function AuthLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { authPending, profile, profileReady } = useSession();
  if (authPending || !profileReady) {
    return <div className="h-10 w-28 animate-pulse rounded-full bg-panel" />;
  }
  if (!profile) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/staff" onClick={onNavigate} className="text-sm text-mute hover:text-bone">
          Staff
        </Link>
        <Link to="/login" onClick={onNavigate} className="btn btn-primary">
          Fan login
        </Link>
      </div>
    );
  }
  if (profile.role === "admin") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/admin" onClick={onNavigate} className="text-sm text-bone hover:text-bone-dim">
          Desk
        </Link>
        <UserButton />
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link to="/me" onClick={onNavigate} className="text-sm text-bone-dim hover:text-bone">
        Dashboard
      </Link>
      <UserButton />
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [...NAV, ...MORE];

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-bone focus:px-3 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-md">
        <div className="wrap flex h-16 items-center justify-between gap-4">
          <Link to="/" className="font-serif text-xl tracking-tight">
            Sergey <span className="italic text-stage">Lazarev</span>
          </Link>
          <nav className="hidden items-center gap-4 xl:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={pathname === item.to ? "text-sm text-bone" : "text-sm text-mute hover:text-bone"}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:block">
            <AuthLinks />
          </div>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-line xl:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {open ? (
          <div className="border-t border-line xl:hidden">
            <nav className="wrap flex flex-col py-3" aria-label="Mobile">
              {links.map((item) => (
                <Link key={item.to} to={item.to} className="py-3 text-lg">
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 border-t border-line pt-4 md:hidden">
                <AuthLinks onNavigate={() => setOpen(false)} />
              </div>
            </nav>
          </div>
        ) : null}
      </header>
      <main id="content" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-line">
        <div className="wrap grid gap-8 py-12 md:grid-cols-3">
          <div>
            <p className="font-serif text-2xl">
              Sergey <span className="italic">Lazarev</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-mute">
              A fan community for {ARTIST}. Not the box office, not the promoter.
            </p>
            <p className="mt-3 text-sm text-bone">{SITE_HOST}</p>
          </div>
          <div className="text-sm leading-relaxed">
            <p className="text-xs tracking-widest text-mute uppercase">Contact</p>
            <a className="mt-2 block text-bone hover:text-bone-dim" href={`mailto:${ADMIN_EMAIL}`}>
              {ADMIN_EMAIL}
            </a>
            <p className="mt-3 text-mute">Questions about the board. Concert tickets and returns stay with the promoter.</p>
          </div>
          <div className="text-sm leading-relaxed">
            <p className="text-xs tracking-widest text-mute uppercase">Official tickets</p>
            <a className="mt-2 block text-bone hover:text-bone-dim" href={OFFICIAL_TOUR} target="_blank" rel="noreferrer">
              sergeylazarev.ru/tour
            </a>
            <p className="mt-3 text-mute">Tickets stay on {OFFICIAL_TICKETS}. This board does not sell or refund them.</p>
          </div>
        </div>
        <div className="wrap flex flex-wrap gap-x-4 gap-y-2 border-t border-line py-4 text-xs text-mute">
          <span>{APP_NAME}</span>
          {MORE.map((item) => (
            <Link key={item.to} to={item.to} className="hover:text-bone">
              {item.label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
