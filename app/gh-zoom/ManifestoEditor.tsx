"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

/** Restricted-toolbar WYSIWYG for the manifesto body. Only paragraphs + one
 *  "emphasis" toggle (underline mark) are exposed — that's all RevealStatement
 *  understands (paragraphs, and a `Run.underline` flag rendered in a small mono
 *  style). Bold/italic/links/lists are disabled since nothing downstream renders
 *  them; exposing them would mislead the admin into thinking they do something. */
export default function ManifestoEditor({
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
        bold: false,
        italic: false,
        code: false,
        link: false,
        strike: false,
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const isUnderlineActive = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.isActive("underline") ?? false,
  });

  if (!editor) return null;

  return (
    <div className="rounded-md border border-neutral-300">
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-1.5">
        <span className="text-xs text-neutral-500">{label}</span>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`rounded px-2 py-0.5 text-xs font-medium underline ${
            isUnderlineActive ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          Emphasis
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="px-3 py-2 text-sm [&_.ProseMirror]:min-h-24 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:mb-2"
      />
    </div>
  );
}
