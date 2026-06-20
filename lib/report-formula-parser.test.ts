import { describe, expect, it } from "vitest";

import { parseReportFormula } from "./report-formula-parser";
import { reportSymbolToLatex } from "./report-notation";

describe("reportSymbolToLatex", () => {
  it("maps shared engineering notation to LaTeX", () => {
    expect(reportSymbolToLatex("Mγ")).toBe("M_{\\gamma}");
    expect(reportSymbolToLatex("Mγ,a")).toBe("M_{\\gamma,a}");
    expect(reportSymbolToLatex("Mq")).toBe("M_q");
    expect(reportSymbolToLatex("Mc")).toBe("M_c");
    expect(reportSymbolToLatex("φ11")).toBe("\\varphi_{11}");
    expect(reportSymbolToLatex("φa")).toBe("\\varphi_a");
    expect(reportSymbolToLatex("γc1")).toBe("\\gamma_{c1}");
    expect(reportSymbolToLatex("γ′11")).toBe("\\gamma'_{11}");
    expect(reportSymbolToLatex("As,min,1")).toBe("A_{s,min,1}");
    expect(reportSymbolToLatex("db,input")).toBe("d_{b,input}");
    expect(reportSymbolToLatex("L/H")).toBe("\\frac{L}{H}");
  });

  it("keeps concrete exposure class labels as uppercase class tokens", () => {
    expect(reportSymbolToLatex("XC")).toBe("\\mathrm{XC}");
    expect(reportSymbolToLatex("XC1")).toBe("\\mathrm{XC1}");
    expect(reportSymbolToLatex("XD3")).toBe("\\mathrm{XD3}");
    expect(reportSymbolToLatex("XS2")).toBe("\\mathrm{XS2}");
    expect(reportSymbolToLatex("XF4")).toBe("\\mathrm{XF4}");
    expect(reportSymbolToLatex("XA1")).toBe("\\mathrm{XA1}");
    expect(reportSymbolToLatex("X0")).toBe("\\mathrm{X0}");
  });
});

