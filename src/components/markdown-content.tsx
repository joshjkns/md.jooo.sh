import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ content }: { content: string }) {
  if (!content.trim()) {
    return <p className="font-mono text-[0.8rem] text-dim">Preview appears here.</p>;
  }

  return (
    <div className="markdown">
      <ReactMarkdown
        components={{
          a: ({ children, ...props }) => (
            <a {...props} rel="noreferrer" target="_blank">
              {children}
            </a>
          ),
        }}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
