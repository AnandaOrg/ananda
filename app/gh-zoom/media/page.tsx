import { getDb } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { isAddableCategory } from "@/lib/media/addable";
import BackofficeHeader from "../BackofficeHeader";
import MediaEditor from "./MediaEditor";
import AddMediaForm from "./AddMediaForm";

export default async function MediaPage() {
  const session = await getSession();
  const db = getDb();
  const rows = await db.select().from(mediaAssets);
  const items = rows.sort((a, b) => (a.category + a.path).localeCompare(b.category + b.path));

  const grouped = new Map<string, typeof items>();
  for (const item of items) {
    const list = grouped.get(item.category) ?? [];
    list.push(item);
    grouped.set(item.category, list);
  }

  return (
    <div>
      <BackofficeHeader email={session?.email} />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="mb-6 text-base font-semibold text-neutral-700">Media</h2>
        {grouped.size === 0 ? (
          <p className="text-sm text-neutral-500">
            No media yet — run <code className="rounded bg-neutral-200 px-1 py-0.5">pnpm db:seed-media</code>.
          </p>
        ) : (
          <div className="space-y-8">
            {[...grouped.entries()].map(([category, categoryItems]) => (
              <section key={category}>
                <h3 className="mb-3 text-sm font-semibold capitalize text-neutral-500">{category}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryItems.map((item) => (
                    <MediaEditor key={item.id} item={item} />
                  ))}
                  {isAddableCategory(category) && <AddMediaForm category={category} />}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
