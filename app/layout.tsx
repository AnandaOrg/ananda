import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Mono, Barlow, Inter } from "next/font/google";
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
// Cyrillic glyphs, so BG headlines/body fall through to Inter per-glyph.
const inter = Inter({
  variable: "--font-cyrillic",
  subsets: ["cyrillic"],
  display: "swap",
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
      className={`${geistSans.variable} ${geistMono.variable} ${anekKannada.variable} ${ibmPlexMono.variable} ${barlow.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <SwRegister />
      </body>
    </html>
  );
}
