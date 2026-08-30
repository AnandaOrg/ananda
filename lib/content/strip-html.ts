/** Derives a plain-text label (e.g. for an `aria-label`) from a sanitized
 *  rich-text value. Content already passed through the backoffice's
 *  sanitize-html allowlist, so a tag-strip is sufficient here. */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}
