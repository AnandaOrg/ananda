/** Flattens a nested next-intl messages object into `"namespace.key.path"` → value
 *  pairs (top-level key = namespace, everything after = the dot-path key). */
export function flattenMessages(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      out[path] = v;
    } else if (v && typeof v === "object") {
      Object.assign(out, flattenMessages(v as Record<string, unknown>, path));
    }
  }
  return out;
}

/** Inverse of `flattenMessages`: writes `value` at the given dot-path inside `target`,
 *  creating intermediate objects as needed. */
export function setDeep(target: Record<string, unknown>, path: string, value: string): void {
  const parts = path.split(".");
  let node = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const next = node[p];
    if (typeof next !== "object" || next === null) {
      node[p] = {};
    }
    node = node[p] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
}
