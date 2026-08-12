import type { CaptionStylePreset } from '@/lib/captionStyles';
import type { WordTimestamp } from '@/components/caption-canvas-renderer';

const assTimeUnits = 100;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Mirrors the canvas preview's proportional Y placement (see getCaptionY in caption-canvas-renderer.tsx). */
function getBaseYFraction(position: CaptionStylePreset['position']) {
  if (position === 'top') {
    return 0.16;
  }

  if (position === 'center') {
    return 0.52;
  }

  return 0.82;
}

function buildPositionOverride(position: CaptionStylePreset['position'], offset: number) {
  const playResY = 1080;
  const y = clamp((getBaseYFraction(position) + offset) * playResY, 40, playResY - 40);
  return `{\\pos(960,${Math.round(y)})}`;
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

function getAnimationOverride(style: CaptionStylePreset) {
  switch (style.animation) {
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
    case 'glow-pulse': {
      const blur = Math.max(2, Math.round((style.glowBlur ?? 24) / 6));
      return `{\\fad(60,80)\\blur${blur}\\fscx104\\fscy104\\t(0,160,\\fscx100\\fscy100)}`;
    }
    case 'highlight-box':
      return '{\\fad(30,60)\\fscx106\\fscy106\\t(0,120,\\fscx100\\fscy100)}';
    default:
      return '';
  }
}

function getBorderStyle(style: CaptionStylePreset) {
  return style.backgroundColor || style.animation === 'highlight-box' ? 3 : 1;
}

function buildStyleLine(style: CaptionStylePreset) {
  const fontName = normalizeFontName(style.fontFamily);
  const isHighlightBox = style.animation === 'highlight-box';
  const isGlow = style.animation === 'glow-pulse';

  const primaryColour = hexToAssColor(isHighlightBox ? style.activeColor ?? style.color : style.color);
  const secondaryColour = hexToAssColor(style.color);
  const outlineColour = hexToAssColor(isGlow && style.glowColor ? style.glowColor : style.strokeColor);
  const backColour = isHighlightBox
    ? hexToAssColor(style.activeBackgroundColor ?? '#FFE600')
    : rgbaToAssColor(style.backgroundColor);
  const hasOpaqueBox = Boolean(style.backgroundColor) || isHighlightBox;
  const outline = hasOpaqueBox ? 0 : isGlow ? Math.max(3, Math.round(style.strokeWidth / 2)) : Math.max(2, Math.round(style.strokeWidth / 3));
  const shadow = hasOpaqueBox ? 0 : 1;

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
  style: CaptionStylePreset,
  offset = 0
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

  const positionOverride = buildPositionOverride(style.position, offset);

  const dialogue = wordTimestamps
    .filter((word) => word.word.trim().length > 0)
    .map((word) => {
      const start = Math.max(0, word.start);
      const end = Math.max(start + 0.05, word.end);
      const animationTag = getAnimationOverride(style);
      const rawWord = style.uppercase ? word.word.trim().toUpperCase() : word.word.trim();
      const text = `${positionOverride}${animationTag}${escapeAssText(rawWord)}`;

      return `Dialogue: 0,${toAssTimestamp(start)},${toAssTimestamp(end)},Default,,0,0,0,,${text}`;
    });

  return [...header, ...dialogue].join('\n');
}