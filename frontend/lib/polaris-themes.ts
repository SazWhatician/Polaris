/**
 * Polaris theme registry — a single source of truth that ties `next-themes`
 * classes, the aurora + liquid-P shader palettes, and the UI toggle labels
 * together.
 *
 * Each theme carries enough per-uniform knobs that the SAME shader source
 * can serve three fundamentally different aesthetics:
 *
 *   • dark        → additive glowing aurora on deep navy (auroraStrength ≈ 1)
 *   • light       → atmospheric colour wash on cream, bands disabled
 *                    (auroraStrength = 0, atmosphereMix = 1)
 *   • theme-amber → additive warm aurora on espresso (auroraStrength ≈ 1.1)
 */

export type PolarisThemeName = "dark" | "light" | "theme-amber";

export interface AuroraPalette {
  base: string;              // solid background
  bgDepth: string;           // slow-breathing FBM depth tint

  /* atmospheric wash — 2 colour layers, blended additively (dark) or mixed (light) */
  atmosphere1: string;
  atmosphere2: string;
  atmosphereStrength: number;
  atmosphereMix: number;     // 0 = additive glow, 1 = pure tint

  /* aurora bands — always additive; scaled by auroraStrength (0 disables) */
  band1: string;
  band2: string;
  band3: string;
  band4: string;
  band5: string;
  band5Alpha: number;
  auroraStrength: number;

  cursorTint: string;
  cursorStrength: number;

  starWarm: string;
  starCool: string;
  starIntensity: number;

  bloomStrength: number;
  vignetteMin: number;       // 1 = no vignette, 0 = fully dark corners
  grainAmount: number;
}

export interface LiquidPalette {
  color1: string;
  color2: string;
  color3: string;
  color4: string;
}

export interface PolarisTheme {
  id: PolarisThemeName;
  displayName: string;
  aurora: AuroraPalette;
  liquid: LiquidPalette;
}

export const POLARIS_THEMES: Record<PolarisThemeName, PolarisTheme> = {
  /* ── 1 · Cosmic Obsidian — deep navy with luminous sapphire / violet aurora */
  dark: {
    id: "dark",
    displayName: "Cosmic Obsidian",
    aurora: {
      base:               "#020616",
      bgDepth:            "#0A1338",

      atmosphere1:        "#1E3A8A",
      atmosphere2:        "#4C1D95",
      atmosphereStrength: 0.14,
      atmosphereMix:      0,

      band1:              "#4C68C6",   // bright sapphire lower
      band2:              "#A78BFA",   // bright violet upper
      band3:              "#6366F1",   // indigo mid
      band4:              "#1E3A8A",   // deep sapphire structural base
      band5:              "#F5C74A",   // gold accent (rare, top)
      band5Alpha:         0.40,
      auroraStrength:     0.90,

      cursorTint:         "#7C3AED",
      cursorStrength:     0.32,

      starWarm:           "#FFF0C4",
      starCool:           "#DAE6FF",
      starIntensity:      1.00,

      bloomStrength:      0.40,
      vignetteMin:        0.42,
      grainAmount:        0.010,
    },
    liquid: {
      /* pop against navy aurora — no colour matches the base */
      color1: "#3B5BDB",   // electric blue (depth without matching bg)
      color2: "#7C3AED",   // violet
      color3: "#EC4899",   // magenta pop
      color4: "#FFFFFF",   // pure white highlight
    },
  },

  /* ── 2 · Pearl Aurora — cream base with soft peachy / mauve iridescence */
  light: {
    id: "light",
    displayName: "Pearl Aurora",
    aurora: {
      base:               "#FAF6F0",
      bgDepth:            "#F0E4D5",

      atmosphere1:        "#E8D4E0",   // pale mauve wash
      atmosphere2:        "#DCE7F0",   // pale sky-blue wash
      atmosphereStrength: 0.55,
      atmosphereMix:      1.00,        // TINT, not glow

      band1:              "#000000",   // bands disabled
      band2:              "#000000",
      band3:              "#000000",
      band4:              "#000000",
      band5:              "#000000",
      band5Alpha:         0.00,
      auroraStrength:     0.00,

      cursorTint:         "#E7B8C4",   // soft rose blush
      cursorStrength:     0.28,

      starWarm:           "#000000",
      starCool:           "#000000",
      starIntensity:      0.00,        // no stars on light

      bloomStrength:      0.00,        // no bloom on light
      vignetteMin:        0.92,        // barely-there vignette
      grainAmount:        0.006,
    },
    liquid: {
      /* dark inky liquid on cream bg — bold contrast */
      color1: "#0F172A",   // deep near-black navy (max contrast to cream)
      color2: "#4C1D95",   // deep violet
      color3: "#DB2777",   // bold pink
      color4: "#F5E8ED",   // pale rose highlight
    },
  },

  /* ── 3 · Solar Amber — espresso base with copper / gold aurora */
  "theme-amber": {
    id: "theme-amber",
    displayName: "Solar Amber",
    aurora: {
      base:               "#0B0703",
      bgDepth:            "#1F1408",

      atmosphere1:        "#3E1E0A",
      atmosphere2:        "#7C2D12",
      atmosphereStrength: 0.20,
      atmosphereMix:      0,

      band1:              "#F59E0B",   // bright amber lower
      band2:              "#FDA34F",   // soft orange upper
      band3:              "#C2410C",   // burnt orange mid
      band4:              "#7C2D12",   // deep amber structural
      band5:              "#FFE5B4",   // pale gold rare top
      band5Alpha:         0.45,
      auroraStrength:     1.10,

      cursorTint:         "#E5A94B",
      cursorStrength:     0.34,

      starWarm:           "#FFC97A",
      starCool:           "#FFE9BA",
      starIntensity:      0.85,

      bloomStrength:      0.42,
      vignetteMin:        0.40,
      grainAmount:        0.012,
    },
    liquid: {
      /* bright warm liquid on espresso bg — no colour approaches the base */
      color1: "#7C2D12",   // burnt sienna (dark WARM, differs from espresso bg)
      color2: "#F59E0B",   // amber
      color3: "#FCD34D",   // bright gold
      color4: "#FFFBEB",   // cream white
    },
  },
};

export const THEME_ORDER: PolarisThemeName[] = ["dark", "light", "theme-amber"];

export function getTheme(name: string | undefined): PolarisTheme {
  if (!name) return POLARIS_THEMES.dark;
  return POLARIS_THEMES[name as PolarisThemeName] ?? POLARIS_THEMES.dark;
}
