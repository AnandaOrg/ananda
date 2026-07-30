import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Mono, Barlow } from "next/font/google";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import SwRegister from "./SwRegister";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "ANANDA Cocktails",
  description: "ANANDA Cocktails",
};

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
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <SwRegister />
      </body>
    </html>
  );
}
