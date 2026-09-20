/**
 * Design tokens for the Tracheostomy Care app.
 *
 * The palette is taken from the FAHS shield in `assets/FAHSIcon.png`: a coral shield holding a
 * mint lotus. Mint carries the surfaces, coral is the single punchy accent and is reserved for
 * the one action that matters on each screen — so it never stops meaning "tap this".
 *
 * Contrast: `ink` and `inkMuted` both clear WCAG AA on `canvas`. White on `accent` is 3.7:1, which
 * is AA for large text only, so text on a coral fill is always >= 17px bold (`type.button`).
 * Anything smaller on coral uses `accentDeep` (5.1:1).
 */
import { Platform } from 'react-native';

export const colors = {
  // Surfaces
  canvas: '#F0FCFA', // app background — the lightest mint
  mint: '#E0FAF6', // tinted blocks, chips, image placeholders
  mintDeep: '#CDF2EB', // decorative shapes, dividers on mint
  surface: '#FFFFFF', // cards
  border: '#CCEDE7', // hairlines on mint

  // Text
  ink: '#0B3B37', // headings and body
  inkMuted: '#456F6A', // secondary text
  inkFaint: '#7FA6A1', // captions, metadata

  // The one punchy colour
  accent: '#E2574C', // primary actions, active states
  accentDeep: '#B8392C', // pressed state, small text on light coral
  accentSoft: '#FDEDEB', // coral tint backgrounds

  // Media
  videoBg: '#0B2321', // letterboxing behind video
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
};

/**
 * Fixed heights for tappable controls.
 *
 * Urdu renders in a Naskh face whose intrinsic line height is roughly half again as tall as the
 * Latin equivalent at the same font size. With `paddingVertical` that difference flows straight
 * into the control's height, so a button visibly grows when the language is switched — and اردو
 * and English pills sitting side by side end up different sizes.
 *
 * Fixing the height and centring the label decouples the control from the script. Both values
 * comfortably clear the tallest label either language produces, so nothing is clipped.
 */
export const controlHeight = {
  button: 56, // label at type.button (17px)
  pill: 44, // label at 15px
};

/**
 * Urdu renders in a Naskh face whose ascenders and diacritics sit well above the Latin cap
 * height. React Native clips a glyph when the explicit `lineHeight` is smaller than the font's
 * natural one, which is how the Urdu title lost its top edge at the old 1.2x leading.
 *
 * One generous ratio is used for every language rather than a per-script value, so both scripts
 * occupy exactly the same vertical space and switching language cannot move the layout.
 */
const LINE_HEIGHT_RATIO = 1.55;

export const leading = (fontSize) => Math.round(fontSize * LINE_HEIGHT_RATIO);

export const type = {
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: colors.inkFaint,
  },
  display: {
    fontSize: 32,
    lineHeight: leading(32),
    fontWeight: '700',
    letterSpacing: -0.6,
    color: colors.ink,
  },
  title: {
    fontSize: 22,
    lineHeight: leading(22),
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.ink,
  },
  heading: {
    fontSize: 17,
    lineHeight: leading(17),
    fontWeight: '600',
    color: colors.ink,
  },
  body: {
    fontSize: 15,
    lineHeight: leading(15),
    fontWeight: '400',
    color: colors.inkMuted,
  },
  caption: {
    fontSize: 13,
    lineHeight: leading(13),
    fontWeight: '500',
    color: colors.inkFaint,
  },
  button: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
};

/**
 * Soft, mint-tinted elevation. Level 1 is for cards, 2 for raised surfaces and primary buttons.
 */
export function shadow(level = 1) {
  if (level === 0) return {};
  const config = {
    1: { opacity: 0.07, radius: 14, offsetY: 5, elevation: 2 },
    2: { opacity: 0.13, radius: 22, offsetY: 10, elevation: 6 },
  }[level];

  return Platform.select({
    ios: {
      shadowColor: colors.ink,
      shadowOpacity: config.opacity,
      shadowRadius: config.radius,
      shadowOffset: { width: 0, height: config.offsetY },
    },
    android: { elevation: config.elevation },
    default: {},
  });
}
