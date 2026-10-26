import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Minimal brand-styled 404 (same palette and type as /no-entry). Copy is not
 *  backoffice-managed: the content tables have no namespace for it, and a 404 page
 *  must render even when the DB is unreachable. */
export default function NotFound() {
  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center bg-[#eb4638] text-center text-[#fff0e5]" style={{ gap: 20, padding: 24 }}>
      <p className="uppercase" style={{ fontFamily: "var(--font-mono-label)", fontWeight: 500, fontSize: 13, letterSpacing: "0.08em", lineHeight: 1 }}>
        [ 404 ]
      </p>
      <h1 className="uppercase" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(32px, 6vw, 64px)", lineHeight: 1.05 }}>
        Nothing to sip here.
      </h1>
      <Link
        href="/"
        className="uppercase"
        style={{ fontFamily: "var(--font-mono-label)", fontWeight: 500, fontSize: 13, letterSpacing: "0.08em", lineHeight: 1, textDecoration: "underline", textUnderlineOffset: 4 }}
      >
        Back to ANANDA
      </Link>
    </main>
  );
}
