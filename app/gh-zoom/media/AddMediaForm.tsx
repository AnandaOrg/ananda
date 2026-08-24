"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function AddMediaForm({ category }: { category: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    const formData = new FormData();
    formData.append("category", category);
    formData.append("alt", alt);
    formData.append("file", file);
    const res = await fetch("/api/backoffice/media", { method: "POST", body: formData });
    if (res.ok) {
      setAlt("");
      setStatus("idle");
      router.refresh();
    } else {
      setStatus("error");
    }
    e.target.value = "";
  }

  return (
    <div className="flex flex-col rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3">
      <span className="mb-2 text-xs font-medium text-neutral-500">Add a new image</span>
      <input
        type="text"
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        placeholder="Description (alt text)"
        className="mb-2 w-full rounded-md border border-neutral-300 px-2 py-1 text-xs"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={status === "uploading"}
        className="mt-auto rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
      >
        {status === "uploading" ? "Uploading…" : "Choose image…"}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      {status === "error" && <p className="mt-1 text-xs text-red-600">Something went wrong.</p>}
    </div>
  );
}
