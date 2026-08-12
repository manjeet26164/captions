export type CaptionAnimation =
  | 'pop'
  | 'karaoke-highlight'
  | 'fade'
  | 'bounce'
  | 'typewriter'
  | 'glow-pulse'
  | 'highlight-box';

export type CaptionPosition = 'top' | 'center' | 'bottom';

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