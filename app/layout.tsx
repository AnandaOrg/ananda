import type { Metadata } from "next";
import { Geist, Geist_Mono, Anek_Kannada, IBM_Plex_Mono, Barlow } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anekKannada = Anek_Kannada({
  variable: "--font-display",
  weight: ["600", "700"],
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono-label",
  weight: "500",
  subsets: ["latin"],
});

const barlow = Barlow({
  variable: "--font-body",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ANANDA Cocktails",
  description: "ANANDA Cocktails",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${anekKannada.variable} ${ibmPlexMono.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
