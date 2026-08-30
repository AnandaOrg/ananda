import Link from "next/link";
import { getDb } from "@/db/client";
import { contentEntries } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import BackofficeHeader from "./BackofficeHeader";

export default async function BackofficeDashboard() {
  const session = await getSession();
  const db = getDb();
  const rows = await db.selectDistinct({ namespace: contentEntries.namespace }).from(contentEntries);
  const namespaces = rows.map((r) => r.namespace).sort();

  return (
    <div>
      <BackofficeHeader email={session?.email} />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h2 className="mb-6 text-base font-semibold text-neutral-700">Media</h2>
        <Link
          href="/gh-zoom/media"
          className="mb-10 block w-fit rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium hover:border-neutral-400"
        >
          Manage images
        </Link>

        <h2 className="mb-6 text-base font-semibold text-neutral-700">Users</h2>
        <Link
          href="/gh-zoom/users"
          className="mb-10 block w-fit rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium hover:border-neutral-400"
        >
          Manage users
        </Link>

        <h2 className="mb-6 text-base font-semibold text-neutral-700">Content sections</h2>
        {namespaces.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No content yet — run <code className="rounded bg-neutral-200 px-1 py-0.5">pnpm db:seed</code> to load the
            site&apos;s existing copy.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {namespaces.map((ns) => (
              <li key={ns}>
                <Link
                  href={`/gh-zoom/${ns}`}
                  className="block rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium capitalize hover:border-neutral-400"
                >
                  {ns}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
