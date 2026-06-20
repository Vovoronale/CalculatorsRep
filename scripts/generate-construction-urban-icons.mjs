import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, "public", "calculator-icons");

const colors = {
  reinforcedConcrete: { fill: "#4F7A58", text: "#FFFFFF", stroke: "#36563D" },
  foundations: { fill: "#76533E", text: "#FFFFFF", stroke: "#513827" },
  mechanics: { fill: "#3E6288", text: "#FFFFFF", stroke: "#29445F" },
  steel: { fill: "#71558A", text: "#FFFFFF", stroke: "#4F3A63" },
  urban: { fill: "#FFFFFF", text: "#25292B", stroke: "#25292B" },
};

const stroke = 'fill="none" stroke="#222729" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"';
const thinStroke = 'fill="none" stroke="#222729" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"';

function badge(content, palette, width = 168) {
  return `
    <g filter="url(#badgeShadow)">
      <rect x="34" y="34" width="${width}" height="112" rx="8" fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="10"/>
      ${content}
    </g>`;
}

function textBadge(label, palette, width = 168, fontSize = 58) {
  return badge(
    `<text x="${34 + width / 2}" y="109" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="${palette.text}">${label}</text>`,
    palette,
    width,
  );
}

function subscriptBadge(base, subscript, palette, width = 190) {
  const center = 34 + width / 2;
  return badge(
    `<text x="${center}" y="108" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="59" font-weight="700" fill="${palette.text}">${base}<tspan baseline-shift="sub" font-size="34">${subscript}</tspan></text>`,
    palette,
    width,
  );
}

