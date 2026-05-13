type MathNotationProps = {
  base: string;
  subscript?: string;
  superscript?: string;
  ariaLabel?: string;
};

export function MathNotation({
  base,
  subscript,
  superscript,
  ariaLabel,
}: MathNotationProps) {
  return (
    <span
      className="math-notation"
      aria-label={ariaLabel ?? `${base}${subscript ?? ""}${superscript ?? ""}`}
    >
      <span className="math-notation__base" aria-hidden="true">
        {base}
      </span>
      {subscript ? <sub aria-hidden="true">{subscript}</sub> : null}
      {superscript ? <sup aria-hidden="true">{superscript}</sup> : null}
    </span>
  );
}
