import { Suspense } from "react"
import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { Globe, Instagram } from "lucide-react"
import { Toaster } from "sonner"

import "./globals.css"

import { AnalyticsProvider } from "@/components/AnalyticsProvider"
import { BrandMark } from "@/components/BrandMark"
import { GoogleAdsPageView } from "@/components/GoogleAdsPageView"
import PwaInstallPrompt from "@/components/PwaInstallPrompt"
import {
  DEV_HANDLE,
  DEV_SITE_LABEL,
  DEV_SITE_URL,
  DEV_URL,
  GOOGLE_ADS_ID,
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
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-ads-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ADS_ID}');
          `}
        </Script>

        <AnalyticsProvider>
          <Suspense fallback={null}>
            <GoogleAdsPageView />
          </Suspense>

          <div className="relative min-h-screen">
            <header className="sticky top-0 z-40 border-b border-border/70 bg-[linear-gradient(180deg,rgba(255,249,239,0.96),rgba(255,243,219,0.9))] backdrop-blur">
              <div className="brand-pattern-strip h-4 w-full opacity-95" />

              <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
                <BrandMark size="sm" hideCaption className="min-w-0" />

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Abrir Instagram ${INSTAGRAM_HANDLE}`}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-background/82 text-foreground transition hover:bg-accent"
                  >
                    <Instagram className="size-4" />
                  </a>
                  <PwaInstallPrompt />
                </div>
              </div>
            </header>

            <div>{children}</div>

            <footer className="border-t border-border/60 bg-[linear-gradient(180deg,rgba(255,249,241,0.92),rgba(252,243,224,0.88))]">
              <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
                <div className="grid gap-8 border-t border-border/60 pt-8 sm:grid-cols-[1.3fr_0.7fr] sm:gap-12 sm:pt-10">
                  <div className="max-w-xl space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">
                      {SITE_NAME}
                    </p>
                    <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                      Pedido rápido pelo WhatsApp, localização salva e um fluxo direto para montar
                      o pedido sem ruído.
                    </p>
                    <p className="text-xs text-muted-foreground/90 sm:text-sm">
                      {new Date().getFullYear()} {SITE_NAME}.
                    </p>
                  </div>

                  <div className="space-y-4 sm:justify-self-end sm:text-right">
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">
                        Contato
                      </p>
                      <a
                        href={INSTAGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground sm:justify-end"
                      >
                        <Instagram className="size-4" />
                        {INSTAGRAM_HANDLE}
                      </a>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">
                        Créditos
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground sm:justify-end">
                        <a
                          href={DEV_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition hover:text-foreground"
                        >
                          {DEV_HANDLE}
                        </a>
                        <a
                          href={DEV_SITE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 transition hover:text-foreground"
                        >
                          <Globe className="size-4" />
                          {DEV_SITE_LABEL}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </AnalyticsProvider>

        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
