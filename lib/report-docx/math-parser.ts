export type DocxBinaryOperator = "+" | "-" | "*" | "/" | "^";
export type DocxChainOperator = "=" | "<" | "<=" | ">" | ">=" | "=>" | "≈";

export type DocxFormulaNode =
  | { type: "number"; value: string }
  | { type: "symbol"; value: string; base: string; subscript?: string }
  | { type: "unit"; value: string; expression: DocxFormulaNode }
  | { type: "unary"; operator: "+" | "-"; argument: DocxFormulaNode }
  | {
      type: "binary";
      operator: DocxBinaryOperator;
      left: DocxFormulaNode;
      right: DocxFormulaNode;
    }
  | { type: "group"; bracket: "round" | "square"; expression: DocxFormulaNode }
  | { type: "function"; name: "min" | "max" | "sqrt" | "abs"; args: DocxFormulaNode[] }
  | { type: "chain"; operators: DocxChainOperator[]; parts: DocxFormulaNode[] };

export type DocxFormulaStatement = {
  source: string;
  expression: DocxFormulaNode;
  suffix?: string;
};

export type ParseDocxFormulaResult =
  | { ok: true; statements: DocxFormulaStatement[] }
  | { ok: false; reason: string };

type Token =
  | { type: "number"; value: string }
  | { type: "identifier"; value: string }
  | { type: "unit"; value: string }
  | { type: "operator"; value: DocxBinaryOperator | DocxChainOperator }
  | { type: "open-paren"; value: "(" }
  | { type: "close-paren"; value: ")" }
  | { type: "open-bracket"; value: "[" }
  | { type: "close-bracket"; value: "]" }
  | { type: "pipe"; value: "|" }
  | { type: "separator"; value: "," | ";" };

const EXPLANATORY_SUFFIX_PATTERNS = [
  " - умова виконується",
  " - умова не виконується",
  ", оскільки",
] as const;

const SUPPORTED_OPERATOR_PATTERN = /(<=|>=|=>|=|<|>|\+|-|\*|\/|\^)/u;

const KNOWN_UNITS = [
  "кгс/м³",
  "кН/м³",
  "кН/м²",
  "кг/см²",
  "тс/м³",
  "т/м³",
  "т/м²",
  "т·м",
  "Н/м³",
  "мм²",
  "см²",
  "м²",
  "м³",
  "МПа",
  "кПа",
  "кН",
  "мм",
  "см",
  "рад",
  "т",
  "м",
  "%",
  "°",
].sort((left, right) => right.length - left.length);

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

function splitExplanatorySuffix(source: string): { math: string; suffix?: string } {
  for (const marker of EXPLANATORY_SUFFIX_PATTERNS) {
    const markerIndex = source.indexOf(marker);

    if (markerIndex !== -1) {
      return {
        math: source.slice(0, markerIndex).trim(),
        suffix: source.slice(markerIndex),
      };
    }
  }

  return { math: source };
}

function isIdentifierStart(char: string): boolean {
  return /[A-Za-zА-Яа-яІіЇїЄєҐґØΣΔλσγφβαδεθκμρτπωπ]/u.test(char);
}

function isIdentifierPart(char: string): boolean {
  return /[A-Za-zА-Яа-яІіЇїЄєҐґØΣΔλσγφβαδεθκμρτπωπ0-9_,.′_]/u.test(char);
}

