import { describe, expect, it } from "vitest";

import { parseDocxFormula } from "./math-parser";

describe("parseDocxFormula", () => {
  it("parses equality chains with symbols, units, and multiplication", () => {
    const source =
      "R = γc1 * γc2 / k * [Mγ * kz * b * γ11 + Mc * c11] = 162.82 кПа";
    const result = parseDocxFormula(source);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.statements).toHaveLength(1);
    expect(result.statements[0].source).toBe(source);
    expect(result.statements[0].expression.type).toBe("chain");
  });

  it("parses arithmetic precedence, powers, functions, and semicolon-separated formulas", () => {
    const result = parseDocxFormula(
      "As,1 = pi * Ø^2 / 4 = 78.54 мм²; lb,min = max(0.3 * lb,rqd; 10 * Ø; 100) = 100 мм",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.statements).toHaveLength(2);
    expect(result.statements[0].source).toBe("As,1 = pi * Ø^2 / 4 = 78.54 мм²");
    expect(result.statements[1].source).toBe(
      "lb,min = max(0.3 * lb,rqd; 10 * Ø; 100) = 100 мм",
    );
  });

  it("parses comparisons and implication", () => {
    const result = parseDocxFormula("d1 <= d => 1.2 <= 1.2 - умова виконується");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.statements[0].suffix).toBe(" - умова виконується");
    expect(result.statements[0].expression.type).toBe("chain");
    if (result.statements[0].expression.type !== "chain") {
      throw new Error("Expected chain expression");
    }
    expect(result.statements[0].expression.operators).toEqual(["<=", "=>", "<="]);
  });

  it("parses approximate equilibrium formulas", () => {
    const result = parseDocxFormula(
      "ΣMx = N_total * (y_R - b / 2) = 43.28 * (0.9647 - 0.9000) = 2.80 т·м ≈ Mx_base = 2.80 т·м",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.statements[0].expression.type).toBe("chain");
    if (result.statements[0].expression.type !== "chain") {
      throw new Error("Expected chain expression");
    }
    expect(result.statements[0].expression.operators).toEqual(["=", "=", "=", "≈", "="]);
  });

  it("captures common engineering symbol subscripts", () => {
    const result = parseDocxFormula("γc1 = 1.4; As,min = 5.85 см²; db,input = 1.5 м");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);

    const first = result.statements[0].expression;
    const second = result.statements[1].expression;
    const third = result.statements[2].expression;

    expect(first.type).toBe("chain");
    expect(second.type).toBe("chain");
    expect(third.type).toBe("chain");
    if (first.type !== "chain" || second.type !== "chain" || third.type !== "chain") {
      throw new Error("Expected chain expressions");
    }

    expect(first.parts[0]).toMatchObject({ type: "symbol", base: "γ", subscript: "c1" });
    expect(second.parts[0]).toMatchObject({ type: "symbol", base: "A", subscript: "s,min" });
    expect(third.parts[0]).toMatchObject({ type: "symbol", base: "d", subscript: "b,input" });
  });

  it("parses indexed delta adjustments", () => {
    const result = parseDocxFormula(
      "ΔS_raw = ΔS_3 + ΔS_compression = 0",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.statements[0].expression.type).toBe("chain");
    if (result.statements[0].expression.type !== "chain") {
      throw new Error("Expected chain expression");
    }
    expect(result.statements[0].expression.parts[0]).toMatchObject({
      type: "symbol",
      base: "Δ",
      subscript: "S,raw",
    });
  });

  it("parses a plus sign in the positive-adjustment subscript", () => {
    const result = parseDocxFormula("ΔS_+ = ΔS_t + ΔS_guillotine = 0");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.statements[0].expression.type).toBe("chain");
    if (result.statements[0].expression.type !== "chain") {
      throw new Error("Expected chain expression");
    }
    expect(result.statements[0].expression.parts[0]).toMatchObject({
      type: "symbol",
      base: "Δ",
      subscript: "S,+",
    });
  });

  it("parses score units used by category and group reports", () => {
    const result = parseDocxFormula(
      "ΔS_3 = 0 балів; S_tot,base = 1 бал; S_tot,A2 = 2 бали",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.statements).toHaveLength(3);
    for (const statement of result.statements) {
      expect(statement.expression.type).toBe("chain");
    }
  });

  it("parses underscore symbols and foundation pressure units", () => {
    const result = parseDocxFormula(
      "G_fund = γ * b * l * h_gr = 17.28 т; Mx_base = |Mx + Qy * h_fund| = 2.80 т·м; γ = 2.00 т/м³; P_lift = 20.2%",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.statements).toHaveLength(4);

    const [selfWeight, moment, unitWeight, upliftShare] = result.statements;
    expect(selfWeight.expression.type).toBe("chain");
    expect(moment.expression.type).toBe("chain");
    expect(unitWeight.expression.type).toBe("chain");
    expect(upliftShare.expression.type).toBe("chain");
    if (
      selfWeight.expression.type !== "chain" ||
      moment.expression.type !== "chain" ||
      unitWeight.expression.type !== "chain" ||
      upliftShare.expression.type !== "chain"
    ) {
      throw new Error("Expected chain expressions");
    }

    expect(selfWeight.expression.parts[0]).toMatchObject({
      type: "symbol",
      base: "G",
      subscript: "fund",
    });
    expect(moment.expression.parts[0]).toMatchObject({
      type: "symbol",
      base: "M",
      subscript: "x,base",
    });
    expect(unitWeight.expression.parts[1]).toMatchObject({ type: "unit", value: "т/м³" });
    expect(upliftShare.expression.parts[0]).toMatchObject({
      type: "symbol",
      base: "P",
      subscript: "lift",
    });
    expect(upliftShare.expression.parts[1]).toMatchObject({ type: "unit", value: "%" });
  });

  it("falls back for prose that is not a formula", () => {
    const result = parseDocxFormula("Приймаємо значення з таблиці без математичного виразу");

    expect(result).toEqual({
      ok: false,
      reason: "Formula does not contain a supported mathematical operator.",
    });
  });
});
