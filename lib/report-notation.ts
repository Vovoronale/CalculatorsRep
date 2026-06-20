const GREEK_TO_LATEX: Record<string, string> = {
  "Δ": "\\Delta",
  "α": "\\alpha",
  "γ": "\\gamma",
  "φ": "\\varphi",
  "Ø": "\\varnothing",
  "Σ": "\\Sigma",
  "λ": "\\lambda",
  "σ": "\\sigma",
  "∫": "\\int",
};

const NAMED_SYMBOLS: Record<string, string> = {
  "ΔS_+": "\\Delta_{S,+}",
  "X0": "\\mathrm{X0}",
  "XC": "\\mathrm{XC}",
  "XC1": "\\mathrm{XC1}",
  "XC2": "\\mathrm{XC2}",
  "XC3": "\\mathrm{XC3}",
  "XC4": "\\mathrm{XC4}",
  "XD": "\\mathrm{XD}",
  "XD1": "\\mathrm{XD1}",
  "XD2": "\\mathrm{XD2}",
  "XD3": "\\mathrm{XD3}",
  "XS": "\\mathrm{XS}",
  "XS1": "\\mathrm{XS1}",
  "XS2": "\\mathrm{XS2}",
  "XS3": "\\mathrm{XS3}",
  "XF": "\\mathrm{XF}",
  "XF1": "\\mathrm{XF1}",
  "XF2": "\\mathrm{XF2}",
  "XF3": "\\mathrm{XF3}",
  "XF4": "\\mathrm{XF4}",
  "XA": "\\mathrm{XA}",
  "XA1": "\\mathrm{XA1}",
  "XA2": "\\mathrm{XA2}",
  "XA3": "\\mathrm{XA3}",
  "Mγ": "M_{\\gamma}",
  "Mγ,a": "M_{\\gamma,a}",
  "Mγ,b": "M_{\\gamma,b}",
  "Mq": "M_q",
  "Mq,a": "M_{q,a}",
  "Mq,b": "M_{q,b}",
  "Mc": "M_c",
  "Mc,a": "M_{c,a}",
  "Mc,b": "M_{c,b}",
  "φ11": "\\varphi_{11}",
  "φa": "\\varphi_a",
  "φb": "\\varphi_b",
  "γc1": "\\gamma_{c1}",
  "γc2": "\\gamma_{c2}",
  "γ11": "\\gamma_{11}",
  "γ′11": "\\gamma'_{11}",
  "γcf": "\\gamma_{cf}",
  "As": "A_s",
  "As,1": "A_{s,1}",
  "As,min": "A_{s,min}",
  "As,min,1": "A_{s,min,1}",
  "As,min,2": "A_{s,min,2}",
  "As,prov": "A_{s,prov}",
  "Ast": "A_{st}",
  "Ast,min": "A_{st,min}",
  "db": "d_b",
  "db,input": "d_{b,input}",
  "d1": "d_1",
  "hs": "h_s",
  "hcf": "h_{cf}",
  "IL": "I_L",
  "L/H": "\\frac{L}{H}",
  "kz": "k_z",
  "z0": "z_0",
  "qmax": "q_{max}",
  "qmin": "q_{min}",
  "qx": "q_x",
  "qm": "q_m",
  "MQ": "M_Q",
  "Mtot": "M_{tot}",
  "hQ": "h_Q",
  "ze": "z_e",
  "zi": "z_i",
  "Fs": "F_s",
  "lb,rqd": "l_{b,rqd}",
  "lbd": "l_{bd}",
  "lb,min": "l_{b,min}",
  "lb,req": "l_{b,req}",
  "lb": "l_b",
  "cd": "c_d",
  "fctk,0.05": "f_{ctk,0.05}",
  "fctd": "f_{ctd}",
  "fbd": "f_{bd}",
  "fctm": "f_{ctm}",
  "fyk": "f_{yk}",
  "bt": "b_t",
  "sigma_sd": "\\sigma_{sd}",
  "alpha_ct": "\\alpha_{ct}",
  "alpha1": "\\alpha_1",
  "alpha2": "\\alpha_2",
  "alpha3": "\\alpha_3",
  "alpha4": "\\alpha_4",
  "alpha5": "\\alpha_5",
  "alpha235": "\\alpha_{235}",
  "eta1": "\\eta_1",
  "eta2": "\\eta_2",
  "gamma_c": "\\gamma_c",
  "lambda": "\\lambda",
};

function mergeSubscripts(left: string | undefined, right: string): string {
  return left ? `${left},${right}` : right;
}

function splitGenericSymbol(symbol: string): { base: string; subscript?: string } {
  const underscoreIndex = symbol.indexOf("_");
  if (underscoreIndex > 0) {
    const left = splitGenericSymbol(symbol.slice(0, underscoreIndex));
    return {
      base: left.base,
      subscript: mergeSubscripts(left.subscript, symbol.slice(underscoreIndex + 1)),
    };
  }

  const primeAwareBaseLength = symbol[1] === "′" ? 2 : 1;
  const base = symbol.slice(0, primeAwareBaseLength);
  const subscript = symbol.slice(primeAwareBaseLength);

  return subscript ? { base, subscript } : { base };
}

function baseToLatex(base: string): string {
  return base.replace(/[ΔαγφØΣλσ∫]/g, (match) => GREEK_TO_LATEX[match] ?? match);
}

export const REPORT_SYMBOLS = Object.keys(NAMED_SYMBOLS).sort(
  (left, right) => right.length - left.length,
);

export function reportSymbolToLatex(symbol: string): string {
  const named = NAMED_SYMBOLS[symbol];
  if (named) return named;

  const greek = GREEK_TO_LATEX[symbol];
  if (greek) return greek;

  if (symbol === "pi") return "\\pi";

  if (/[A-Za-zØΣΔλασγφ∫][A-Za-zØΣΔλασγφ∫0-9_,.′_-]+/u.test(symbol)) {
    const { base, subscript } = splitGenericSymbol(symbol);
    const latexBase = baseToLatex(base);
    return subscript ? `${latexBase}_{${subscript}}` : latexBase;
  }

  return symbol.replace(/[ΔαγφØΣλσ∫]/g, (match) => GREEK_TO_LATEX[match] ?? match);
}

export function isKnownReportSymbol(symbol: string): boolean {
  return symbol in NAMED_SYMBOLS || symbol in GREEK_TO_LATEX;
}