describe("parseReportFormula", () => {
  it("renders table E8 interpolation formulas as separate LaTeX lines with fractions", () => {
    const formula =
      "Mγ = Mγ,a + (Mγ,b - Mγ,a) * (φ11 - φa) / (φb - φa) = 1.15 + (1.24 - 1.15) * (30.01 - 30) / (31 - 30) = 1.15; Mq = Mq,a + (Mq,b - Mq,a) * (φ11 - φa) / (φb - φa) = 5.59 + (5.95 - 5.59) * (30.01 - 30) / (31 - 30) = 5.59; Mc = Mc,a + (Mc,b - Mc,a) * (φ11 - φa) / (φb - φa) = 7.95 + (8.24 - 7.95) * (30.01 - 30) / (31 - 30) = 7.95";

    const result = parseReportFormula(formula);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.lines).toHaveLength(3);
    expect(result.lines[0].latex).toContain("M_{\\gamma}");
    expect(result.lines[0].latex).toContain(
      "\\frac{(M_{\\gamma,b} - M_{\\gamma,a}) \\cdot (\\varphi_{11} - \\varphi_a)}{(\\varphi_b - \\varphi_a)}",
    );
    expect(result.lines[1].latex).toContain("M_q");
    expect(result.lines[2].latex).toContain("M_c");
  });

  it("renders the R formula with brackets, multiplication, symbols, and units", () => {
    const formula =
      "R = γc1 * γc2 / k * [Mγ * kz * b * γ11 + Mq * d1 * γ′11 + (Mq - 1) * db * γ′11 + Mc * c11] = 1.4 * 1.2 / 1.1 * [1.15 * 1 * 2 * 18 + 5.59 * 1.5 * 19 + (5.59 - 1) * 0 * 19 + 7.95 * 10] = 433.61 кПа";

    const result = parseReportFormula(formula);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.lines[0].latex).toContain("R");
    expect(result.lines[0].latex).toContain("\\gamma_{c1}");
    expect(result.lines[0].latex).toContain("\\frac{\\gamma_{c1} \\cdot \\gamma_{c2}}{k}");
    expect(result.lines[0].latex).toContain("\\left[");
    expect(result.lines[0].latex).toContain("\\right]");
    expect(result.lines[0].latex).toContain("\\text{кПа}");
  });

  it("renders inline division as vertical fractions with numerator and denominator terms", () => {
    const result = parseReportFormula(
      "d1 = hs + hcf * γcf / γ′11 = 1.2 + 2.4 * 17 / 18 = 3.47 м",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.lines[0].latex).toContain(
      "d_1 = h_s +\\frac{h_{cf} \\cdot \\gamma_{cf}}{\\gamma'_{11}}",
    );
    expect(result.lines[0].latex).toContain("1.2 +\\frac{2.4 \\cdot 17}{18}");
  });

  it("renders squared units without leaving unicode superscripts in math mode", () => {
    const result = parseReportFormula("R = 162.82 кПа = 16.3 т/м² = 1.6 кг/см²");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.lines[0].latex).toContain("162.82\\ \\text{кПа}");
    expect(result.lines[0].latex).toContain("16.3\\ \\text{т/м}^2");
    expect(result.lines[0].latex).toContain("1.6\\ \\text{кг/см}^2");
    expect(result.lines[0].latex).not.toContain("²");
  });

  it("renders underscore engineering symbols and foundation pressure units", () => {
    const result = parseReportFormula(
      "G_fund = γ * b * l * h_gr = 2.00 * 1.80 * 2.40 * 2.00 = 17.28 т; Mx_base = |Mx + Qy * h_fund| = |2.00 + 0.500 * 1.60| = 2.80 т·м; γ = 2.00 т/м³; P_lift = c1 * c2 / (2 * b * l) * 100 = 0.2781 * 0.6927 / (2 * 1.80 * 2.40) * 100 = 20.2%",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    const latex = result.lines.map((line) => line.latex).join("\n");
    expect(latex).toContain("G_{fund}");
    expect(latex).toContain("h_{gr}");
    expect(latex).toContain("M_{x,base}");
    expect(latex).toContain("M_{x}");
    expect(latex).toContain("Q_{y}");
    expect(latex).toContain("h_{fund}");
    expect(latex).toContain("P_{lift}");
    expect(latex).toContain("c_{1}");
    expect(latex).toContain("\\text{т}");
    expect(latex).toContain("\\text{т·м}");
    expect(latex).toContain("\\text{т/м}^3");
    expect(latex).toContain("20.2\\%");
    expect(latex).not.toContain("G_fund");
    expect(latex).not.toContain("P_lift");
  });

  it("renders integral equilibrium formulas", () => {
    const result = parseReportFormula(
      "∫A p(x, y) dA = N_total; ∫A x * p(x, y) dA = N_total * x_R; ∫A y * p(x, y) dA = N_total * y_R",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    const latex = result.lines.map((line) => line.latex).join("\n");
    expect(latex).toContain("\\int_{A}");
    expect(latex).toContain("N_{total}");
    expect(latex).toContain("x_{R}");
    expect(latex).toContain("y_{R}");
  });

  it("renders approximate equilibrium formulas with units before the comparison", () => {
    const result = parseReportFormula(
      "ΣMx = N_total * (y_R - b / 2) = 43.28 * (0.9647 - 0.9000) = 2.80 т·м ≈ Mx_base = 2.80 т·м",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.lines[0].latex).toContain("\\Sigma_{Mx}");
    expect(result.lines[0].latex).toContain("\\approx");
    expect(result.lines[0].latex).toContain("2.80\\ \\text{т·м}");
    expect(result.lines[0].latex).toContain("M_{x,base}");
  });

  it("keeps explanatory suffixes as text", () => {
    const result = parseReportFormula(
      "k = 1.0, оскільки характеристики ґрунту прийняті за прямими випробуваннями",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.lines[0].latex).toBe(
      "k = 1.0\\text{, оскільки характеристики ґрунту прийняті за прямими випробуваннями}",
    );
  });

  it("renders min max and comparison implication operators", () => {
    const minMax = parseReportFormula(
      "As,min = max(As,min,1; As,min,2) = max(219.62 мм²; 195 мм²) = 219.62 мм²",
    );
    const comparison = parseReportFormula("d1 <= d => 1 <= 1.5");

    expect(minMax.ok).toBe(true);
    expect(comparison.ok).toBe(true);
    if (!minMax.ok || !comparison.ok) throw new Error("Expected supported formulas");
    expect(minMax.lines[0].latex).toContain("\\max");
    expect(minMax.lines[0].latex).toContain("A_{s,min}");
    expect(comparison.lines[0].latex).toContain("\\le");
    expect(comparison.lines[0].latex).toContain("\\Rightarrow");
  });

  it("renders concrete exposure formulas without subscripting the class group letter", () => {
    const result = parseReportFormula(
      "XC = f(вологісний режим) = сухо => XC1",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.lines[0].latex).toContain("\\mathrm{XC}");
    expect(result.lines[0].latex).toContain("\\mathrm{XC1}");
    expect(result.lines[0].latex).not.toContain("X_{C");
  });

  it("renders foundation anchorage formulas with the original mathematical notation", () => {
    const formulas = [
      "alpha2 = min(max(1.0 - 0.15 * (cd - Ø) / Ø; 0.7); 1.0) = min(max(1.0 - 0.15 * (50 - 16) / 16; 0.7); 1.0) = 0.7",
      "alpha235 = max(alpha2 * alpha3 * alpha5; 0.7) = max(0.7 * 0.99 * 1; 0.7) = max(0.7; 0.7) = 0.7",
      "lbd = alpha1 * alpha4 * alpha235 * lb,rqd = 1 * 1 * 0.7 * 24.98 = 17.49 мм",
      "sigma_sd = Fs * 1000 / As,prov = 15.07 * 1000 / 804.25 = 18.74 МПа",
      "eta1 = 1.0, оскільки h = 600 мм, a = 58 мм і стрижень знаходиться в зоні добрих умов зчеплення",
      "As,1 = pi * Ø^2 / 4 = pi * 16^2 / 4 = 201.06 мм²",
      "MQ = Q * hQ = 50 * 0.5 = 25 кН*м",
      "As,prov = As,1 * 1000 / s = 201.06 * 1000 / 150 = 1340.41 мм²/м.п.",
    ];

    const latex = formulas.map((formula) => {
      const result = parseReportFormula(formula);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.reason);
      return result.lines.map((line) => line.latex).join("\n");
    }).join("\n");

    expect(latex).toContain("\\alpha_2");
    expect(latex).toContain("\\alpha_{235}");
    expect(latex).toContain("l_{bd}");
    expect(latex).toContain("\\sigma_{sd}");
    expect(latex).toContain("\\eta_1");
    expect(latex).toContain("\\pi");
    expect(latex).toContain("\\text{кН*м}");
    expect(latex).toContain("\\text{мм}^2/\\text{м.п.}");
    expect(latex).not.toContain("alpha2");
    expect(latex).not.toContain("alpha235");
    expect(latex).not.toContain("sigma_sd");
    expect(latex).not.toContain("hBond");
    expect(latex).not.toContain("aBottom");
  });

  it("renders the steel stress-ratio formula with alpha and absolute values", () => {
    const result = parseReportFormula(
      "α = |σ_dyn| / |σ_sum| = 0 / 100 = 0",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.lines[0].latex).toContain("\\alpha");
    expect(result.lines[0].latex).toContain("\\sigma_{dyn}");
    expect(result.lines[0].latex).toContain("\\sigma_{sum}");
    expect(result.lines[0].latex).toContain(
      "\\frac{|\\sigma_{dyn}|}{|\\sigma_{sum}|}",
    );
  });

  it("preserves decimal commas in steel formulas", () => {
    const result = parseReportFormula("R_y = 245 / 1,025 = 239,02 МПа");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.lines[0].latex).toContain("1,025");
    expect(result.lines[0].latex).toContain("239,02\\ \\text{МПа}");
  });

  it("renders indexed delta adjustments", () => {
    const result = parseReportFormula(
      "ΔS_raw = ΔS_3 + ΔS_+ + ΔS_compression = 0 + 0 + 0 = 0",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.lines[0].latex).toContain("\\Delta_{S,raw}");
    expect(result.lines[0].latex).toContain("\\Delta_{S,compression}");
  });

  it("returns fallback for unsupported prose formulas", () => {
    const result = parseReportFormula("Приймаємо значення з таблиці без математичного виразу");

    expect(result).toEqual({
      ok: false,
      reason: "Formula does not start with a supported mathematical token.",
    });
  });
});
