import { Paragraph } from "docx";
import { describe, expect, it } from "vitest";

import { createDocxMathParagraphs, getDocxFormulaRenderMode } from "./math-docx";
import { parseDocxFormula } from "./math-parser";

describe("math-docx", () => {
  it("creates Word math paragraphs for parsed formulas", () => {
    const result = parseDocxFormula("R = γc1 * γc2 / k = 162.82 кПа");
    if (!result.ok) throw new Error(result.reason);

    const paragraphs = createDocxMathParagraphs(result.statements);

    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toBeInstanceOf(Paragraph);
    expect(getDocxFormulaRenderMode(result.statements)).toBe("math");
  });

  it("creates one paragraph per semicolon-separated formula", () => {
    const result = parseDocxFormula("γc1 = 1.4; γc2 = 1.2");
    if (!result.ok) throw new Error(result.reason);

    expect(createDocxMathParagraphs(result.statements)).toHaveLength(2);
  });

  it("handles powers, fractions, and functions without falling back to text", () => {
    const result = parseDocxFormula("lb,min = max(0.3 * lb,rqd; 10 * Ø; 100) = Ø^2 / 4");
    if (!result.ok) throw new Error(result.reason);

    expect(() => createDocxMathParagraphs(result.statements)).not.toThrow();
  });
});
