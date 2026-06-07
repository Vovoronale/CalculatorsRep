import type { SvgNode } from "./types";

export function svgElement(
  tag: string,
  attrs: SvgNode["attrs"] = {},
  children: Array<SvgNode | string> = []
): SvgNode {
  return { tag, attrs, children };
}

export function renderSvgDocument(
  scene: { width: number; height: number; viewBox?: [number, number, number, number] },
  children: SvgNode[]
): string {
  const viewBox = scene.viewBox?.join(" ") ?? `0 0 ${scene.width} ${scene.height}`;
  const root = svgElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: scene.width,
      height: scene.height,
      viewBox
    },
    children
  );

  return `${renderNode(root)}\n`;
}

export function renderNode(node: SvgNode | string): string {
  if (typeof node === "string") return escapeText(node);

  const attrs = renderAttrs(node.attrs ?? {});
  const children = node.children ?? [];

  if (children.length === 0) return `<${node.tag}${attrs}/>`;
  return `<${node.tag}${attrs}>${children.map(renderNode).join("")}</${node.tag}>`;
}

function renderAttrs(attrs: Record<string, string | number | boolean | undefined>): string {
  return Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== false)
    .map(([key, value]) => (value === true ? ` ${key}` : ` ${key}="${escapeAttr(String(value))}"`))
    .join("");
}

function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttr(value: string): string {
  return escapeText(value).replaceAll("\"", "&quot;");
}
