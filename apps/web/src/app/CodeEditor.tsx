"use client";

import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";

function languageExtension(language: string) {
  const lang = language.toLowerCase();
  if (lang.includes("python")) return python();
  if (lang.includes("typescript") || lang.includes("javascript") || lang === "js" || lang === "ts")
    return javascript({ typescript: lang.includes("ts") || lang.includes("typescript") });
  if (lang.includes("java")) return java();
  if (lang.includes("c++") || lang.includes("cpp")) return cpp();
  if (lang.includes("go")) return go();
  return python();
}

const theme = EditorView.theme(
  {
    "&": { backgroundColor: "#1e1c19", color: "#e8e3d9", fontSize: "12.5px" },
    ".cm-content": { fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", padding: "14px 0" },
    ".cm-gutters": { backgroundColor: "#1e1c19", color: "#7d766c", border: "none" },
    ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.03)" },
    ".cm-activeLineGutter": { backgroundColor: "rgba(255,255,255,0.03)" },
    "&.cm-focused": { outline: "none" },
  },
  { dark: true },
);

/** Shared CodeMirror 6 surface for both the manual-entry form and the read-only code viewer. */
export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  minHeight = "220px",
}: {
  value: string;
  onChange?: (value: string) => void;
  language: string;
  readOnly?: boolean;
  minHeight?: string;
}) {
  return (
    <div className="overflow-hidden rounded-b-btn border border-t-0 border-border">
      <CodeMirror
        value={value}
        onChange={onChange}
        editable={!readOnly}
        readOnly={readOnly}
        theme={theme}
        minHeight={minHeight}
        extensions={[languageExtension(language)]}
        basicSetup={{ foldGutter: false, highlightActiveLine: !readOnly }}
      />
    </div>
  );
}
