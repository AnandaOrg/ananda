import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from '@vercel/speed-insights/next';

import { Geist, Geist_Mono, IBM_Plex_Mono, Barlow } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import SwRegister from "./SwRegister";
import { SITE_URL } from "./configs";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-HBNX982Z9W";

// Only the production deployment should tell crawlers to index — Vercel
// preview URLs would otherwise compete with the real domain as duplicate
// content. Mirrors the same check in app/robots.ts.
const isProduction = process.env.VERCEL_ENV === "production";

const DESCRIPTION =
  "Premium, bar-strength canned cocktails mixed for the makers, the movers, and the midnight sun. No glass, no pretense — just pure, uninhibited joy, ready wherever you are.";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ANANDA Cocktails",
  url: SITE_URL,
  logo: `${SITE_URL}/ananda-logo.svg`,
  sameAs: [
    "https://www.instagram.com/ananda_cocktails_bg/",
    "https://www.facebook.com/anandacocktails.eu/",
    "https://www.linkedin.com/company/ananda-cocktails",
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const ogLocale = locale === "bg" ? "bg_BG" : "en_US";
  const alternateOgLocale = locale === "bg" ? "en_US" : "bg_BG";
  const title = "ANANDA Cocktails — Premium Canned Cocktails";

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: "%s | ANANDA Cocktails",
    },
    description: DESCRIPTION,
    keywords: [
      "ANANDA Cocktails",
      "canned cocktails",
      "ready to drink cocktails",
      "RTD cocktails",
      "pouch cocktails",
      "premium cocktails",
    ],
    applicationName: "ANANDA Cocktails",
    icons: {
      icon: [
        { url: "/favicon/favicon.ico", sizes: "any" },
        { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    manifest: "/favicon/site.webmanifest",
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      url: "/",
      siteName: "ANANDA Cocktails",
      title,
      description: DESCRIPTION,
      locale: ogLocale,
      alternateLocale: alternateOgLocale,
    },
    twitter: {
      card: "summary",
      title,
      description: DESCRIPTION,
    },
    robots: isProduction
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff0e5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Latin-only primaries: globals.css composes the public --font-display /
// --font-body stacks from these plus the Cyrillic fallback below.
const anekKannada = localFont({
  src: [
    {
      path: "./fonts/AnekKannada-latin-ext.woff2",
      style: "normal",
    },
    {
      path: "./fonts/AnekKannada-latin.woff2",
      style: "normal",
    },
  ],
  variable: "--font-display-latin",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono-label",
  weight: "500",
  subsets: ["latin", "cyrillic"],
});

const barlow = Barlow({
  variable: "--font-body-latin",
  weight: ["400", "500"],
  subsets: ["latin"],
});

// Cyrillic fallback for the BG locale — AnekKannada and Barlow have no
// Cyrillic glyphs, so BG text falls through per-glyph to Golos Text (the
// self-hosted cyrillic-subset file; unicode-range keeps Latin on Anek/Barlow).
// Golos renders larger than both primaries at equal font-size, so each stack
// gets its own metric-matched face (measured with fontTools):
//   display: Anek cap-height 0.639em vs Golos 0.700em → size-adjust 91.29%
//   body:    Barlow x-height 0.506em vs Golos 0.530em → size-adjust 95.47%
// Same file twice — one download, two @font-face rules. (next/font requires
// fully literal arguments, hence the repeated unicode-range value.)
const golosDisplay = localFont({
  src: "./fonts/GolosText-cyrillic.woff2",
  weight: "400 900",
  variable: "--font-cyrillic-display",
  display: "swap",
  declarations: [
    { prop: "size-adjust", value: "91.29%" },
    { prop: "unicode-range", value: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116" },
  ],
});

const golosBody = localFont({
  src: "./fonts/GolosText-cyrillic.woff2",
  weight: "400 900",
  variable: "--font-cyrillic-body",
  display: "swap",
  declarations: [
    { prop: "size-adjust", value: "95.47%" },
    { prop: "unicode-range", value: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116" },
  ],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${anekKannada.variable} ${ibmPlexMono.variable} ${barlow.variable} ${golosDisplay.variable} ${golosBody.variable} h-full antialiased`}
      // AgeGate's inline script tags <html> with `.age-ok` during parse (before
      // hydration) when this tab's session already accepted — an intentional
      // attribute delta React must leave in place, not warn about.
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          // Static, build-time JSON — not user input, so no injection risk.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <SwRegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
