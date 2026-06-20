export const pngCalculatorArtworkSlugs = new Set([
  "armcon",
  "rebar-area-bars",
  "minimum-reinforcement-area",
  "foundation-bar-anchorage",
  "concrete-exposure-class",
  "concrete-cover-durability",
  "rebar-characteristics",
  "concrete-characteristics",
  "soil-design-resistance",
  "foundation-base-pressure",
  "cassoon-load-distribution",
  "livebeamcalculator",
  "steel-structure-category-group",
  "residential-yard-areas",
]);

export function getCalculatorArtworkPath(slug: string): string {
  const extension = pngCalculatorArtworkSlugs.has(slug) ? "png" : "svg";

  return `/calculator-icons/${slug}.${extension}`;
}
