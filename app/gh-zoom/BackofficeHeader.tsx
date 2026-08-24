"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BackofficeHeader({ email }: { email?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    await fetch("/api/backoffice/auth/logout", { method: "POST" });
    router.push("/gh-zoom/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
      <Link href="/gh-zoom" className="text-sm font-semibold">
        ANANDA Backoffice
      </Link>
      <div className="flex items-center gap-4 text-sm text-neutral-500">
        {email && <span>{email}</span>}
        <button
          type="button"
          onClick={onLogout}
          disabled={loading}
          className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          {loading ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </header>
  );
}
