import type { CaptionAnimation, CaptionStylePreset } from '@/lib/captionStyles';
import type { WordTimestamp } from '@/components/caption-canvas-renderer';

const assTimeUnits = 100;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toAssTimestamp(seconds: number) {
  const totalCentiseconds = Math.max(0, Math.round(seconds * assTimeUnits));
  const centiseconds = totalCentiseconds % assTimeUnits;
  const totalSeconds = Math.floor(totalCentiseconds / assTimeUnits);
  const secondsPart = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutesPart = totalMinutes % 60;
  const hoursPart = Math.floor(totalMinutes / 60);

  return `${hoursPart}:${String(minutesPart).padStart(2, '0')}:${String(secondsPart).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

function escapeAssText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\r?\n/g, '\\N');
}

function normalizeFontName(fontFamily: string) {
  return fontFamily.split(',')[0]?.trim() || 'Arial';
}

function hexToAssColor(hex: string, alpha = '00') {
  const normalized = hex.trim().replace(/^#/, '');
  const full = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
    : normalized;

  if (!/^([0-9a-fA-F]{6})$/.test(full)) {
    return `&H${alpha}FFFFFF`;
  }

  const red = full.slice(0, 2);
  const green = full.slice(2, 4);
  const blue = full.slice(4, 6);

  return `&H${alpha}${blue}${green}${red}`;
}

function rgbaToAssColor(value: string | undefined) {
  if (!value) {
    return '&H00000000';
  }

  const match = value.match(
    /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d*\.?\d+))?\s*\)/i
  );

  if (!match) {
    return '&H00000000';
  }

  const red = clamp(Number(match[1]), 0, 255).toString(16).padStart(2, '0').toUpperCase();
  const green = clamp(Number(match[2]), 0, 255).toString(16).padStart(2, '0').toUpperCase();
  const blue = clamp(Number(match[3]), 0, 255).toString(16).padStart(2, '0').toUpperCase();
  const alphaFloat = match[4] === undefined ? 1 : clamp(Number(match[4]), 0, 1);
  const alpha = Math.round((1 - alphaFloat) * 255).toString(16).padStart(2, '0').toUpperCase();

  return `&H${alpha}${blue}${green}${red}`;
}

function getAlignment(position: CaptionStylePreset['position']) {
  if (position === 'top') {
    return 8;
  }

  if (position === 'center') {
    return 5;
  }

  return 2;
}

function getMarginVertical(position: CaptionStylePreset['position']) {
  if (position === 'top') {
    return 120;
  }

  if (position === 'center') {
    return 70;
  }

  return 92;
}

function getAnimationOverride(animation: CaptionAnimation) {
  switch (animation) {
    case 'pop':
      return '{\\fad(60,80)\\fscx108\\fscy108\\t(0,160,\\fscx100\\fscy100)}';
    case 'karaoke-highlight':
      return '{\\fad(30,60)}';
    case 'fade':
      return '{\\fad(110,140)}';
    case 'bounce':
      return '{\\fad(30,50)\\t(0,140,\\fscy114)\\t(140,260,\\fscy100)}';
    case 'typewriter':
      return '{\\fad(30,40)}';
    default:
      return '';
  }
}

function getBorderStyle(style: CaptionStylePreset) {
  return style.backgroundColor ? 3 : 1;
}

function buildStyleLine(style: CaptionStylePreset) {
  const fontName = normalizeFontName(style.fontFamily);
  const primaryColour = hexToAssColor(style.color);
  const secondaryColour = hexToAssColor(style.color);
  const outlineColour = hexToAssColor(style.strokeColor);
  const backColour = rgbaToAssColor(style.backgroundColor);
  const outline = style.backgroundColor ? 0 : Math.max(2, Math.round(style.strokeWidth / 3));
  const shadow = style.backgroundColor ? 0 : 1;

  return [
    'Style: Default',
    fontName,
    style.fontSize,
    primaryColour,
    secondaryColour,
    outlineColour,
    backColour,
    '-1',
    '0',
    '0',
    '0',
    '100',
    '100',
    '0',
    '0',
    String(getBorderStyle(style)),
    String(outline),
    String(shadow),
    String(getAlignment(style.position)),
    '30',
    '30',
    String(getMarginVertical(style.position)),
    '1'
  ].join(',');
}

export function buildAssSubtitleFile(
  wordTimestamps: WordTimestamp[],
  style: CaptionStylePreset
) {
  const header = [
    '[Script Info]',
    'ScriptType: v4.00+',
    'PlayResX: 1920',
    'PlayResY: 1080',
    'WrapStyle: 2',
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    buildStyleLine(style),
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'
  ];

  const dialogue = wordTimestamps
    .filter((word) => word.word.trim().length > 0)
    .map((word) => {
      const start = Math.max(0, word.start);
      const end = Math.max(start + 0.05, word.end);
      const animationTag = getAnimationOverride(style.animation);
      const text = `${animationTag}${escapeAssText(word.word.trim())}`;

      return `Dialogue: 0,${toAssTimestamp(start)},${toAssTimestamp(end)},Default,,0,0,0,,${text}`;
    });

  return [...header, ...dialogue].join('\n');
}
