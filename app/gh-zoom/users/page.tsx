import { getDb } from "@/db/client";
import { backofficeUsers } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import BackofficeHeader from "../BackofficeHeader";
import AddUserForm from "./AddUserForm";

export default async function UsersPage() {
  const session = await getSession();
  const db = getDb();
  const users = await db
    .select({ id: backofficeUsers.id, email: backofficeUsers.email, createdAt: backofficeUsers.createdAt })
    .from(backofficeUsers)
    .orderBy(backofficeUsers.createdAt);

  return (
    <div>
      <BackofficeHeader email={session?.email} />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h2 className="mb-6 text-base font-semibold text-neutral-700">Users</h2>

        <ul className="mb-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>
                {u.email}
                {u.email === session?.email && <span className="ml-2 text-xs text-neutral-400">(you)</span>}
              </span>
              <span className="text-xs text-neutral-400">{u.createdAt.toLocaleDateString()}</span>
            </li>
          ))}
        </ul>

        <AddUserForm />
      </main>
    </div>
  );
}
