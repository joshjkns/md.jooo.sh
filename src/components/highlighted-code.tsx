import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import plaintext from "highlight.js/lib/languages/plaintext";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("plaintext", plaintext);
hljs.registerLanguage("python", python);
hljs.registerLanguage("typescript", typescript);

const languageAliases: Record<string, string> = {
  shell: "bash",
  text: "plaintext",
};

export function HighlightedCode({ code, language }: { code: string; language: string }) {
  const resolvedLanguage = languageAliases[language] ?? language;
  const highlighted = hljs.getLanguage(resolvedLanguage)
    ? hljs.highlight(code, { language: resolvedLanguage }).value
    : hljs.highlightAuto(code).value;

  return (
    <pre className="highlighted-code overflow-x-auto whitespace-pre-wrap break-words">
      <code
        className={`hljs language-${resolvedLanguage}`}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </pre>
  );
}
