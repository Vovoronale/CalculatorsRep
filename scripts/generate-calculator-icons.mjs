import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const content = JSON.parse(readFileSync(join(root, "data", "content.json"), "utf8"));
const outDir = join(root, "public", "calculator-icons");

mkdirSync(outDir, { recursive: true });

const palette = [
  { bg: "#eef7f4", ink: "#153f3a", accent: "#e95f2a", soft: "#bfded7" },
  { bg: "#f4f5fb", ink: "#20243a", accent: "#3f7cac", soft: "#ccd5ee" },
  { bg: "#fff3ed", ink: "#3f2619", accent: "#e95f2a", soft: "#ffd7c3" },
  { bg: "#f3f6ef", ink: "#26371c", accent: "#5f7f30", soft: "#d5e2c7" },
  { bg: "#f7f3ea", ink: "#33271c", accent: "#986c2d", soft: "#e5d6b8" },
];

function hash(value) {
  let result = 0;
  for (const char of value) {
    result = (result * 31 + char.charCodeAt(0)) >>> 0;
  }
  return result;
}

function code(calculator) {
  const words = calculator.slug.split("-");
  if (calculator.slug.startsWith("ai-")) return "AI";
  if (calculator.slug.startsWith("cadee-bridge")) return "Ψ";
  if (calculator.slug.startsWith("cadee-")) return "R";
  if (calculator.slug.includes("rebar")) return "As";
  if (calculator.slug.includes("concrete")) return "C";
  if (calculator.slug.includes("foundation")) return "F";
  if (calculator.slug.includes("soil")) return "R0";
  if (calculator.slug.includes("steel")) return "St";
  if (calculator.slug.includes("power")) return "P";
  if (calculator.slug.includes("geojson")) return "GIS";
  if (calculator.slug.includes("consequence")) return "CC";
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function motif(calculator, variant) {
  const slug = calculator.slug;

  if (slug.startsWith("cadee-bridge")) {
    const node = 25 + (variant % 3) * 12;
    return `
      <path d="M22 25h52M22 43h52M22 61h52M30 18v54M48 18v54M66 18v54" />
      <path d="M${node} 18v54" class="accent" />
      <circle cx="${node}" cy="43" r="5" class="fill-accent" />`;
  }

  if (slug.startsWith("cadee-") || slug.includes("thermal")) {
    const layers = variant % 3;
    return `
      <path d="M24 24h34v48H24zM58 24h14v48H58z" />
      <path d="M33 ${34 + layers * 4}h16M33 ${44 + layers * 4}h16M33 ${54 + layers * 4}h16" />
      <path d="M72 27c-7 7-7 17 0 24s7 17 0 24" class="accent" />`;
  }

  if (slug.includes("air") || slug.includes("ventilation")) {
    return `
      <path d="M24 32h27M20 48h52M31 64h33" />
      <path d="M54 29c10 1 13 9 5 14M65 45c10 1 12 9 4 14" class="accent" />`;
  }

  if (slug.includes("rebar") || slug.includes("reinforcement") || slug === "armcon") {
    return `
      <path d="M23 28h50M23 43h50M23 58h50" />
      <path d="M31 24v38M45 24v38M59 24v38" />
      <circle cx="31" cy="66" r="4" class="fill-accent" />
      <circle cx="45" cy="66" r="4" class="fill-accent" />
      <circle cx="59" cy="66" r="4" class="fill-accent" />`;
  }

  if (slug.includes("concrete")) {
    return `
      <path d="M24 28h48v38H24z" />
      <path d="M31 37h34M31 48h34M31 59h34" />
      <path d="M72 28l-9 9M72 44l-9 9M72 60l-6 6" class="accent" />`;
  }

  if (slug.includes("foundation") || slug.includes("soil")) {
    return `
      <path d="M29 24h38v14H29zM22 38h52v14H22z" />
      <path d="M23 62c8-5 16-5 24 0s16 5 26 0" />
      <path d="M26 70c8-5 16-5 24 0s16 5 22 0" />
      <path d="M37 52l-5 10M50 52l-5 10M63 52l-5 10" class="accent" />`;
  }

  if (slug.includes("steel")) {
    return `
      <path d="M27 25h42M27 71h42M38 25v46M58 25v46" />
      <path d="M38 48h20" class="accent" />
      <path d="M24 34l8-8M64 70l8-8" />`;
  }

  if (slug.includes("norm") || slug.includes("consequence")) {
    return `
      <path d="M48 20l22 8v15c0 14-8 24-22 31-14-7-22-17-22-31V28z" />
      <path d="M38 47l7 7 14-17" class="accent" />`;
  }

  if (slug.includes("power")) {
    return `
      <path d="M33 20h30l-9 21h14L41 76l6-25H31z" />
      <path d="M26 32h11M59 64h12" class="accent" />`;
  }

  if (slug.includes("geojson")) {
    return `
      <path d="M24 27l18-7 28 11v38l-19 7-27-11z" />
      <path d="M42 20v38M51 38v38M24 46l46-15" />
      <circle cx="51" cy="38" r="4" class="fill-accent" />`;
  }

  if (slug.includes("ai") || slug.includes("assistant")) {
    return `
      <path d="M25 30h46v31H47l-12 10V61H25z" />
      <path d="M35 42h22M35 51h14" />
      <circle cx="64" cy="44" r="4" class="fill-accent" />`;
  }

  return `
    <path d="M28 23h40v50H28z" />
    <path d="M36 34h24M36 45h24M36 56h15" />
    <path d="M59 56l8 8 9-17" class="accent" />`;
}

function svg(calculator) {
  const value = hash(calculator.slug);
  const colors = palette[value % palette.length];
  const variant = value % 7;
  const mark = code(calculator);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" role="img" aria-label="${calculator.title.replaceAll('"', "&quot;")}">
  <rect width="96" height="96" rx="16" fill="${colors.bg}"/>
  <path d="M14 18h68v60H14z" fill="none" stroke="${colors.soft}" stroke-width="2"/>
  <g fill="none" stroke="${colors.ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    ${motif(calculator, variant)}
  </g>
  <rect x="13" y="13" width="28" height="18" rx="5" fill="${colors.ink}"/>
  <text x="27" y="26" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${mark.length > 2 ? 8 : 10}" font-weight="700" fill="#fff">${mark}</text>
  <style>
    .accent{stroke:${colors.accent}}
    .fill-accent{fill:${colors.accent};stroke:none}
  </style>
</svg>
`;
}

for (const calculator of content.calculators) {
  writeFileSync(join(outDir, `${calculator.slug}.svg`), svg(calculator), "utf8");
}
