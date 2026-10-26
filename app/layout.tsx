import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from '@vercel/speed-insights/next';

import { Geist, Geist_Mono, IBM_Plex_Mono, Barlow } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import SwRegister from "./SwRegister";
import { MediaProvider } from "./MediaProvider";
import { getMediaAssets, getMediaAssetsByCategory } from "@/lib/media/get-media-assets";
import { SITE_URL } from "./configs";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-HBNX982Z9W";

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
      card: "summary_large_image",
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

// Geist is only offered as an optional font choice in the backoffice rich-text
// editor; nothing above the fold uses it, so it must not compete with the hero for
// bandwidth (no preload).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

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
  const mediaAssets = await getMediaAssets();
  const mediaByCategory = await getMediaAssetsByCategory();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${anekKannada.variable} ${ibmPlexMono.variable} ${barlow.variable} ${golosDisplay.variable} ${golosBody.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Plain <script> (like the JSON-LD block below), not next/script: it runs while
            the HTML <head> is parsed — before any Next.js code, i.e. the same timing as
            `beforeInteractive` — and React hydrates it in place. An inline
            `<Script strategy="beforeInteractive">` is re-created by React on the client,
            which logs "Encountered a script tag while rendering React component". */}
        <script
          id="disable-scroll-restoration"
          dangerouslySetInnerHTML={{ __html: `if ("scrollRestoration" in history) { history.scrollRestoration = "manual"; }` }}
        />
        {/* Google Consent Mode v2: every storage signal denied before gtag.js loads, so
            GA runs cookieless (anonymous pings only) until a consent banner grants
            `analytics_storage` via gtag('consent', 'update', …). Must run before the
            tag, hence here in <head>. */}
        <script
          id="consent-default"
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied'
            });
          `,
          }}
        />
        <script
          type="application/ld+json"
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
        <NextIntlClientProvider>
          <MediaProvider assets={mediaAssets} byCategory={mediaByCategory}>
            {children}
          </MediaProvider>
        </NextIntlClientProvider>
        <SwRegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
