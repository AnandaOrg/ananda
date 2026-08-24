import { notFound } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { contentEntries, contentValues } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import BackofficeHeader from "../BackofficeHeader";
import ContentEditor from "../ContentEditor";

export default async function NamespaceEditorPage({ params }: { params: Promise<{ namespace: string }> }) {
  const { namespace } = await params;
  const session = await getSession();
  const db = getDb();

  const entries = await db.select().from(contentEntries).where(eq(contentEntries.namespace, namespace));
  if (entries.length === 0) notFound();

  const entryIds = entries.map((e) => e.id);
  const values = await db.select().from(contentValues).where(inArray(contentValues.entryId, entryIds));

  const items = entries
    .map((e) => {
      const rowsForEntry = values.filter((v) => v.entryId === e.id);
      return {
        id: e.id,
        key: e.key,
        format: e.format,
        en: rowsForEntry.find((v) => v.locale === "en")?.value ?? "",
        bg: rowsForEntry.find((v) => v.locale === "bg")?.value ?? "",
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));

  return (
    <div>
      <BackofficeHeader email={session?.email} />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h2 className="mb-6 text-base font-semibold capitalize text-neutral-700">{namespace}</h2>
        <ContentEditor items={items} />
      </main>
    </div>
  );
}