function getKnownUnitAt(source: string, index: number): string | null {
  for (const unit of KNOWN_UNITS) {
    if (source.startsWith(unit, index)) return unit;
  }

  return null;
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];

    if (/\s/u.test(char)) {
      index += 1;
      continue;
    }

    const unit = getKnownUnitAt(source, index);
    if (unit) {
      tokens.push({ type: "unit", value: unit });
      index += unit.length;
      continue;
    }

    const twoCharOperator = source.slice(index, index + 2);
    if (
      twoCharOperator === "<=" ||
      twoCharOperator === ">=" ||
      twoCharOperator === "=>"
    ) {
      tokens.push({ type: "operator", value: twoCharOperator });
      index += 2;
      continue;
    }

    if (char === "(") {
      tokens.push({ type: "open-paren", value: char });
      index += 1;
      continue;
    }

    if (char === ")") {
      tokens.push({ type: "close-paren", value: char });
      index += 1;
      continue;
    }

    if (char === "[") {
      tokens.push({ type: "open-bracket", value: char });
      index += 1;
      continue;
    }

    if (char === "]") {
      tokens.push({ type: "close-bracket", value: char });
      index += 1;
      continue;
    }

    if (char === "|") {
      tokens.push({ type: "pipe", value: char });
      index += 1;
      continue;
    }

    if (char === "," || char === ";") {
      tokens.push({ type: "separator", value: char });
      index += 1;
      continue;
    }

    if (char === "+" || char === "-" || char === "*" || char === "/" || char === "^") {
      tokens.push({ type: "operator", value: char });
      index += 1;
      continue;
    }

    if (char === "=" || char === "<" || char === ">" || char === "≈") {
      tokens.push({ type: "operator", value: char });
      index += 1;
      continue;
    }

    if (/\d/u.test(char)) {
      const start = index;
      index += 1;

      while (index < source.length && /[\d.,]/u.test(source[index])) {
        index += 1;
      }

      tokens.push({ type: "number", value: source.slice(start, index) });
      continue;
    }

    if (isIdentifierStart(char)) {
      const start = index;
      index += 1;

      while (
        index < source.length &&
        (isIdentifierPart(source[index]) ||
          (source[index] === "+" && source[index - 1] === "_"))
      ) {
        index += 1;
      }

      tokens.push({ type: "identifier", value: source.slice(start, index) });
      continue;
    }

    throw new Error(`Unsupported token "${char}".`);
  }

  return tokens;
}

function splitSymbol(value: string): { base: string; subscript?: string } {
  if (value === "pi") return { base: "π" };
  if (value === "π") return { base: "π" };

  const underscoreIndex = value.indexOf("_");
  if (underscoreIndex > 0) {
    const left = splitSymbol(value.slice(0, underscoreIndex));
    const right = value.slice(underscoreIndex + 1);

    return {
      base: left.base,
      subscript: left.subscript ? `${left.subscript},${right}` : right,
    };
  }

  const primeAwareBaseLength = value[1] === "′" ? 2 : 1;
  const base = value.slice(0, primeAwareBaseLength);
  const subscript = value.slice(primeAwareBaseLength);

  if (!subscript) return { base };

  return { base, subscript };
}

