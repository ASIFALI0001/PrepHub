"use client";

/* VS Code Dark+ theme syntax highlighter for Java */

const KEYWORDS = new Set([
  "abstract","assert","boolean","break","byte","case","catch","char","class",
  "continue","default","do","double","else","enum","extends","final","finally",
  "float","for","if","implements","import","instanceof","int","interface","long",
  "native","new","null","package","private","protected","public","return","short",
  "static","strictfp","super","switch","synchronized","this","throw","throws",
  "transient","true","false","try","void","volatile","while",
]);

const TYPES = new Set([
  "String","Integer","Long","Double","Float","Boolean","Character","Object",
  "List","ArrayList","LinkedList","HashMap","HashSet","LinkedHashMap","TreeMap",
  "Map","Set","Queue","Deque","ArrayDeque","PriorityQueue","Stack","Arrays",
  "Math","System","StringBuilder","StringBuffer","Collections","Comparator",
  "Optional","Iterator","Scanner","Number",
]);

type Token = { type: string; value: string };

const COLORS: Record<string, string> = {
  keyword:    "#569cd6",   // blue
  type:       "#4ec9b0",   // teal
  string:     "#ce9178",   // orange-brown
  number:     "#b5cea8",   // light green
  comment:    "#6a9955",   // green
  method:     "#dcdcaa",   // yellow
  identifier: "#9cdcfe",   // light blue
  annotation: "#c586c0",   // pink
  operator:   "#d4d4d4",   // white-gray
  text:       "#d4d4d4",   // white-gray
};

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // Line comment
    if (line[i] === "/" && line[i + 1] === "/") {
      tokens.push({ type: "comment", value: line.slice(i) });
      return tokens;
    }

    // String literal
    if (line[i] === '"') {
      let j = i + 1;
      while (j < line.length && line[j] !== '"') {
        if (line[j] === "\\") j++;
        j++;
      }
      tokens.push({ type: "string", value: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Annotation
    if (line[i] === "@") {
      let j = i + 1;
      while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
      tokens.push({ type: "annotation", value: line.slice(i, j) });
      i = j;
      continue;
    }

    // Number
    if (/\d/.test(line[i]) && (i === 0 || !/[a-zA-Z_$]/.test(line[i - 1]))) {
      let j = i;
      while (j < line.length && /[\d.LlFf]/.test(line[j])) j++;
      tokens.push({ type: "number", value: line.slice(i, j) });
      i = j;
      continue;
    }

    // Word (keyword / type / method / identifier)
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      const after = line.slice(j).trimStart();

      let type = "identifier";
      if (KEYWORDS.has(word))            type = "keyword";
      else if (TYPES.has(word))          type = "type";
      else if (after.startsWith("("))    type = "method";
      else if (/^[A-Z]/.test(word))     type = "type";

      tokens.push({ type, value: word });
      i = j;
      continue;
    }

    // Everything else (operators, brackets, semicolons…)
    tokens.push({ type: "text", value: line[i] });
    i++;
  }

  return tokens;
}

export default function DSACodeBlock({ code }: { code: string }) {
  const lines = code.split("\n");

  return (
    <div className="rounded-xl overflow-hidden border border-[#3c3c3c] text-[13px] font-mono leading-[1.6]">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#252526] border-b border-[#3c3c3c]">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57]"/>
        <span className="w-3 h-3 rounded-full bg-[#febc2e]"/>
        <span className="w-3 h-3 rounded-full bg-[#28c840]"/>
        <span className="ml-2 text-[11px] text-[#858585]">Solution.java</span>
      </div>

      {/* Code area */}
      <div className="overflow-x-auto bg-[#1e1e1e]">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const tokens = tokenizeLine(line);
              return (
                <tr key={idx} className="hover:bg-[#2a2d2e] transition-colors">
                  {/* Line number */}
                  <td className="select-none text-right pr-4 pl-4 py-0 text-[#858585] text-[12px] w-10 border-r border-[#3c3c3c] align-top">
                    {idx + 1}
                  </td>
                  {/* Code line */}
                  <td className="pl-5 pr-4 py-0 whitespace-pre align-top">
                    {tokens.length === 0 ? (
                      <span>&nbsp;</span>
                    ) : (
                      tokens.map((tok, ti) => (
                        <span key={ti} style={{ color: COLORS[tok.type] ?? COLORS.text }}>
                          {tok.value}
                        </span>
                      ))
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
