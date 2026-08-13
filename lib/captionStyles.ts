export type CaptionAnimation =
  | 'pop'
  | 'karaoke-highlight'
  | 'fade'
  | 'bounce'
  | 'typewriter'
  | 'glow-pulse'
  | 'highlight-box';

export type CaptionPosition = 'top' | 'center' | 'bottom';

/**
 * Per-word style override used by "stylish" CapCut-style presets, where every
 * word inside a group gets a different font weight/style/size/color and a
 * slight position wobble instead of one uniform look for the whole group.
 * Variants are applied by cycling through this array using the word's index
 * inside the currently visible group (index % variants.length).
 */
export type WordStyleVariant = {
  /** CSS font-weight, e.g. '400' (thin) or '900' (extra bold). */
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  /** Overrides the preset's fontFamily just for this word. */
  fontFamily?: string;
  /** Multiplier applied to the preset's base fontSize. */
  scale?: number;
  /** Vertical pixel shift (negative = up) for a staggered, stylish look. */
  yOffset?: number;
  /** Rotation in degrees for a playful tilted-word look. */
  rotation?: number;
  /** Overrides the preset's fill color just for this word. */
  color?: string;
  /** Overrides the preset's stroke width just for this word. */
  strokeWidth?: number;
};

export type CaptionStylePreset = {
  name: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  backgroundColor?: string;
  animation: CaptionAnimation;
  position: CaptionPosition;
  /** Renders every word in caps, MrBeast/Hinglish "shouting" style. */
  uppercase?: boolean;
  /** Glow color used behind the text for `glow-pulse`. */
  glowColor?: string;
  /** Blur radius (px) for the glow shadow. */
  glowBlur?: number;
  /** Text color of the currently active word for `highlight-box`. */
  activeColor?: string;
  /** Pill/box background color drawn behind the active word for `highlight-box`. */
  activeBackgroundColor?: string;
  /** How many words are shown on screen together (CapCut-style chunking). Defaults to 3. */
  wordsPerGroup?: number;
  /** Per-word font/position variants, cycled across the visible group (CapCut "stylish" look). */
  wordStyleVariants?: WordStyleVariant[];
};

export const captionStylePresets: CaptionStylePreset[] = [
  {
    name: 'pop',
    fontFamily: 'Poppins, Arial, sans-serif',
    fontSize: 34,
    color: '#F8FAFC',
    strokeColor: '#000000',
    strokeWidth: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    animation: 'pop',
    position: 'bottom',
    wordsPerGroup: 3
  },
  {
    name: 'karaoke-highlight',
    fontFamily: 'Montserrat, Arial, sans-serif',
    fontSize: 32,
    color: '#FDE68A',
    strokeColor: '#0F172A',
    strokeWidth: 7,
    backgroundColor: 'rgba(2, 6, 23, 0.32)',
    animation: 'karaoke-highlight',
    position: 'bottom',
    wordsPerGroup: 4
  },
  {
    name: 'fade',
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: 30,
    color: '#E2E8F0',
    strokeColor: '#111827',
    strokeWidth: 6,
    animation: 'fade',
    position: 'center',
    wordsPerGroup: 4
  },
  {
    name: 'bounce',
    fontFamily: 'Arial Black, Arial, sans-serif',
    fontSize: 36,
    color: '#F9FAFB',
    strokeColor: '#111827',
    strokeWidth: 8,
    backgroundColor: 'rgba(17, 24, 39, 0.28)',
    animation: 'bounce',
    position: 'top',
    wordsPerGroup: 3
  },
  {
    name: 'typewriter',
    fontFamily: 'SF Pro Display, Arial, sans-serif',
    fontSize: 28,
    color: '#FFFFFF',
    strokeColor: '#1E293B',
    strokeWidth: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
    animation: 'typewriter',
    position: 'bottom',
    wordsPerGroup: 5
  },
  {
    name: 'minimal',
    fontFamily: 'Manrope, Arial, sans-serif',
    fontSize: 33,
    color: '#A7F3D0',
    strokeColor: '#052E16',
    strokeWidth: 7,
    backgroundColor: 'rgba(6, 78, 59, 0.24)',
    animation: 'fade',
    position: 'center',
    wordsPerGroup: 4
  },
  {
    name: 'mrbeast',
    fontFamily: 'Arial Black, Arial, sans-serif',
    fontSize: 40,
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 12,
    animation: 'highlight-box',
    position: 'center',
    uppercase: true,
    activeColor: '#000000',
    activeBackgroundColor: '#FFE600',
    wordsPerGroup: 2
  },
  {
    name: 'glow-yellow',
    fontFamily: 'Poppins, Arial, sans-serif',
    fontSize: 38,
    color: '#FDE047',
    strokeColor: '#78350F',
    strokeWidth: 4,
    animation: 'glow-pulse',
    position: 'bottom',
    uppercase: true,
    glowColor: '#FACC15',
    glowBlur: 28,
    wordsPerGroup: 3
  },
  {
    name: 'neon-glow',
    fontFamily: 'Montserrat, Arial, sans-serif',
    fontSize: 36,
    color: '#F472B6',
    strokeColor: '#3B0764',
    strokeWidth: 4,
    animation: 'glow-pulse',
    position: 'center',
    glowColor: '#C026D3',
    glowBlur: 32,
    wordsPerGroup: 3
  },
  {
    name: 'hinglish-highlight',
    fontFamily: 'Poppins, Arial, sans-serif',
    fontSize: 36,
    color: '#F8FAFC',
    strokeColor: '#000000',
    strokeWidth: 8,
    animation: 'highlight-box',
    position: 'bottom',
    activeColor: '#000000',
    activeBackgroundColor: '#22D3EE',
    wordsPerGroup: 3
  },
  {
    name: 'stylish-mix',
    fontFamily: 'Poppins, Arial, sans-serif',
    fontSize: 38,
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 9,
    animation: 'pop',
    position: 'bottom',
    uppercase: true,
    wordsPerGroup: 5,
    wordStyleVariants: [
      { fontWeight: '900', fontStyle: 'normal', scale: 1.12, yOffset: -4, rotation: -3, color: '#FFFFFF' },
      { fontWeight: '900', fontStyle: 'normal', scale: 1.05, yOffset: 6, rotation: 2, color: '#FDE047' },
      { fontWeight: '400', fontStyle: 'italic', fontFamily: 'Georgia, "Times New Roman", serif', scale: 0.86, yOffset: 3, rotation: -5, color: '#22D3EE' },
      { fontWeight: '900', fontStyle: 'normal', scale: 1.1, yOffset: -6, rotation: 4, color: '#F472B6' },
      { fontWeight: '400', fontStyle: 'italic', fontFamily: 'Georgia, "Times New Roman", serif', scale: 0.9, yOffset: 5, rotation: -2, color: '#FFFFFF' }
    ]
  },
  {
    name: 'break-the-cage',
    fontFamily: 'Arial Black, Arial, sans-serif',
    fontSize: 38,
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 10,
    animation: 'highlight-box',
    position: 'center',
    uppercase: true,
    activeColor: '#000000',
    activeBackgroundColor: '#4ADE80',
    wordsPerGroup: 2
  }
];