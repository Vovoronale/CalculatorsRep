import { REPORT_SYMBOLS, reportSymbolToLatex } from "./report-notation";

export type ParsedFormulaLine = {
  source: string;
  latex: string;
};

export type ParseReportFormulaResult =
  | { ok: true; lines: ParsedFormulaLine[] }
  | { ok: false; reason: string };

const MATH_START_PATTERN =
  /^(?:[-+()[\]]|\d|[A-Za-zØΣА-Яа-яІіЇїЄєҐґλσγφ][A-Za-zØΣА-Яа-яІіЇїЄєҐґ0-9_,./′-]*)/u;
const SYMBOL_PATTERN = /[A-Za-zØΣλσγφ][A-Za-zØΣλσγφ0-9_,.′/-]*/gu;
const REPORT_SYMBOL_PATTERN = new RegExp(
  REPORT_SYMBOLS.map((symbol) => symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "gu",
);
const FORMULA_OPERATOR_PATTERN = /(=|<=|>=|<|>|\+|-|\*|\/|\(|\[)/u;
const UNIT_PATTERN = /(\d(?:[.,]\d+)?)\s(кПа|т\/м²|кг\/см²|мм²|см²|МПа|кН\/м²|кН|м)(?=$|\s=|;|\)|\])/gu;
const EXPLANATORY_SUFFIX_PATTERNS = [
  ", оскільки",
  " - умова виконується",
  " - умова не виконується",
];

function splitStatements(formula: string): string[] {
  const statements: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < formula.length; index += 1) {
    const char = formula[index];

    if (char === "(" || char === "[") depth += 1;
    if (char === ")" || char === "]") depth = Math.max(0, depth - 1);

    if (char === ";" && formula[index + 1] === " " && depth === 0) {
      statements.push(formula.slice(start, index).trim());
      start = index + 2;
      index += 1;
    }
  }

  statements.push(formula.slice(start).trim());

  return statements.filter(Boolean);
}

function splitExplanatorySuffix(line: string): { math: string; suffix: string } {
  for (const marker of EXPLANATORY_SUFFIX_PATTERNS) {
    const index = line.indexOf(marker);
    if (index !== -1) {
      return {
        math: line.slice(0, index).trim(),
        suffix: line.slice(index),
      };
    }
  }

  return { math: line, suffix: "" };
}

function escapeLatexText(text: string): string {
  return text.replace(/\\/g, "\\textbackslash{}").replace(/[{}]/g, (match) => `\\${match}`);
}

function unitToLatex(unit: string): string {
  if (unit.endsWith("²")) {
    return `\\text{${escapeLatexText(unit.slice(0, -1))}}^2`;
  }

  return `\\text{${escapeLatexText(unit)}}`;
}

function convertUnits(latex: string): string {
  return latex.replace(
    UNIT_PATTERN,
    (_match, value: string, unit: string) => `${value}\\ ${unitToLatex(unit)}`,
  );
}

function convertSymbols(latex: string): string {
  const placeholders = new Map<string, string>();
  let placeholderIndex = 0;

  const withKnownSymbols = latex.replace(REPORT_SYMBOL_PATTERN, (symbol) => {
    const placeholder = `@@REPORT_SYMBOL_${placeholderIndex}@@`;
    placeholderIndex += 1;
    placeholders.set(placeholder, reportSymbolToLatex(symbol));
    return placeholder;
  });

  const converted = withKnownSymbols.replace(SYMBOL_PATTERN, (symbol) => {
    if (/^\d/.test(symbol)) return symbol;
    if (["min", "max"].includes(symbol)) return `\\${symbol}`;
    if (symbol === "pi") return "\\pi";
    return reportSymbolToLatex(symbol);
  });

  return [...placeholders.entries()].reduce(
    (result, [placeholder, symbolLatex]) => result.replace(placeholder, symbolLatex),
    converted,
  );
}

function convertFractions(latex: string): string {
  return latex.replace(
    /\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g,
    (_match, numerator: string, denominator: string) =>
      `\\frac{${numerator.trim()}}{${denominator.trim()}}`,
  );
}

function convertOperators(latex: string): string {
  return latex
    .replace(/<=/g, "\\le")
    .replace(/>=/g, "\\ge")
    .replace(/=>/g, "\\Rightarrow")
    .replace(/\*/g, "\\cdot")
    .replace(/\[/g, "\\left[")
    .replace(/\]/g, "\\right]");
}

function convertFunctionSeparators(latex: string): string {
  return latex.replace(/\\(min|max)\(([^)]+)\)/g, (_match, fn: string, body: string) => {
    const args = body.replace(/;\s*/g, ";\\ ");
    return `\\${fn}\\left(${args}\\right)`;
  });
}

function lineToLatex(source: string): string {
  const { math, suffix } = splitExplanatorySuffix(source);
  let latex = math;

  latex = convertSymbols(latex);
  latex = convertFractions(latex);
  latex = convertOperators(latex);
  latex = convertFunctionSeparators(latex);
  latex = convertUnits(latex);

  if (suffix) {
    latex += `\\text{${escapeLatexText(suffix)}}`;
  }

  return latex;
}

export function parseReportFormula(formula: string): ParseReportFormulaResult {
  const trimmed = formula.trim();

  if (!MATH_START_PATTERN.test(trimmed)) {
    return {
      ok: false,
      reason: "Formula does not start with a supported mathematical token.",
    };
  }

  if (!FORMULA_OPERATOR_PATTERN.test(trimmed)) {
    return {
      ok: false,
      reason: "Formula does not start with a supported mathematical token.",
    };
  }

  const lines = splitStatements(trimmed);

  if (lines.length === 0) {
    return {
      ok: false,
      reason: "Formula is empty.",
    };
  }

  return {
    ok: true,
    lines: lines.map((source) => ({
      source,
      latex: lineToLatex(source),
    })),
  };
}
