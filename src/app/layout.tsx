import "./globals.css"
import type { Metadata, Viewport } from "next"
import { Toaster } from "sonner"

import { AnalyticsProvider } from "@/components/AnalyticsProvider"
import PwaInstallPrompt from "@/components/PwaInstallPrompt"
import {
  DEV_HANDLE,
  DEV_URL,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/site"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/pwa-icons/192", sizes: "192x192", type: "image/png" },
      { url: "/pwa-icons/512", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/pwa-icons/180", sizes: "180x180", type: "image/png" }],
  },
}

export const viewport: Viewport = {
  themeColor: "#b75618",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={cn("min-h-screen bg-background text-foreground antialiased")}>
        <AnalyticsProvider>
          <div className="relative min-h-screen">
            <header className="sticky top-0 z-40 border-b border-border/70 bg-[linear-gradient(180deg,rgba(255,250,241,0.96),rgba(255,245,225,0.88))] backdrop-blur">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                    Cardapio digital
                  </p>
                  <div className="text-xl font-semibold tracking-tight text-foreground">{SITE_NAME}</div>
                  <p className="text-xs text-muted-foreground">Dende, pimenta e pedido rapido.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-full border border-border bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
                  >
                    {INSTAGRAM_HANDLE}
                  </a>
                  <PwaInstallPrompt />
                </div>
              </div>
            </header>

            <div>{children}</div>

            <footer className="border-t border-border/70 bg-[linear-gradient(180deg,rgba(255,247,232,0.86),rgba(246,230,195,0.86))]">
              <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:px-6 sm:flex-row sm:items-center sm:justify-between">
                <p>{new Date().getFullYear()} {SITE_NAME}. Pedido rapido pelo WhatsApp.</p>
                <a
                  href={DEV_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-foreground"
                >
                  Sistema desenvolvido por {DEV_HANDLE}
                </a>
              </div>
            </footer>
          </div>
        </AnalyticsProvider>

        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
