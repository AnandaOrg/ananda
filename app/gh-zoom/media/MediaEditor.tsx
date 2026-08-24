"use client";

import { useRef, useState } from "react";

type Item = { id: number; path: string; category: string; kind: "image" | "mask"; blobUrl: string; active: boolean; link: string | null };

export default function MediaEditor({ item }: { item: Item }) {
  const [url, setUrl] = useState(item.blobUrl);
  const [active, setActive] = useState(item.active);
  const [link, setLink] = useState(item.link ?? "");
  const [saved, setSaved] = useState({ active: item.active, link: item.link ?? "" });
  const [status, setStatus] = useState<"idle" | "saving" | "uploading" | "error">("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = active !== saved.active || link !== saved.link;

  async function save() {
    setStatus("saving");
    const res = await fetch(`/api/backoffice/media/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active, link: link || null }),
    });
    if (res.ok) {
      setSaved({ active, link });
      setStatus("idle");
    } else {
      setStatus("error");
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/backoffice/media/${item.id}/upload`, { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setUrl(data.url as string);
      setStatus("idle");
    } else {
      setStatus("error");
    }
    e.target.value = "";
  }

  return (
    <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-3">
      <div className="mb-2 flex h-28 items-center justify-center overflow-hidden rounded-md bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail for an arbitrary managed asset, not a page-content image */}
        <img src={url} alt="" className="max-h-full max-w-full object-contain" />
      </div>

      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate font-mono text-xs text-neutral-500" title={item.path}>
          {item.path}
        </span>
        {item.kind === "mask" && <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">mask</span>}
      </div>

      <label className="mb-2 flex items-center gap-2 text-xs text-neutral-700">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active
      </label>

      {item.kind === "image" && (
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Link (optional) — opens in a new tab"
          className="mb-2 w-full rounded-md border border-neutral-300 px-2 py-1 text-xs"
        />
      )}

      <div className="mt-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={status === "uploading"}
          className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
        >
          {status === "uploading" ? "Uploading…" : "Replace"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

        <button
          type="button"
          onClick={save}
          disabled={!dirty || status === "saving"}
          className="ml-auto rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
      </div>
      {status === "error" && <p className="mt-1 text-xs text-red-600">Something went wrong.</p>}
    </div>
  );
}
