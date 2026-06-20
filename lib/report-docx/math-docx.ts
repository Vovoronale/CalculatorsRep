import {
  Math as DocxMath,
  MathFraction,
  MathRadical,
  MathRoundBrackets,
  MathRun,
  MathSquareBrackets,
  MathSubScript,
  MathSuperScript,
  Paragraph,
  type MathComponent,
} from "docx";

import type { DocxChainOperator, DocxFormulaNode, DocxFormulaStatement } from "./math-parser";

export function getDocxFormulaRenderMode(_statements: DocxFormulaStatement[]): "math" {
  return "math";
}

function mathText(value: string): MathRun {
  return new MathRun(value);
}

function chainOperatorText(operator: DocxChainOperator): string {
  if (operator === "<=") return " ≤ ";
  if (operator === ">=") return " ≥ ";
  if (operator === "=>") return " ⇒ ";
  return ` ${operator} `;
}

function convertNode(node: DocxFormulaNode): MathComponent[] {
  if (node.type === "number") {
    return [mathText(node.value)];
  }

  if (node.type === "symbol") {
    const base = mathText(node.base);

    if (!node.subscript) return [base];

    return [
      new MathSubScript({
        children: [base],
        subScript: [mathText(node.subscript)],
      }),
    ];
  }

  if (node.type === "unit") {
    return [...convertNode(node.expression), mathText(` ${node.value}`)];
  }

  if (node.type === "unary") {
    return [mathText(node.operator), ...convertNode(node.argument)];
  }

  if (node.type === "binary") {
    if (node.operator === "/") {
      return [
        new MathFraction({
          numerator: convertNode(node.left),
          denominator: convertNode(node.right),
        }),
      ];
    }

    if (node.operator === "^") {
      return [
        new MathSuperScript({
          children: convertNode(node.left),
          superScript: convertNode(node.right),
        }),
      ];
    }

    const operatorText = node.operator === "*" ? " · " : ` ${node.operator} `;

    return [
      ...convertNode(node.left),
      mathText(operatorText),
      ...convertNode(node.right),
    ];
  }

  if (node.type === "group") {
    const children = convertNode(node.expression);

    if (node.bracket === "square") {
      return [new MathSquareBrackets({ children })];
    }

    if (node.bracket === "ceiling") {
      return [mathText("⌈"), ...children, mathText("⌉")];
    }

    return [new MathRoundBrackets({ children })];
  }

  if (node.type === "function") {
    if (node.name === "sqrt") {
      return [new MathRadical({ children: convertFunctionArgs(node.args) })];
    }

    if (node.name === "abs") {
      return [mathText("|"), ...convertFunctionArgs(node.args), mathText("|")];
    }

    return [
      mathText(`${node.name}(`),
      ...convertFunctionArgs(node.args),
      mathText(")"),
    ];
  }

  return node.parts.flatMap((part, index) => {
    if (index === 0) return convertNode(part);
    return [
      mathText(chainOperatorText(node.operators[index - 1])),
      ...convertNode(part),
    ];
  });
}

function convertFunctionArgs(args: DocxFormulaNode[]): MathComponent[] {
  return args.flatMap((arg, index) => {
    if (index === 0) return convertNode(arg);
    return [mathText("; "), ...convertNode(arg)];
  });
}

function createMathParagraph(statement: DocxFormulaStatement): Paragraph {
  const children: MathComponent[] = [
    ...(statement.prefix ? [mathText(statement.prefix)] : []),
    ...convertNode(statement.expression),
    ...(statement.suffix ? [mathText(statement.suffix)] : []),
  ];

  return new Paragraph({
    children: [new DocxMath({ children })],
  });
}

export function createDocxMathParagraphs(statements: DocxFormulaStatement[]): Paragraph[] {
  return statements.map(createMathParagraph);
}
