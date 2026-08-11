export type CaptionAnimation = 'pop' | 'karaoke-highlight' | 'fade' | 'bounce' | 'typewriter';
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
    position: 'bottom'
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
    position: 'bottom'
  },
  {
    name: 'fade',
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: 30,
    color: '#E2E8F0',
    strokeColor: '#111827',
    strokeWidth: 6,
    animation: 'fade',
    position: 'center'
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
    position: 'top'
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
    position: 'bottom'
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
    position: 'center'
  }
];
