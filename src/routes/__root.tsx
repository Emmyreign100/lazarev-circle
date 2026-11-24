import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SessionProvider } from "@/components/site/session";
import { Shell } from "@/components/site/shell";
import appCss from "../styles.css?url";

import { APP_NAME, SITE_URL } from "@/lib/circle/content";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: "Fan community for Sergey Lazarev: the Showman tour, membership cards, call requests, serenatas, hat signing, and city chapters." },
      { property: "og:url", content: SITE_URL },
      { property: "og:site_name", content: APP_NAME },
      { name: "theme-color", content: "#120e0b" },
    ],
    links: [
      { rel: "canonical", href: SITE_URL },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,500&family=Great+Vibes&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" className="dark antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <SessionProvider>
            <Shell>
              <Outlet />
            </Shell>
          </SessionProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
