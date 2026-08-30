"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle, FontFamily, FontSize, Color } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";

const FONT_FAMILIES = [
  { label: "Default", value: null },
  { label: "Display (AnekKannada)", value: "var(--font-display)" },
  { label: "Body (Barlow)", value: "var(--font-body)" },
  { label: "Mono label (IBM Plex Mono)", value: "var(--font-mono-label)" },
  { label: "Geist Sans", value: "var(--font-geist-sans)" },
  { label: "Geist Mono", value: "var(--font-geist-mono)" },
] as const;

/** Steps are `em`, not `px` — relative to whatever the field's own responsive
 *  (u()/mu()-scaled) computed size already is, so a size bump still scales with
 *  the viewport instead of freezing to one breakpoint. */
const FONT_SIZES = [
  { label: "Default", value: null },
  { label: "Small", value: "0.75em" },
  { label: "Large", value: "1.25em" },
  { label: "X-Large", value: "1.5em" },
] as const;

function IconBold() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 4h8a4 4 0 0 1 0 8H6z" />
      <path d="M6 12h9a4 4 0 0 1 0 8H6z" />
    </svg>
  );
}

function IconItalic() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}

function IconUnderline() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 3v7a6 6 0 0 0 12 0V3" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  );
}

function IconStrike() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 6.5C7 4.6 9 4 12 4s5 1 5 2.5" />
      <path d="M8 19.5c0 1 1.3 1.5 4 1.5s5-.7 5-2.5c0-1.4-1-2-2.5-2.5" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 15l6-6" />
      <path d="M10.5 6.5l1-1a3.54 3.54 0 0 1 5 5l-1 1" />
      <path d="M13.5 17.5l-1 1a3.54 3.54 0 0 1-5-5l1-1" />
    </svg>
  );
}

function IconClear() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 5h16" />
      <path d="M12 5v14" />
      <path d="M6.5 19l11-14" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
      <line x1="4" y1="4" x2="20" y2="20" />
      <line x1="20" y1="4" x2="4" y2="20" />
    </svg>
  );
}