function canvas(body, badgeMarkup) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FAFAF8"/>
        <stop offset="0.5" stop-color="#B9BDBA"/>
        <stop offset="1" stop-color="#686E6C"/>
      </linearGradient>
      <linearGradient id="concrete" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#E6E7E4"/>
        <stop offset="1" stop-color="#A8ACAA"/>
      </linearGradient>
      <filter id="badgeShadow" x="-20%" y="-20%" width="150%" height="160%">
        <feDropShadow dx="0" dy="8" stdDeviation="5" flood-color="#101314" flood-opacity="0.2"/>
      </filter>
    </defs>
    <rect width="512" height="512" fill="#F1F2F0"/>
    ${body}
    ${badgeMarkup}
  </svg>`;
}

const icons = [
  {
    slug: "rebar-area-bars",
    badge: textBadge("n&#216;", colors.reinforcedConcrete, 184),
    body: `
      <g transform="rotate(-14 302 288)">
        <rect x="128" y="224" width="336" height="52" rx="26" fill="url(#metal)" stroke="#222729" stroke-width="18"/>
        <rect x="128" y="318" width="336" height="52" rx="26" fill="url(#metal)" stroke="#222729" stroke-width="18"/>
        <path d="M168 218l24 64m44-64l24 64m44-64l24 64m44-64l24 64M168 312l24 64m44-64l24 64m44-64l24 64m44-64l24 64" ${thinStroke}/>
      </g>`,
  },
  {
    slug: "minimum-reinforcement-area",
    badge: subscriptBadge("&#956;", "min", colors.reinforcedConcrete, 196),
    body: `
      <rect x="146" y="164" width="302" height="250" rx="8" fill="url(#concrete)" stroke="#222729" stroke-width="20"/>
      <circle cx="198" cy="366" r="24" fill="#222729"/><circle cx="286" cy="366" r="24" fill="#222729"/><circle cx="374" cy="366" r="24" fill="#222729"/>
      <path d="M170 322h254" ${thinStroke}/>
      <circle cx="198" cy="208" r="13" fill="#666C69"/><circle cx="396" cy="208" r="13" fill="#666C69"/>`,
  },
  {
    slug: "foundation-bar-anchorage",
    badge: subscriptBadge("l", "bd", colors.reinforcedConcrete, 178),
    body: `
      <path d="M132 260h330v174H132z" fill="url(#concrete)" stroke="#222729" stroke-width="20" stroke-linejoin="round"/>
      <path d="M284 106v252q0 42 42 42h86" ${stroke}/>
      <path d="M246 154h76M246 206h76M246 258h76" ${thinStroke}/>
      <path d="M374 374l38 26-38 26" ${thinStroke}/>
    `,
  },
  {
    slug: "concrete-exposure-class",
    badge: textBadge("XC", colors.reinforcedConcrete, 174),
    body: `
      <path d="M164 236h278v196H164z" fill="url(#concrete)" stroke="#222729" stroke-width="20" stroke-linejoin="round"/>
      <path d="M334 100c-46 66-68 96-68 131a68 68 0 00136 0c0-35-22-65-68-131z" fill="#D8DBD9" stroke="#222729" stroke-width="20"/>
      <path d="M194 286h218M194 342h218" stroke="#6E7471" stroke-width="10"/>
    `,
  },
  {
    slug: "concrete-cover-durability",
    badge: subscriptBadge("c", "nom", colors.reinforcedConcrete, 202),
    body: `
      <path d="M172 160h274v276H172z" fill="url(#concrete)" stroke="#222729" stroke-width="20"/>
      <circle cx="356" cy="314" r="42" fill="#3D4341" stroke="#222729" stroke-width="14"/>
      <path d="M190 314h112M190 282v64M302 282v64" ${thinStroke}/>
      <path d="M202 314l28-18v36zm88 0l-28-18v36z" fill="#222729"/>
    `,
  },
  {
    slug: "rebar-characteristics",
    badge: subscriptBadge("f", "yd", colors.reinforcedConcrete, 178),
    body: `
      <g transform="rotate(-35 294 290)">
        <rect x="94" y="252" width="400" height="78" rx="39" fill="url(#metal)" stroke="#222729" stroke-width="20"/>
        <path d="M146 238l35 106m55-106l35 106m55-106l35 106m55-106l35 106" ${stroke}/>
      </g>
    `,
  },
  {
    slug: "concrete-characteristics",
    badge: subscriptBadge("f", "cd", colors.reinforcedConcrete, 178),
    body: `
      <path d="M178 192l126-70 134 72-130 74z" fill="#E7E8E5" stroke="#222729" stroke-width="18" stroke-linejoin="round"/>
      <path d="M178 192v190l130 72V268z" fill="#B7BBB8" stroke="#222729" stroke-width="18" stroke-linejoin="round"/>
      <path d="M308 268l130-74v190l-130 70z" fill="#8E9491" stroke="#222729" stroke-width="18" stroke-linejoin="round"/>
    `,
  },
  {
    slug: "soil-design-resistance",
    badge: textBadge("R", colors.foundations),
    body: `
      <path d="M150 208h314v86H150z" fill="url(#concrete)" stroke="#222729" stroke-width="20"/>
      <path d="M212 122h190v86H212z" fill="#CDD0CE" stroke="#222729" stroke-width="20"/>
      <path d="M116 340c70-40 128-40 190 0s122 40 190 0M116 410c70-40 128-40 190 0s122 40 190 0" ${stroke}/>
    `,
  },
  {
    slug: "foundation-base-pressure",
    badge: textBadge("p", colors.foundations),
    body: `
      <path d="M144 156h316v106H144z" fill="url(#concrete)" stroke="#222729" stroke-width="20"/>
      <path d="M216 80h172v76H216z" fill="#C9CCCA" stroke="#222729" stroke-width="20"/>
      <path d="M152 294h300v128H152z" fill="#D4D6D3" stroke="#222729" stroke-width="18"/>
      <path d="M174 304v106m52-106v106m52-106v106m52-106v106m52-106v106m52-106v106" stroke="#555B59" stroke-width="10"/>
      <path d="M174 318l-16-28h32zM226 318l-16-28h32zM278 318l-16-28h32zM330 318l-16-28h32zM382 318l-16-28h32zM434 318l-16-28h32z" fill="#222729"/>
    `,
  },
  {
    slug: "cassoon-load-distribution",
    badge: textBadge("q", colors.mechanics),
    body: `
      <path d="M174 166h274v266H174z" fill="#D8DAD8" stroke="#222729" stroke-width="20"/>
      <path d="M206 198h210v202H206z" fill="#F1F2F0" stroke="#222729" stroke-width="18"/>
      <path d="M311 214v164M222 299h178" ${stroke}/>
      <path d="M311 299l-54-54m54 54l54-54m-54 54l-54 54m54-54l54 54" ${thinStroke}/>
    `,
  },
  {
    slug: "steel-structure-category-group",
    badge: textBadge("S", colors.steel),
    body: `
      <path d="M168 120h288v76H350v212h106v76H168v-76h106V196H168z" fill="url(#metal)" stroke="#222729" stroke-width="20" stroke-linejoin="round"/>
      <path d="M274 214h76M274 390h76" stroke="#666C69" stroke-width="10"/>
    `,
  },
  {
    slug: "residential-yard-areas",
    badge: textBadge("S", colors.urban),
    body: `
      <path d="M134 176h326v270H134z" fill="#E4E6E3" stroke="#222729" stroke-width="18" stroke-dasharray="24 16"/>
      <path d="M166 218h162v144h-54v52H166z" fill="#B8BCB9" stroke="#222729" stroke-width="20" stroke-linejoin="round"/>
      <rect x="352" y="240" width="76" height="150" rx="6" fill="#F1F2F0" stroke="#222729" stroke-width="18"/>
      <path d="M372 264h36M372 300h36M372 336h36M372 372h36" stroke="#777D7A" stroke-width="10"/>
    `,
  },
];

await mkdir(outputDir, { recursive: true });

for (const icon of icons) {
  const svg = canvas(icon.body, icon.badge);
  const outputPath = join(outputDir, `${icon.slug}.png`);

  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outputPath);
  const metadata = await sharp(outputPath).metadata();

  if (metadata.width !== 512 || metadata.height !== 512 || metadata.format !== "png") {
    throw new Error(`Invalid generated asset: ${icon.slug}`);
  }
}

console.log(`Generated ${icons.length} construction and urban-planning icons at 512x512.`);
