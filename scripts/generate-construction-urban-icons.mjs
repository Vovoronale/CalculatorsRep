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
  envelope: { fill: "#A45A45", text: "#FFFFFF", stroke: "#713B2D" },
  floors: { fill: "#8A6A3C", text: "#FFFFFF", stroke: "#5E4828" },
  bridges: { fill: "#3F7774", text: "#FFFFFF", stroke: "#28514F" },
  normcontrol: { fill: "#4A6078", text: "#FFFFFF", stroke: "#304255" },
  consequence: { fill: "#7D4655", text: "#FFFFFF", stroke: "#57303B" },
  electricity: { fill: "#B27618", text: "#FFFFFF", stroke: "#79500E" },
  gis: { fill: "#3C6E8F", text: "#FFFFFF", stroke: "#284C64" },
  ai: { fill: "#6E568C", text: "#FFFFFF", stroke: "#4B3A62" },
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

function textBadge(label, palette, width = 168, fontSize = 87) {
  return badge(
    `<text x="${34 + width / 2}" y="119" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="${palette.text}">${label}</text>`,
    palette,
    width,
  );
}

function subscriptBadge(base, subscript, palette, width = 190) {
  const center = 34 + width / 2;
  return badge(
    `<text x="${center}" y="116" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="87" font-weight="700" fill="${palette.text}">${base}<tspan baseline-shift="sub" font-size="51">${subscript}</tspan></text>`,
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

function wall(extra = "", layers = 3) {
  const stripes = Array.from({ length: layers }, (_, index) =>
    `<rect x="${184 + index * 62}" y="178" width="62" height="248" fill="${index % 2 ? "#B9BDBA" : "#E1E3E0"}"/>`,
  ).join("");
  return `<g><rect x="176" y="170" width="${layers * 62 + 16}" height="264" rx="8" fill="#D7DAD7" stroke="#222729" stroke-width="18"/>${stripes}${extra}</g>`;
}

function floorSection(extra = "") {
  return `<path d="M126 252h350v104H126z" fill="url(#concrete)" stroke="#222729" stroke-width="20"/>${extra}`;
}

function thermalBridge(kind) {
  const shapes = {
    wallFloor: "M176 170v264h98V326h190v-94H274V170z",
    balcony: "M176 170v264h98V326h210v-94H274V170z M380 326v80",
    floorInclusion: "M120 244h360v108H120z M280 244v108",
    wallInclusion: "M214 154h112v294H214z M214 280h112",
    corner: "M156 170v260h276v-96H252V170z",
    doubleCorner: "M144 158v284h300v-120H264V158z M192 158v236h252",
  };
  return `<path d="${shapes[kind]}" fill="url(#concrete)" stroke="#222729" stroke-width="20" stroke-linejoin="round"/>`;
}

const icons = [
  {
    slug: "cadee-external",
    badge: textBadge("R&#931;", colors.envelope, 220),
    body: wall(`<path d="M410 224h62m-24-28l28 28-28 28M410 342h62m-24-28l28 28-28 28" ${thinStroke}/>`),
  },
  {
    slug: "cadee-heat-transfer-resistance",
    badge: textBadge("R", colors.envelope),
    body: wall(`<path d="M132 250h70m-38-34l-34 34 34 34M396 350h84m-36-34l36 34-36 34" ${thinStroke}/>`),
  },
  {
    slug: "cadee-heat-humid-state",
    badge: textBadge("w", colors.envelope),
    body: wall(`<path d="M418 218c-38 54-54 78-54 104a54 54 0 00108 0c0-26-16-50-54-104z" fill="#D9DCDA" stroke="#222729" stroke-width="18"/>`),
  },
  {
    slug: "cadee-vapor-permeability-resistance",
    badge: subscriptBadge("R", "v", colors.envelope, 190),
    body: wall(`<g fill="#555B59"><circle cx="130" cy="236" r="13"/><circle cx="130" cy="304" r="13"/><circle cx="130" cy="372" r="13"/><circle cx="438" cy="236" r="8"/><circle cx="438" cy="304" r="8"/><circle cx="438" cy="372" r="8"/></g>`),
  },
  {
    slug: "cadee-heat-inertia",
    badge: textBadge("D", colors.envelope),
    body: wall(`<circle cx="430" cy="310" r="62" fill="#F1F2F0" stroke="#222729" stroke-width="18"/><path d="M430 274v40l30 22" ${thinStroke}/>`),
  },
  {
    slug: "cadee-summer-thermo-resistance",
    badge: textBadge("&#957;", colors.envelope),
    body: wall(`<circle cx="432" cy="276" r="43" fill="#E5E3DA" stroke="#222729" stroke-width="17"/><path d="M432 202v-28m0 204v-28m-74-74h-28m204 0h-28m-126-52l-20-20m144 144l-20-20m0-104l20-20M380 328l-20 20" ${thinStroke}/>`),
  },
  {
    slug: "cadee-dewpoint-temperature",
    badge: subscriptBadge("t", "d", colors.envelope, 178),
    body: `<path d="M314 164c-74 104-104 150-104 202a104 104 0 00208 0c0-52-30-98-104-202z" fill="#DDE0DE" stroke="#222729" stroke-width="20"/><path d="M314 234v136" ${stroke}/><circle cx="314" cy="374" r="36" fill="#8E9491" stroke="#222729" stroke-width="16"/>`,
  },
  {
    slug: "cadee-delta-surface-temperature",
    badge: subscriptBadge("&#964;", "i", colors.envelope, 178),
    body: wall(`<path d="M432 212v142" ${stroke}/><circle cx="432" cy="374" r="34" fill="#8E9491" stroke="#222729" stroke-width="16"/><path d="M404 220h56" ${thinStroke}/>`),
  },
  {
    slug: "cadee-air-permeability",
    badge: textBadge("G", colors.envelope),
    body: wall(`<path d="M112 240h350m-44-34l44 34-44 34M112 342h350m-44-34l44 34-44 34" ${stroke}/>`),
  },
  {
    slug: "cadee-heated-basement",
    badge: subscriptBadge("R", "b+", colors.floors, 208),
    body: floorSection(`<path d="M206 388h168v52H206zM238 388v52m34-52v52m34-52v52m34-52v52" ${thinStroke}/><path d="M230 222c-20-34 20-48 0-78m70 78c-20-34 20-48 0-78m70 78c-20-34 20-48 0-78" ${thinStroke}/>`),
  },
  {
    slug: "cadee-floor-techroom",
    badge: subscriptBadge("R", "tp", colors.floors, 208),
    body: floorSection(`<rect x="214" y="382" width="174" height="62" rx="8" fill="#D2D5D2" stroke="#222729" stroke-width="18"/><path d="M248 382v62m106-62v62" ${thinStroke}/>`),
  },
  {
    slug: "cadee-floor-ground",
    badge: subscriptBadge("R", "g", colors.floors, 190),
    body: floorSection(`<path d="M120 402c64-34 116-34 176 0s116 34 184 0M120 454c64-34 116-34 176 0s116 34 184 0" ${thinStroke}/>`),
  },
  {
    slug: "cadee-floor-cold-basement",
    badge: subscriptBadge("R", "b-", colors.floors, 208),
    body: floorSection(`<path d="M302 382v76m-34-58l68 40m0-40l-68 40M268 382l68 76" ${thinStroke}/>`),
  },
  {
    slug: "cadee-floor-heat-absorption",
    badge: textBadge("Y", colors.floors),
    body: floorSection(`<path d="M208 220c22-34 48-34 70 0s48 34 70 0 48-34 70 0" ${stroke}/><path d="M312 212v-72m-28 36l28-36 28 36" ${thinStroke}/>`),
  },
  {
    slug: "cadee-bridge-homogeneous-wall-floor",
    badge: textBadge("&#936;", colors.bridges),
    body: thermalBridge("wallFloor"),
  },
  {
    slug: "cadee-bridge-homogeneous-wall-floor-balcony",
    badge: textBadge("&#936;", colors.bridges),
    body: thermalBridge("balcony"),
  },
  {
    slug: "cadee-bridge-floor-inclusions",
    badge: textBadge("&#936;", colors.bridges),
    body: thermalBridge("floorInclusion"),
  },
  {
    slug: "cadee-bridge-wall-inclusions",
    badge: textBadge("&#936;", colors.bridges),
    body: thermalBridge("wallInclusion"),
  },
  {
    slug: "cadee-bridge-homogeneous-wall-corner",
    badge: textBadge("&#936;", colors.bridges),
    body: thermalBridge("corner"),
  },
  {
    slug: "cadee-bridge-two-wall-corner",
    badge: textBadge("&#936;", colors.bridges),
    body: thermalBridge("doubleCorner"),
  },
  {
    slug: "normcontrol",
    badge: textBadge("NC", colors.normcontrol, 210),
    body: `<rect x="150" y="166" width="238" height="280" rx="12" fill="#E1E3E0" stroke="#222729" stroke-width="20"/><path d="M190 232l24 24 42-50M190 318l24 24 42-50" ${thinStroke}/><path d="M278 232h66M278 318h66" ${thinStroke}/><circle cx="394" cy="370" r="62" fill="#F1F2F0" stroke="#222729" stroke-width="18"/><path d="M438 414l40 40" ${stroke}/>` ,
  },
  {
    slug: "consequence-class",
    badge: textBadge("CC", colors.consequence, 210),
    body: `<path d="M304 166l142 50v92c0 74-50 124-142 160-92-36-142-86-142-160v-92z" fill="#D9DCDA" stroke="#222729" stroke-width="20"/><path d="M238 332v-74h132v126H238v-52m28-28h28m28 0h28m-84 44h28m28 0h28" ${thinStroke}/>` ,
  },
  {
    slug: "power-calculator",
    badge: textBadge("P", colors.electricity),
    body: `<rect x="158" y="164" width="286" height="286" rx="18" fill="#D9DCDA" stroke="#222729" stroke-width="20"/><path d="M330 198l-76 126h62l-38 94 100-142h-66z" fill="#777D7A" stroke="#222729" stroke-width="15" stroke-linejoin="round"/>`,
  },
  {
    slug: "iv-geojson",
    badge: textBadge("GIS", colors.gis, 250),
    body: `<path d="M140 214l112-50 96 52 116-50v238l-116 48-96-52-112 50z" fill="#D9DCDA" stroke="#222729" stroke-width="20" stroke-linejoin="round"/><path d="M252 164v236m96-184v236" ${thinStroke}/><path d="M196 330l62-70 82 52 70-78" ${stroke}/><g fill="#222729"><circle cx="196" cy="330" r="17"/><circle cx="258" cy="260" r="17"/><circle cx="340" cy="312" r="17"/><circle cx="410" cy="234" r="17"/></g>` ,
  },
  {
    slug: "dbn-assistant",
    badge: textBadge("AI", colors.ai, 190),
    body: `<path d="M142 190h142q42 0 42 42v196H184q-42 0-42-42z" fill="#E1E3E0" stroke="#222729" stroke-width="20"/><path d="M326 232h96q42 0 42 42v82q0 42-42 42h-42l-44 42v-42h-10z" fill="#C5C9C6" stroke="#222729" stroke-width="20"/><path d="M184 254h100m-100 58h100m-100 58h74" ${thinStroke}/>` ,
  },
  {
    slug: "ai-dbn-v-2-2-5-2023",
    badge: textBadge("AI", colors.ai, 190),
    body: `<path d="M154 402h310V252L310 166 154 252z" fill="#D9DCDA" stroke="#222729" stroke-width="20"/><path d="M234 402V292h152v110" ${stroke}/><path d="M416 182l68 24v54c0 48-34 82-68 98-34-16-68-50-68-98v-54z" fill="#F1F2F0" stroke="#222729" stroke-width="17"/>` ,
  },
  {
    slug: "ai-dbn-v-2-6-31-2021",
    badge: textBadge("AI", colors.ai, 190),
    body: wall(`<circle cx="430" cy="232" r="36" fill="#E5E3DA" stroke="#222729" stroke-width="15"/><path d="M430 330v106m-42-84l84 62m0-62l-84 62" ${thinStroke}/>`),
  },
  {
    slug: "ai-dbn-v-1-1-7-2016",
    badge: textBadge("AI", colors.ai, 190),
    body: `<path d="M304 162l142 50v96c0 74-50 124-142 160-92-36-142-86-142-160v-96z" fill="#D9DCDA" stroke="#222729" stroke-width="20"/><path d="M306 242c54 54 64 90 42 128-20 36-80 40-100 0-20-42 14-72 34-98 6 24 14 34 24 40 18-22 12-46 0-70z" fill="#777D7A" stroke="#222729" stroke-width="15"/>` ,
  },
  {
    slug: "ai-dbn-v-2-2-15-2019",
    badge: textBadge("AI", colors.ai, 190),
    body: `<path d="M150 434V224l154-70 154 70v210z" fill="#D9DCDA" stroke="#222729" stroke-width="20"/><path d="M198 270h56v58h-56zm156 0h56v58h-56zM198 356h56v58h-56zm156 0h56v58h-56z" fill="#F1F2F0" stroke="#222729" stroke-width="14"/>`,
  },
  {
    slug: "ai-dbn-v-2-5-67-2013",
    badge: textBadge("AI", colors.ai, 190),
    body: `<circle cx="302" cy="314" r="126" fill="#D9DCDA" stroke="#222729" stroke-width="20"/><circle cx="302" cy="314" r="28" fill="#222729"/><path d="M302 286c-12-72 26-104 78-92 4 54-26 90-78 120m28 0c72-12 104 26 92 78-54 4-90-26-120-78m0 28c12 72-26 104-78 92-4-54 26-90 78-120m-28 0c-72 12-104-26-92-78 54-4 90 26 120 78" fill="#8E9491" stroke="#222729" stroke-width="14" stroke-linejoin="round"/>` ,
  },
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
