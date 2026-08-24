import type { Run } from "@/app/manifesto-copy";

/** The manifesto field stores its rich text as constrained HTML (`<p>` per paragraph,
 *  `<u>` marking the emphasis runs `RevealStatement` renders in the small mono style —
 *  not literal underline). These convert between that HTML and the `Run[][]` shape
 *  `RevealStatement` expects. Sanitize on the way in before persisting. */

const ESCAPE_MAP: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
const UNESCAPE_MAP: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'" };

function escapeHtml(text: string): string {
  return text.replace(/[&<>]/g, (c) => ESCAPE_MAP[c]);
}

function unescapeHtml(text: string): string {
  return text.replace(/&(#39|amp|lt|gt|quot|apos);/g, (_, key) => UNESCAPE_MAP[key]);
}

export function parasToHtml(paras: Run[][]): string {
  return paras
    .map((runs) => `<p>${runs.map((r) => (r.underline ? `<u>${escapeHtml(r.text)}</u>` : escapeHtml(r.text))).join("")}</p>`)
    .join("");
}

function parseRuns(inner: string): Run[] {
  const runs: Run[] = [];
  const re = /<u[^>]*>([\s\S]*?)<\/u>|([^<]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner))) {
    const [, underlined, plain] = m;
    const text = unescapeHtml(underlined ?? plain ?? "");
    if (text) runs.push(underlined !== undefined ? { text, underline: true } : { text });
  }
  return runs;
}

export function htmlToParas(html: string): Run[][] {
  const paraMatches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
  const bodies = paraMatches.length ? paraMatches.map((m) => m[1]) : [html];
  return bodies.map(parseRuns).filter((runs) => runs.length > 0);
}

/** Mirrors the existing `MANIFESTO_MOBILE.en` behavior in manifesto-copy.ts: mobile
 *  joins the desktop paragraphs into a single flowing paragraph for English only. */
export function joinParasForMobile(paras: Run[][]): Run[][] {
  const R = (text: string, underline = false): Run => ({ text, underline });
  return [paras.reduce<Run[]>((acc, p, i) => (i === 0 ? [...p] : [...acc, R(" "), ...p]), [])];
}
