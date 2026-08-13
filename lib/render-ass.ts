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

function dimHexColor(hex: string, factor: number) {
  const normalized = hex.trim().replace(/^#/, '');
  const full = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;

  if (!/^([0-9a-fA-F]{6})$/.test(full)) {
    return hex;
  }

  const channel = (start: number) => Math.round(parseInt(full.slice(start, start + 2), 16) * factor);
  const toHex = (value: number) => clamp(value, 0, 255).toString(16).padStart(2, '0');

  return `#${toHex(channel(0))}${toHex(channel(2))}${toHex(channel(4))}`;
}

function getBorderStyle(style: CaptionStylePreset) {
  return style.backgroundColor ? 3 : 1;
}

function buildStyleLine(style: CaptionStylePreset) {
  const fontName = normalizeFontName(style.fontFamily);
  const isKaraoke = style.animation === 'karaoke-highlight';
  const isHighlightBox = style.animation === 'highlight-box';
  const isGlow = style.animation === 'glow-pulse';

  let primaryColour: string;
  let secondaryColour: string;

  if (isKaraoke) {
    // \k karaoke tags reveal Primary colour over Secondary as each word plays.
    primaryColour = hexToAssColor(style.color);
    secondaryColour = hexToAssColor(dimHexColor(style.color, 0.5));
  } else if (isHighlightBox) {
    primaryColour = hexToAssColor(style.activeBackgroundColor ?? style.color);
    secondaryColour = hexToAssColor(style.color);
  } else {
    primaryColour = hexToAssColor(style.color);
    secondaryColour = hexToAssColor(style.color);
  }

  const outlineColour = hexToAssColor(isGlow && style.glowColor ? style.glowColor : style.strokeColor);
  const backColour = rgbaToAssColor(style.backgroundColor);
  const hasOpaqueBox = Boolean(style.backgroundColor);
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

const defaultWordsPerGroup = 3;

function groupWords(words: WordTimestamp[], groupSize: number) {
  const safeGroupSize = Math.max(1, groupSize);
  const groups: WordTimestamp[][] = [];

  for (let index = 0; index < words.length; index += safeGroupSize) {
    groups.push(words.slice(index, index + safeGroupSize));
  }

  return groups;
}

/** Builds the inline ASS override tag for one word using its wordStyleVariants entry, if the preset defines any. */
function buildWordVariantTag(style: CaptionStylePreset, groupIndex: number, fontOverride?: string | null) {
  const variants = style.wordStyleVariants;
  if (!variants || variants.length === 0) {
    return '';
  }

  const variant = variants[groupIndex % variants.length];
  const tags: string[] = [];

  tags.push(variant.fontWeight && Number(variant.fontWeight) >= 700 ? '\\b1' : '\\b0');
  tags.push(variant.fontStyle === 'italic' ? '\\i1' : '\\i0');

  const effectiveFont = fontOverride || variant.fontFamily;
  if (effectiveFont) {
    tags.push(`\\fn${normalizeFontName(effectiveFont)}`);
  }

  if (variant.scale) {
    const scalePercent = Math.round(variant.scale * 100);
    tags.push(`\\fscx${scalePercent}\\fscy${scalePercent}`);
  }

  if (variant.rotation) {
    tags.push(`\\frz${variant.rotation}`);
  }

  if (variant.color) {
    tags.push(`\\c${hexToAssColor(variant.color)}`);
  }

  return tags.length > 0 ? `{${tags.join('')}}` : '';
}

/** Builds the inline ASS override tag for one LINE using its lineStyleVariants entry, if the preset defines any. */
function buildLineVariantTag(style: CaptionStylePreset, lineIndex: number, fontOverride?: string | null) {
  const variants = style.lineStyleVariants;
  if (!variants || variants.length === 0) {
    return '';
  }

  const variant = variants[lineIndex % variants.length];
  const tags: string[] = [];

  tags.push(variant.fontWeight && Number(variant.fontWeight) >= 700 ? '\\b1' : '\\b0');
  tags.push(variant.fontStyle === 'italic' ? '\\i1' : '\\i0');

  const effectiveFont = fontOverride || variant.fontFamily;
  if (effectiveFont) {
    tags.push(`\\fn${normalizeFontName(effectiveFont)}`);
  }

  if (variant.scale) {
    const scalePercent = Math.round(variant.scale * 100);
    tags.push(`\\fscx${scalePercent}\\fscy${scalePercent}`);
  }

  if (variant.color) {
    tags.push(`\\c${hexToAssColor(variant.color)}`);
  }

  return tags.length > 0 ? `{${tags.join('')}}` : '';
}

function buildGroupText(
  group: WordTimestamp[],
  style: CaptionStylePreset,
  positionOverride: string,
  fontOverride?: string | null
) {
  const usesKaraoke = style.animation === 'karaoke-highlight' || style.animation === 'highlight-box';
  const toDisplayWord = (word: string) => escapeAssText(style.uppercase ? word.trim().toUpperCase() : word.trim());
  const hasWordVariants = Boolean(style.wordStyleVariants?.length);
  const hasLineVariants = Boolean(style.lineStyleVariants?.length) && Boolean(style.wordsPerLine);

  if (!usesKaraoke && hasLineVariants) {
    // Cascade presets: hard-break into fixed-size lines (\N) so line N always renders with
    // lineStyleVariants[N], the same way the canvas preview forces fixed-size lines instead
    // of relying on libass's own auto-wrap (which we can't predict from Node).
    const animationTag = getAnimationOverride(style);
    const lineSize = Math.max(1, style.wordsPerLine!);
    const lines: WordTimestamp[][] = [];
    for (let index = 0; index < group.length; index += lineSize) {
      lines.push(group.slice(index, index + lineSize));
    }
    const joined = lines
      .map((lineWords, lineIndex) => {
        const words = lineWords.map((word) => toDisplayWord(word.word)).join(' ');
        return `${buildLineVariantTag(style, lineIndex, fontOverride)}${words}`;
      })
      .join('\\N');
    return `${positionOverride}${animationTag}${joined}`;
  }

  if (!usesKaraoke && hasWordVariants) {
    const animationTag = getAnimationOverride(style);
    const joined = group
      .map((word, index) => `${buildWordVariantTag(style, index, fontOverride)}${toDisplayWord(word.word)}{\\r}`)
      .join(' ');
    return `${positionOverride}${animationTag}${joined}`;
  }

  if (!usesKaraoke) {
    const animationTag = getAnimationOverride(style);
    const joined = group.map((word) => toDisplayWord(word.word)).join(' ');
    return `${positionOverride}${animationTag}${joined}`;
  }

  const groupStart = group[0].start;
  const fadeTag = '\\fad(30,30)';
  const karaokeSyllables = group
    .map((word, index) => {
      const nextWord = group[index + 1];
      const segmentEnd = nextWord ? nextWord.start : word.end;
      const durationCentiseconds = Math.max(1, Math.round((segmentEnd - word.start) * 100));
      return `{\\k${durationCentiseconds}}${toDisplayWord(word.word)}`;
    })
    .join(' ');

  return `${positionOverride}{${fadeTag}}${karaokeSyllables}`;
}

export function buildAssSubtitleFile(
  wordTimestamps: WordTimestamp[],
  style: CaptionStylePreset,
  offset = 0,
  /** Global caption size multiplier from the in-browser size adjuster (1 = preset default). */
  scale = 1,
  /** Global font family override from the in-browser font picker. Falsy = use the preset's own fonts. */
  fontFamily?: string | null
) {
  const scaledStyle: CaptionStylePreset = {
    ...style,
    fontSize: Math.round(style.fontSize * (Number.isFinite(scale) ? scale : 1)),
    fontFamily: fontFamily || style.fontFamily
  };

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
    buildStyleLine(scaledStyle),
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'
  ];

  const positionOverride = buildPositionOverride(scaledStyle.position, offset);
  const cleanWords = wordTimestamps.filter((word) => word.word.trim().length > 0);
  const groups = groupWords(cleanWords, scaledStyle.wordsPerGroup ?? defaultWordsPerGroup);

  const dialogue = groups
    .filter((group) => group.length > 0)
    .map((group) => {
      const start = Math.max(0, group[0].start);
      const lastWord = group[group.length - 1];
      const end = Math.max(start + 0.05, lastWord.end);
      const text = buildGroupText(group, scaledStyle, positionOverride, fontFamily);

      return `Dialogue: 0,${toAssTimestamp(start)},${toAssTimestamp(end)},Default,,0,0,0,,${text}`;
    });

  return [...header, ...dialogue].join('\n');
}