type ToolbarButtonProps = {
  active?: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({ active, disabled, title, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex size-7 items-center justify-center rounded-md transition-colors ${
        active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-transparent"
      }`}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">{children}</span>;
}

function ToolbarSelect({
  label,
  title,
  value,
  options,
  onChange,
}: {
  label: string;
  title: string;
  value: string | null;
  options: readonly { label: string; value: string | null }[];
  onChange: (value: string | null) => void;
}) {
  return (
    <span className="flex items-center gap-1 rounded-md px-1 hover:bg-neutral-200">
      <FieldLabel>{label}</FieldLabel>
      <select
        title={title}
        aria-label={title}
        value={value ?? ""}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-7 rounded-md border-0 bg-transparent pr-1 text-xs text-neutral-600 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.label} value={opt.value ?? ""}>
            {opt.label}
          </option>
        ))}
      </select>
    </span>
  );
}

function ColorPicker({
  label,
  title,
  value,
  fallback,
  onChange,
  onClear,
}: {
  label: string;
  title: string;
  value: string | null;
  fallback: string;
  onChange: (color: string) => void;
  onClear: () => void;
}) {
  return (
    <span className="flex items-center gap-0.5 rounded-md pl-1 pr-0.5 hover:bg-neutral-200">
      <FieldLabel>{label}</FieldLabel>
      <label className="relative flex size-7 cursor-pointer items-center justify-center" title={title}>
        <span
          aria-hidden
          className="size-3.5 rounded-full border border-neutral-400"
          style={{ backgroundColor: value ?? fallback }}
        />
        <input
          type="color"
          aria-label={title}
          value={value ?? fallback}
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      {value && (
        <button type="button" title={`Clear ${title.toLowerCase()}`} aria-label={`Clear ${title.toLowerCase()}`} onMouseDown={(e) => e.preventDefault()} onClick={onClear} className="text-neutral-400 hover:text-neutral-700">
          <IconX />
        </button>
      )}
    </span>
  );
}

/** WYSIWYG for paragraph-style body copy — inline marks only (bold, italic,
 *  underline, strikethrough, links, font family/size/color/highlight).
 *  Deliberately no headings/lists/block elements: every call site is a
 *  fixed-width, absolutely-positioned (often `whitespace-nowrap`) line of
 *  marketing copy — block-level markup would break the layout, not just the
 *  sanitizer allowlist. Font family is restricted to the site's own loaded
 *  tokens (see FONT_FAMILIES above) and font size
 *  is expressed in `em` so both stay in sync with the existing responsive
 *  scaling; the PATCH route enforces both restrictions server-side too, since
 *  the toolbar UI alone isn't a security boundary. The sanitized HTML this
 *  produces is rendered via `dangerouslySetInnerHTML` at the site's render
 *  call sites (see the PATCH route's RICH_OPTIONS for the matching allowlist). */
export default function RichTextEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        orderedList: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        hardBreak: false,
        code: false,
        link: { openOnClick: false, HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" } },
      }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor?.isActive("bold") ?? false,
      italic: ctx.editor?.isActive("italic") ?? false,
      underline: ctx.editor?.isActive("underline") ?? false,
      strike: ctx.editor?.isActive("strike") ?? false,
      link: ctx.editor?.isActive("link") ?? false,
      linkHref: (ctx.editor?.getAttributes("link").href as string | undefined) ?? "",
      fontFamily: (ctx.editor?.getAttributes("textStyle").fontFamily as string | undefined) ?? null,
      fontSize: (ctx.editor?.getAttributes("textStyle").fontSize as string | undefined) ?? null,
      color: (ctx.editor?.getAttributes("textStyle").color as string | undefined) ?? null,
      highlight: (ctx.editor?.getAttributes("highlight").color as string | undefined) ?? null,
    }),
  }) ?? {
    bold: false, italic: false, underline: false, strike: false, link: false, linkHref: "",
    fontFamily: null, fontSize: null, color: null, highlight: null,
  };

  if (!editor) return null;

  const toggleLink = () => {
    if (state.link) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("Link URL", state.linkHref || "https://");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const clearFormatting = () => editor.chain().focus().unsetAllMarks().run();

  const hasFormatting = state.bold || state.italic || state.underline || state.strike || state.link ||
    state.fontFamily || state.fontSize || state.color || state.highlight;

  return (
    <div className="overflow-hidden rounded-md border border-neutral-300 focus-within:border-neutral-400 focus-within:ring-1 focus-within:ring-neutral-400">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-neutral-200 bg-neutral-50 px-2 py-1">
        <span className="px-1 text-xs text-neutral-500">{label}</span>
        <div className="flex flex-wrap items-center gap-0.5">
          <ToolbarButton title="Bold (Ctrl+B)" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
            <IconBold />
          </ToolbarButton>
          <ToolbarButton title="Italic (Ctrl+I)" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <IconItalic />
          </ToolbarButton>
          <ToolbarButton title="Underline (Ctrl+U)" active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <IconUnderline />
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <IconStrike />
          </ToolbarButton>
          <div className="mx-1 h-4 w-px bg-neutral-300" />
          <ToolbarButton title={state.link ? "Remove link" : "Add link"} active={state.link} onClick={toggleLink}>
            <IconLink />
          </ToolbarButton>
          <div className="mx-1 h-4 w-px bg-neutral-300" />
          <ToolbarSelect
            label="Font"
            title="Font family"
            value={state.fontFamily}
            options={FONT_FAMILIES}
            onChange={(v) => (v ? editor.chain().focus().setFontFamily(v).run() : editor.chain().focus().unsetFontFamily().run())}
          />
          <ToolbarSelect
            label="Size"
            title="Font size"
            value={state.fontSize}
            options={FONT_SIZES}
            onChange={(v) => (v ? editor.chain().focus().setFontSize(v).run() : editor.chain().focus().unsetFontSize().run())}
          />
          <div className="mx-1 h-4 w-px bg-neutral-300" />
          <ColorPicker
            label="Color"
            title="Text color"
            value={state.color}
            fallback="#000000"
            onChange={(c) => editor.chain().focus().setColor(c).run()}
            onClear={() => editor.chain().focus().unsetColor().run()}
          />
          <ColorPicker
            label="Highlight"
            title="Highlight"
            value={state.highlight}
            fallback="#ffe999"
            onChange={(c) => editor.chain().focus().setHighlight({ color: c }).run()}
            onClear={() => editor.chain().focus().unsetHighlight().run()}
          />
          <div className="mx-1 h-4 w-px bg-neutral-300" />
          <ToolbarButton title="Clear formatting" disabled={!hasFormatting} onClick={clearFormatting}>
            <IconClear />
          </ToolbarButton>
        </div>
      </div>
      <EditorContent
        editor={editor}
        className="px-3 py-2 text-sm [&_.ProseMirror]:min-h-24 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_a]:text-blue-600 [&_.ProseMirror_a]:underline [&_.ProseMirror_mark]:rounded-sm [&_.ProseMirror_mark]:px-0.5"
      />
    </div>
  );
}
