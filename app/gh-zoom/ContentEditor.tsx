"use client";

import { useState } from "react";
import ManifestoEditor from "./ManifestoEditor";
import RichTextEditor from "./RichTextEditor";

type Item = { id: number; key: string; format: "plain" | "rich" | "emphasis"; en: string; bg: string };

function Row({ item }: { item: Item }) {
  const [en, setEn] = useState(item.en);
  const [bg, setBg] = useState(item.bg);
  const [saved, setSaved] = useState({ en: item.en, bg: item.bg });
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  const dirty = en !== saved.en || bg !== saved.bg;

  async function save() {
    setStatus("saving");
    const res = await fetch(`/api/backoffice/content/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ en, bg }),
    });
    if (res.ok) {
      setSaved({ en, bg });
      setStatus("idle");
    } else {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="truncate font-mono text-xs text-neutral-500">{item.key}</span>
        <div className="flex shrink-0 items-center gap-2">
          {status === "error" && <span className="text-xs text-red-600">Failed to save</span>}
          {!dirty && status === "idle" && <span className="text-xs text-neutral-400">Saved</span>}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || status === "saving"}
            className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
          >
            {status === "saving" ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {item.format === "emphasis" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ManifestoEditor label="English" value={en} onChange={setEn} />
          <ManifestoEditor label="Bulgarian" value={bg} onChange={setBg} />
        </div>
      ) : item.format === "rich" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <RichTextEditor label="English" value={en} onChange={setEn} />
          <RichTextEditor label="Bulgarian" value={bg} onChange={setBg} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-neutral-500">English</span>
            <textarea
              value={en}
              onChange={(e) => setEn(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-neutral-500">Bulgarian</span>
            <textarea
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      )}
    </div>
  );
}

export default function ContentEditor({ items }: { items: Item[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Row key={item.id} item={item} />
      ))}
    </div>
  );
}
