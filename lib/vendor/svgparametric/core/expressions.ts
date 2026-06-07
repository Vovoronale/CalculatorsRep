import { SvgParametricError } from "./errors";
import type { ParamMap, ParamValue } from "./types";

export interface ExpressionContext {
  vars: ParamMap;
  objects: Record<string, { params: ParamMap; anchors: unknown }>;
}

type Token =
  | { type: "number"; value: number }
  | { type: "identifier"; value: string }
  | { type: "symbol"; value: "+" | "-" | "*" | "/" | "(" | ")" | "," }
  | { type: "eof" };

const functions: Record<string, (...args: number[]) => number> = {
  min: (...args) => Math.min(...args),
  max: (...args) => Math.max(...args),
  round: (value) => Math.round(value),
  abs: (value) => Math.abs(value)
};

export function isFormula(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("${") && value.endsWith("}");
}

export function resolveParamValue(value: ParamValue, context: ExpressionContext, path = "value"): ParamValue {
  if (isFormula(value)) {
    const expression = value.slice(2, -1).trim();
    try {
      return evaluateExpression(expression, context);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new SvgParametricError(`Invalid formula at ${path}: ${message}`, { path });
    }
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => resolveParamValue(item, context, `${path}.${index}`));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveParamValue(item, context, `${path}.${key}`)])
    ) as ParamMap;
  }

  return value;
}

export function resolveParamMap(params: ParamMap = {}, context: ExpressionContext, path = "params"): ParamMap {
  return resolveParamValue(params, context, path) as ParamMap;
}

export function extractExpressionDependencies(value: ParamValue): string[] {
  const found = new Set<string>();

  const visit = (item: ParamValue): void => {
    if (isFormula(item)) {
      for (const match of item.matchAll(/(?:^|[^A-Za-z0-9_.])objects\.([A-Za-z_][A-Za-z0-9_]*)\./g)) {
        found.add(match[1]);
      }
      return;
    }

    if (Array.isArray(item)) {
      for (const child of item) visit(child);
      return;
    }

    if (item && typeof item === "object") {
      for (const child of Object.values(item)) visit(child);
    }
  };

  visit(value);
  return [...found].sort();
}

function evaluateExpression(expression: string, context: ExpressionContext): number {
  const parser = new FormulaParser(tokenize(expression), context);
  return parser.parse();
}

// Formula references intentionally support only dot-separated identifier-safe segments.
// Valid examples: vars.baseWidth, objects.foundation.anchors.right.x, objects.wall_1.params.width.
// Invalid for MVP: objects.wall-1.params.width.
function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      const start = index;
      while (index < expression.length && /[0-9.]/.test(expression[index])) index += 1;
      const text = expression.slice(start, index);
      if (!/^\d+(?:\.\d+)?$/.test(text) && !/^\.\d+$/.test(text)) {
        throw new Error(`Invalid number '${text}'`);
      }
      tokens.push({ type: "number", value: Number(text) });
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      const start = index;
      while (index < expression.length && /[A-Za-z0-9_.]/.test(expression[index])) index += 1;
      tokens.push({ type: "identifier", value: expression.slice(start, index) });
      continue;
    }

    if ("+-*/(),".includes(char)) {
      tokens.push({ type: "symbol", value: char as "+" | "-" | "*" | "/" | "(" | ")" | "," });
      index += 1;
      continue;
    }

    throw new Error(`Unsupported token '${char}'`);
  }

  tokens.push({ type: "eof" });
  return tokens;
}

class FormulaParser {
  private index = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly context: ExpressionContext
  ) {}

  parse(): number {
    const value = this.expression();
    if (this.peek().type !== "eof") {
      throw new Error("Unexpected token after expression");
    }
    return value;
  }

  private expression(): number {
    let value = this.term();

    while (this.match("+") || this.match("-")) {
      const operator = this.previous();
      if (operator.type !== "symbol") throw new Error("Expected operator");
      const right = this.term();
      value = operator.value === "+" ? value + right : value - right;
    }

    return value;
  }

  private term(): number {
    let value = this.factor();

    while (this.match("*") || this.match("/")) {
      const operator = this.previous();
      if (operator.type !== "symbol") throw new Error("Expected operator");
      const right = this.factor();
      value = operator.value === "*" ? value * right : value / right;
    }

    return value;
  }

  private factor(): number {
    if (this.match("+")) return this.factor();
    if (this.match("-")) return -this.factor();

    const token = this.advance();

    if (token.type === "number") return token.value;

    if (token.type === "identifier") {
      if (this.match("(")) return this.callFunction(token.value);
      return this.reference(token.value);
    }

    if (token.type === "symbol" && token.value === "(") {
      const value = this.expression();
      this.consume(")", "Expected ')' after expression");
      return value;
    }

    throw new Error("Expected number, reference, function call, or parenthesized expression");
  }

  private callFunction(name: string): number {
    const fn = functions[name];
    if (!fn) throw new Error(`Unsupported function '${name}'`);

    const args: number[] = [];
    if (!this.check(")")) {
      do {
        args.push(this.expression());
      } while (this.match(","));
    }
    this.consume(")", "Expected ')' after function arguments");

    if ((name === "round" || name === "abs") && args.length !== 1) {
      throw new Error(`${name} expects one argument`);
    }

    if ((name === "min" || name === "max") && args.length === 0) {
      throw new Error(`${name} expects at least one argument`);
    }

    return fn(...args);
  }

  private reference(path: string): number {
    if (!/^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(path)) {
      throw new Error(`Invalid reference path '${path}'`);
    }

    const parts = path.split(".");
    if (parts[0] !== "vars" && parts[0] !== "objects") {
      throw new Error(`Unsupported reference root '${parts[0]}'`);
    }

    let value: unknown = parts[0] === "vars" ? this.context.vars : this.context.objects;
    for (const part of parts.slice(1)) {
      if (!value || typeof value !== "object" || !(part in value)) {
        throw new Error(`Unknown reference '${path}'`);
      }
      value = (value as Record<string, unknown>)[part];
    }

    if (typeof value !== "number") {
      throw new Error(`Reference '${path}' does not resolve to a number`);
    }

    return value;
  }

  private match(symbol: string): boolean {
    if (!this.check(symbol)) return false;
    this.advance();
    return true;
  }

  private consume(symbol: string, message: string): void {
    if (this.match(symbol)) return;
    throw new Error(message);
  }

  private check(symbol: string): boolean {
    const token = this.peek();
    return token.type === "symbol" && token.value === symbol;
  }

  private advance(): Token {
    if (this.peek().type !== "eof") this.index += 1;
    return this.previous();
  }

  private peek(): Token {
    return this.tokens[this.index];
  }

  private previous(): Token {
    return this.tokens[this.index - 1];
  }
}