class FormulaParser {
  private position = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): DocxFormulaNode {
    const expression = this.parseChain();

    if (!this.isAtEnd()) {
      throw new Error(`Unexpected token "${this.peek()?.value ?? ""}".`);
    }

    return expression;
  }

  private parseChain(): DocxFormulaNode {
    const parts: DocxFormulaNode[] = [this.parseAdditive()];
    const operators: DocxChainOperator[] = [];

    while (this.matchChainOperator()) {
      const operator = this.previous().value;
      if (!isChainOperator(operator)) {
        throw new Error(`Unexpected chain operator "${operator}".`);
      }
      operators.push(operator);
      parts.push(this.parseAdditive());
    }

    if (operators.length === 0) return parts[0];

    return { type: "chain", operators, parts };
  }

  private parseAdditive(): DocxFormulaNode {
    let expression = this.parseMultiplicative();

    while (this.matchBinaryOperator("+") || this.matchBinaryOperator("-")) {
      const operator = this.previous().value;
      if (operator !== "+" && operator !== "-") {
        throw new Error(`Unexpected additive operator "${operator}".`);
      }
      expression = {
        type: "binary",
        operator,
        left: expression,
        right: this.parseMultiplicative(),
      };
    }

    return expression;
  }

  private parseMultiplicative(): DocxFormulaNode {
    let expression = this.parsePower();

    while (this.matchBinaryOperator("*") || this.matchBinaryOperator("/")) {
      const operator = this.previous().value;
      if (operator !== "*" && operator !== "/") {
        throw new Error(`Unexpected multiplicative operator "${operator}".`);
      }
      expression = {
        type: "binary",
        operator,
        left: expression,
        right: this.parsePower(),
      };
    }

    return expression;
  }

  private parsePower(): DocxFormulaNode {
    let expression = this.parseUnary();

    if (this.matchBinaryOperator("^")) {
      expression = {
        type: "binary",
        operator: "^",
        left: expression,
        right: this.parsePower(),
      };
    }

    return this.parseUnitSuffix(expression);
  }

  private parseUnary(): DocxFormulaNode {
    if (this.matchBinaryOperator("+") || this.matchBinaryOperator("-")) {
      const operator = this.previous().value;
      if (operator !== "+" && operator !== "-") {
        throw new Error(`Unexpected unary operator "${operator}".`);
      }
      return {
        type: "unary",
        operator,
        argument: this.parseUnary(),
      };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): DocxFormulaNode {
    if (this.match("number")) {
      return { type: "number", value: this.previous().value };
    }

    if (this.match("identifier")) {
      const identifier = this.previous().value;

      if (isSupportedFunction(identifier) && this.match("open-paren")) {
        return this.parseFunction(identifier);
      }

      return {
        type: "symbol",
        value: identifier,
        ...splitSymbol(identifier),
      };
    }

    if (this.match("open-paren")) {
      const expression = this.parseChain();
      this.consume("close-paren", "Expected closing parenthesis.");
      return { type: "group", bracket: "round", expression };
    }

    if (this.match("open-bracket")) {
      const expression = this.parseChain();
      this.consume("close-bracket", "Expected closing bracket.");
      return { type: "group", bracket: "square", expression };
    }

    if (this.match("pipe")) {
      const expression = this.parseChain();
      this.consume("pipe", "Expected closing absolute value bar.");
      return { type: "function", name: "abs", args: [expression] };
    }

    throw new Error(`Expected expression near "${this.peek()?.value ?? "end"}".`);
  }

  private parseFunction(name: "min" | "max" | "sqrt" | "abs"): DocxFormulaNode {
    const args: DocxFormulaNode[] = [];

    if (!this.check("close-paren")) {
      do {
        args.push(this.parseChain());
      } while (this.match("separator"));
    }

    this.consume("close-paren", `Expected closing parenthesis after ${name} arguments.`);
    return { type: "function", name, args };
  }

  private parseUnitSuffix(expression: DocxFormulaNode): DocxFormulaNode {
    if (!this.match("unit")) return expression;

    return {
      type: "unit",
      value: this.previous().value,
      expression,
    };
  }

  private match(type: Token["type"]): boolean {
    if (!this.check(type)) return false;
    this.advance();
    return true;
  }

  private matchBinaryOperator(operator: DocxBinaryOperator): boolean {
    if (!this.checkOperator(operator)) return false;
    this.advance();
    return true;
  }

  private matchChainOperator(): boolean {
    const token = this.peek();
    if (!token || token.type !== "operator" || !isChainOperator(token.value)) return false;
    this.advance();
    return true;
  }

  private consume(type: Token["type"], message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(message);
  }

  private check(type: Token["type"]): boolean {
    return this.peek()?.type === type;
  }

  private checkOperator(operator: DocxBinaryOperator | DocxChainOperator): boolean {
    const token = this.peek();
    return token?.type === "operator" && token.value === operator;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.position += 1;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.position >= this.tokens.length;
  }

  private peek(): Token | undefined {
    return this.tokens[this.position];
  }

  private previous(): Token {
    return this.tokens[this.position - 1];
  }
}

function isChainOperator(value: string): value is DocxChainOperator {
  return (
    value === "=" ||
    value === "<" ||
    value === "<=" ||
    value === ">" ||
    value === ">=" ||
    value === "=>" ||
    value === "≈"
  );
}

function isSupportedFunction(value: string): value is "min" | "max" | "sqrt" | "abs" {
  return value === "min" || value === "max" || value === "sqrt" || value === "abs";
}

function parseStatement(source: string): DocxFormulaStatement {
  const { math, suffix } = splitExplanatorySuffix(source);
  const tokens = tokenize(math);
  const expression = new FormulaParser(tokens).parse();

  return {
    source,
    expression,
    ...(suffix ? { suffix } : {}),
  };
}

export function parseDocxFormula(formula: string): ParseDocxFormulaResult {
  const trimmed = formula.trim();

  if (!trimmed) {
    return { ok: false, reason: "Formula is empty." };
  }

  if (!SUPPORTED_OPERATOR_PATTERN.test(trimmed)) {
    return {
      ok: false,
      reason: "Formula does not contain a supported mathematical operator.",
    };
  }

  try {
    return {
      ok: true,
      statements: splitStatements(trimmed).map(parseStatement),
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Unsupported formula syntax.",
    };
  }
}
