const GREEK_TO_LATEX: Record<string, string> = {
  "γ": "\\gamma",
  "φ": "\\varphi",
  "Ø": "\\varnothing",
  "Σ": "\\Sigma",
  "λ": "\\lambda",
  "σ": "\\sigma",
};

const NAMED_SYMBOLS: Record<string, string> = {
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

export const REPORT_SYMBOLS = Object.keys(NAMED_SYMBOLS).sort(
  (left, right) => right.length - left.length,
);

export function reportSymbolToLatex(symbol: string): string {
  const named = NAMED_SYMBOLS[symbol];
  if (named) return named;

  const greek = GREEK_TO_LATEX[symbol];
  if (greek) return greek;

  return symbol.replace(/[γφØΣλσ]/g, (match) => GREEK_TO_LATEX[match] ?? match);
}

export function isKnownReportSymbol(symbol: string): boolean {
  return symbol in NAMED_SYMBOLS || symbol in GREEK_TO_LATEX;
}
