export type MarkdownEdit = {
  content: string;
  selectionStart: number;
  selectionEnd: number;
};

export function insertMarkdown(
  content: string,
  start: number,
  end: number,
  prefix: string,
  suffix = "",
  placeholder = "text",
): MarkdownEdit {
  const selected = content.slice(start, end) || placeholder;
  const replacement = `${prefix}${selected}${suffix}`;
  const placeholderStart = start + prefix.length;

  return {
    content: `${content.slice(0, start)}${replacement}${content.slice(end)}`,
    selectionStart: placeholderStart,
    selectionEnd: placeholderStart + selected.length,
  };
}
