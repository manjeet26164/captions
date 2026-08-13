'use client';

import { useCaptionStyle } from '@/components/caption-style-provider';
import type { CaptionStylePreset } from '@/lib/captionStyles';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

export type WordTimestamp = {
  word: string;
  start: number;
  end: number;
};

type CaptionCanvasRendererProps = {
  videoSrc: string;
  sourceFile: File | null;
  wordTimestamps: WordTimestamp[];
  className?: string;
};

type CaptionWordVisual = {
  word: WordTimestamp;
  opacity: number;
  scale: number;
  yOffset: number;
  color: string;
  shouldRender: boolean;
  /** Index of this word inside the currently visible group, used to pick a wordStyleVariants entry. */
  groupIndex: number;
};

const highlightColor = '#fde68a';
const defaultWordsPerGroup = 3;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getActiveWordIndex(wordTimestamps: WordTimestamp[], currentTime: number) {
  if (wordTimestamps.length === 0) {
    return -1;
  }

  let low = 0;
  let high = wordTimestamps.length - 1;
  let candidate = 0;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const currentWord = wordTimestamps[middle];

    if (currentTime < currentWord.start) {
      high = middle - 1;
    } else {
      candidate = middle;
      low = middle + 1;
    }
  }

  return candidate;
}

function getVisibleGroup(wordTimestamps: WordTimestamp[], activeIndex: number, groupSize: number) {
  if (activeIndex < 0 || wordTimestamps.length === 0) {
    return [];
  }

  const safeGroupSize = Math.max(1, groupSize);
  const groupStart = Math.floor(activeIndex / safeGroupSize) * safeGroupSize;
  const groupEnd = Math.min(wordTimestamps.length, groupStart + safeGroupSize);
  return wordTimestamps.slice(groupStart, groupEnd);
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const limitedRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + limitedRadius, y);
  context.lineTo(x + width - limitedRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + limitedRadius);
  context.lineTo(x + width, y + height - limitedRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - limitedRadius, y + height);
  context.lineTo(x + limitedRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - limitedRadius);
  context.lineTo(x, y + limitedRadius);
  context.quadraticCurveTo(x, y, x + limitedRadius, y);
  context.closePath();
}

function getCaptionY(
  position: CaptionStylePreset['position'],
  canvasHeight: number,
  textBlockHeight: number,
  offset: number
) {
  const nudge = canvasHeight * offset;

  if (position === 'top') {
    return clamp(canvasHeight * 0.16 + nudge, 8, canvasHeight - textBlockHeight - 8);
  }

  if (position === 'center') {
    return clamp(canvasHeight * 0.52 + nudge, 8, canvasHeight - textBlockHeight - 8);
  }

  return clamp(canvasHeight * 0.82 - textBlockHeight + nudge, 8, canvasHeight - textBlockHeight - 8);
}

function createWordVisuals(
  style: CaptionStylePreset,
  words: WordTimestamp[],
  activeIndex: number,
  currentTime: number
): CaptionWordVisual[] {
  return words.map((word, index) => {
    const progress = word.end > word.start
      ? clamp((currentTime - word.start) / (word.end - word.start), 0, 1)
      : 1;
    const isActive = index === activeIndex;
    const isPast = index < activeIndex;
    const isFuture = index > activeIndex;

    if (style.animation === 'typewriter' && isFuture) {
      return {
        word,
        opacity: 0,
        scale: 1,
        yOffset: 0,
        color: style.color,
        shouldRender: false,
        groupIndex: index
      };
    }

    if (style.animation === 'karaoke-highlight') {
      return {
        word,
        opacity: isActive ? 1 : isPast ? 0.72 : 0.45,
        scale: isActive ? 1.08 : 1,
        yOffset: 0,
        color: isActive ? highlightColor : style.color,
        shouldRender: true,
        groupIndex: index
      };
    }

    if (style.animation === 'pop') {
      return {
        word,
        opacity: isActive ? 1 : 0.8,
        scale: isActive ? 1.12 - progress * 0.04 : 1,
        yOffset: 0,
        color: style.color,
        shouldRender: true,
        groupIndex: index
      };
    }

    if (style.animation === 'bounce') {
      return {
        word,
        opacity: isActive ? 1 : 0.84,
        scale: 1,
        yOffset: isActive ? -8 - progress * 4 : 0,
        color: style.color,
        shouldRender: true,
        groupIndex: index
      };
    }

    if (style.animation === 'glow-pulse') {
      return {
        word,
        opacity: isActive ? 1 : 0.82,
        scale: isActive ? 1.06 : 1,
        yOffset: 0,
        color: style.color,
        shouldRender: true,
        groupIndex: index
      };
    }

    if (style.animation === 'highlight-box') {
      return {
        word,
        opacity: 1,
        scale: isActive ? 1.05 : 1,
        yOffset: 0,
        color: isActive ? (style.activeColor ?? style.color) : style.color,
        shouldRender: true,
        groupIndex: index
      };
    }

    return {
      word,
      opacity: isActive ? 1 : 0.72,
      scale: 1,
      yOffset: 0,
      color: style.color,
      shouldRender: true,
      groupIndex: index
    };
  });
}

/** Picks the per-word font/color/position override for a "stylish" preset, cycling through wordStyleVariants. */
function getWordVariant(style: CaptionStylePreset, groupIndex: number) {
  const variants = style.wordStyleVariants;
  if (!variants || variants.length === 0) {
    return undefined;
  }
  return variants[groupIndex % variants.length];
}

/** Picks the per-line font/color/size override for "cascade" presets, cycling through lineStyleVariants. */
function getLineVariant(style: CaptionStylePreset, lineIndex: number) {
  const variants = style.lineStyleVariants;
  if (!variants || variants.length === 0) {
    return undefined;
  }
  return variants[lineIndex % variants.length];
}

/** Splits words into fixed-size lines (used by cascade presets instead of pixel-width auto-wrap so the same line always gets the same variant). */
function chunkWordsIntoLines<T>(items: T[], size: number) {
  const safeSize = Math.max(1, size);
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += safeSize) {
    chunks.push(items.slice(index, index + safeSize));
  }
  return chunks;
}

/** Builds a canvas font string for a word, honoring a wordStyleVariants override where present. */
function buildWordFont(style: CaptionStylePreset, variant: ReturnType<typeof getWordVariant>, baseFontSize: number) {
  const weight = variant?.fontWeight ?? '700';
  const fontStyle = variant?.fontStyle === 'italic' ? 'italic ' : '';
  const size = Math.round(baseFontSize * (variant?.scale ?? 1));
  const family = variant?.fontFamily ?? style.fontFamily;
  return `${fontStyle}${weight} ${size}px ${family}`;
}

export function CaptionCanvasRenderer({ videoSrc, sourceFile, wordTimestamps, className }: CaptionCanvasRendererProps) {
  const { selectedStyle, captionOffset, setCaptionOffset, captionScale, setCaptionScale } = useCaptionStyle();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const dragStateRef = useRef<{ startClientY: number; startOffset: number } | null>(null);
  const [isDraggingCaption, setIsDraggingCaption] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exportFileName, setExportFileName] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'rendering' | 'done' | 'error'>('idle');
  const [exportError, setExportError] = useState<string | null>(null);
  const [editableWords, setEditableWords] = useState<WordTimestamp[]>(wordTimestamps);
  const [selectedWordIndex, setSelectedWordIndex] = useState(0);

  const hasWords = wordTimestamps.length > 0;

  useEffect(() => {
    return () => {
      if (exportUrl) {
        URL.revokeObjectURL(exportUrl);
      }
    };
  }, [exportUrl]);

  useEffect(() => {
    setEditableWords(wordTimestamps);
    setSelectedWordIndex(0);
  }, [wordTimestamps]);

  const updateSelectedWord = useCallback((patch: Partial<WordTimestamp>) => {
    setEditableWords((currentWords) => {
      const nextWords = currentWords.map((word, index) =>
        index === selectedWordIndex ? { ...word, ...patch } : word
      );

      return nextWords.map((word, index) => {
        const previousWord = nextWords[index - 1];
        const nextWord = nextWords[index + 1];
        const normalizedStart = Number.isFinite(word.start) ? Math.max(0, word.start) : 0;
        const minimumEnd = normalizedStart + 0.05;
        const normalizedEnd = Number.isFinite(word.end) ? Math.max(minimumEnd, word.end) : minimumEnd;

        const safeStart = previousWord ? Math.max(previousWord.end + 0.01, normalizedStart) : normalizedStart;
        const safeEnd = nextWord ? Math.min(nextWord.start - 0.01, normalizedEnd) : normalizedEnd;

        return {
          ...word,
          start: safeStart,
          end: Math.max(safeStart + 0.05, safeEnd)
        };
      });
    });
  }, [selectedWordIndex]);

  const nudgeSelectedWord = useCallback((delta: number) => {
    setEditableWords((currentWords) =>
      currentWords.map((word, index) => {
        if (index !== selectedWordIndex) {
          return word;
        }

        const previousWord = currentWords[index - 1];
        const nextWord = currentWords[index + 1];
        const nextStart = Math.max(0, word.start + delta);
        const nextEnd = Math.max(nextStart + 0.05, word.end + delta);

        return {
          ...word,
          start: previousWord ? Math.max(previousWord.end + 0.01, nextStart) : nextStart,
          end: nextWord ? Math.min(nextWord.start - 0.01, nextEnd) : nextEnd
        };
      })
    );
  }, [selectedWordIndex]);

  const stopFrameLoop = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video || !video.videoWidth || !video.videoHeight) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(video.videoWidth * devicePixelRatio);
    canvas.height = Math.floor(video.videoHeight * devicePixelRatio);
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
  }, []);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video || video.readyState < 2) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const cssWidth = video.videoWidth;
    const cssHeight = video.videoHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;

    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    context.clearRect(0, 0, cssWidth, cssHeight);
    context.drawImage(video, 0, 0, cssWidth, cssHeight);

    if (editableWords.length === 0) {
      return;
    }

    const currentTime = video.currentTime;
    const activeIndex = getActiveWordIndex(editableWords, currentTime);
    const visibleWords = getVisibleGroup(editableWords, activeIndex, selectedStyle.wordsPerGroup ?? defaultWordsPerGroup);
    const visuals = createWordVisuals(selectedStyle, visibleWords, activeIndex, currentTime).filter(
      (item) => item.shouldRender
    );

    if (visuals.length === 0) {
      return;
    }

    const fontSize = selectedStyle.fontSize * captionScale;
    const useLineVariants = Boolean(selectedStyle.lineStyleVariants?.length) && Boolean(selectedStyle.wordsPerLine);
    const hasWordVariants = Boolean(selectedStyle.wordStyleVariants?.length);
    const activeVariantSet = selectedStyle.lineStyleVariants?.length
      ? selectedStyle.lineStyleVariants
      : hasWordVariants
        ? selectedStyle.wordStyleVariants
        : undefined;
    const maxVariantScale = activeVariantSet
      ? Math.max(1, ...activeVariantSet.map((variant) => variant.scale ?? 1))
      : 1;
    const lineHeight = fontSize * 1.45 * maxVariantScale;
    const textPaddingX = Math.max(20, fontSize * 0.65);
    const textPaddingY = Math.max(12, fontSize * 0.38 * maxVariantScale);
    const maxTextWidth = cssWidth * 0.84;

    context.font = `700 ${fontSize}px ${selectedStyle.fontFamily}`;
    context.textBaseline = 'top';
    context.textAlign = 'left';
    context.lineJoin = 'round';
    context.miterLimit = 2;

    const displayText = (text: string) => (selectedStyle.uppercase ? text.toUpperCase() : text);

    const spaceWidth = context.measureText(' ').width;
    const lines: { words: CaptionWordVisual[]; width: number }[] = [];

    if (useLineVariants) {
      // Cascade presets: force a fixed word count per line so line N always maps to the same
      // style variant (big word, then smaller line, then colored line, etc), instead of
      // auto-wrapping by pixel width, which would shuffle which words land on which line.
      const chunks = chunkWordsIntoLines(visuals, selectedStyle.wordsPerLine!);
      chunks.forEach((chunk, lineIndex) => {
        const lineVariant = getLineVariant(selectedStyle, lineIndex);
        context.font = buildWordFont(selectedStyle, lineVariant, fontSize);
        let width = 0;
        chunk.forEach((visual, wordIndex) => {
          width += context.measureText(displayText(visual.word.word)).width;
          if (wordIndex < chunk.length - 1) {
            width += spaceWidth;
          }
        });
        lines.push({ words: chunk, width });
      });
    } else {
      let currentLine: CaptionWordVisual[] = [];
      let currentLineWidth = 0;

      visuals.forEach((visual) => {
        const wordVariant = getWordVariant(selectedStyle, visual.groupIndex);
        context.font = buildWordFont(selectedStyle, wordVariant, fontSize);
        const wordWidth = context.measureText(displayText(visual.word.word)).width;
        const nextWidth = currentLine.length === 0 ? wordWidth : currentLineWidth + spaceWidth + wordWidth;

        if (currentLine.length > 0 && nextWidth > maxTextWidth) {
          lines.push({ words: currentLine, width: currentLineWidth });
          currentLine = [visual];
          currentLineWidth = wordWidth;
          return;
        }

        if (currentLine.length === 0) {
          currentLine = [visual];
          currentLineWidth = wordWidth;
          return;
        }

        currentLine.push(visual);
        currentLineWidth = nextWidth;
      });

      if (currentLine.length > 0) {
        lines.push({ words: currentLine, width: currentLineWidth });
      }
    }

    const textBlockHeight = lines.length * lineHeight + textPaddingY * 2;
    const startY = getCaptionY(selectedStyle.position, cssHeight, textBlockHeight, captionOffset);

    const showBackground = Boolean(selectedStyle.backgroundColor);

    lines.forEach((line, lineIndex) => {
      const lineY = startY + lineIndex * lineHeight;
      const lineX = (cssWidth - line.width) / 2;
      const backgroundX = lineX - textPaddingX * 0.5;
      const backgroundY = lineY - textPaddingY * 0.25;
      const backgroundWidth = line.width + textPaddingX;
      const backgroundHeight = lineHeight + textPaddingY * 0.75;

      if (showBackground && selectedStyle.backgroundColor) {
        context.fillStyle = selectedStyle.backgroundColor;
        drawRoundedRect(context, backgroundX, backgroundY, backgroundWidth, backgroundHeight, 18);
        context.fill();
      }

      let cursorX = lineX;
      const activeWordIndexNow = getActiveWordIndex(editableWords, currentTime);
      const lineVariant = useLineVariants ? getLineVariant(selectedStyle, lineIndex) : undefined;

      line.words.forEach((visual, index) => {
        const text = displayText(visual.word.word);
        const wordVariant = lineVariant ?? getWordVariant(selectedStyle, visual.groupIndex);
        context.font = buildWordFont(selectedStyle, wordVariant, fontSize);
        const wordWidth = context.measureText(text).width;
        const isHighlighted = selectedStyle.animation === 'karaoke-highlight' && editableWords[activeWordIndexNow]?.word === visual.word.word;
        const isActiveBoxWord = selectedStyle.animation === 'highlight-box' && editableWords[activeWordIndexNow] === visual.word;
        const wordYOffset = visual.yOffset + (wordVariant?.yOffset ?? 0);
        const rotationRadians = ((wordVariant?.rotation ?? 0) * Math.PI) / 180;
        const wordCenterX = cursorX + wordWidth / 2;
        const wordCenterY = lineY + fontSize / 2;

        context.save();
        context.globalAlpha = visual.opacity;
        context.translate(wordCenterX, wordCenterY);
        context.rotate(rotationRadians);
        context.scale(visual.scale, visual.scale);
        context.translate(-wordCenterX, -wordCenterY);

        if (isActiveBoxWord && selectedStyle.activeBackgroundColor) {
          const boxPaddingX = fontSize * 0.28;
          const boxPaddingY = fontSize * 0.18;
          context.fillStyle = selectedStyle.activeBackgroundColor;
          drawRoundedRect(
            context,
            cursorX - boxPaddingX,
            lineY - boxPaddingY,
            wordWidth + boxPaddingX * 2,
            fontSize + boxPaddingY * 2,
            10
          );
          context.fill();
        }

        if (selectedStyle.animation === 'glow-pulse' && selectedStyle.glowColor) {
          context.shadowColor = selectedStyle.glowColor;
          context.shadowBlur = selectedStyle.glowBlur ?? 24;
        }

        const strokeWidth = wordVariant?.strokeWidth ?? selectedStyle.strokeWidth;
        if (strokeWidth > 0) {
          context.lineWidth = strokeWidth;
          context.strokeStyle = selectedStyle.strokeColor;
          context.strokeText(text, cursorX, lineY + wordYOffset);
        }

        context.fillStyle = isHighlighted ? highlightColor : (wordVariant?.color ?? visual.color);
        context.fillText(text, cursorX, lineY + wordYOffset);

        if (selectedStyle.animation === 'glow-pulse') {
          context.shadowBlur = 0;
        }

        context.restore();

        cursorX += wordWidth;
        if (index < line.words.length - 1) {
          cursorX += spaceWidth;
        }
      });
    });
  }, [editableWords, selectedStyle, captionOffset, captionScale]);

  const handleTimelineSeek = useCallback((time: number) => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.currentTime = clamp(time, 0, duration || time);
    renderFrame();
  }, [duration, renderFrame]);

  const startFrameLoop = useCallback(() => {
    stopFrameLoop();

    const tick = () => {
      renderFrame();
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);
  }, [renderFrame, stopFrameLoop]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setIsReady(true);
      syncCanvasSize();
      renderFrame();
    };

    const handlePlay = () => {
      setIsPlaying(true);
      startFrameLoop();
    };

    const handlePause = () => {
      setIsPlaying(false);
      stopFrameLoop();
      renderFrame();
    };

    const handleSeeked = () => {
      renderFrame();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('timeupdate', handleSeeked);

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('timeupdate', handleSeeked);
      stopFrameLoop();
    };
  }, [renderFrame, startFrameLoop, stopFrameLoop, syncCanvasSize, videoSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.pause();
    video.currentTime = 0;
    setIsPlaying(false);
    setIsReady(false);
    setExportStatus('idle');
    setExportError(null);
    setExportUrl(null);
    setExportFileName(null);
    setIsExporting(false);
    stopFrameLoop();
    renderFrame();
  }, [renderFrame, stopFrameLoop, videoSrc, wordTimestamps, selectedStyle]);

  useEffect(() => {
    return () => {
      stopFrameLoop();
    };
  }, [stopFrameLoop]);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (video.paused) {
      void video.play();
      return;
    }

    video.pause();
  }, []);

  const restartPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.currentTime = 0;
    void video.play();
  }, []);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const objectUrl = URL.createObjectURL(blob);
    setExportUrl(objectUrl);
    setExportFileName(filename);

    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
  }, []);

  const handleExportClick = useCallback(async () => {
    if (isExporting) {
      return;
    }

    if (!sourceFile) {
      setExportStatus('error');
      setExportError('Upload a source video before exporting.');
      return;
    }

    if (editableWords.length === 0) {
      setExportStatus('error');
      setExportError('Add timestamps before exporting the captioned video.');
      return;
    }

    setExportError(null);
    setExportStatus('rendering');
    setIsExporting(true);

    try {
      const formData = new FormData();
      formData.append('video', sourceFile);
      formData.append('wordTimestamps', JSON.stringify(editableWords));
      formData.append('style', JSON.stringify(selectedStyle));
      formData.append('offsetY', String(captionOffset));
      formData.append('scale', String(captionScale));

      const response = await fetch('/api/render', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(errorPayload?.error ?? 'FFmpeg render failed.');
      }

      const blob = await response.blob();
      const filename = response.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/)?.[1]
        ?? (sourceFile.name.endsWith('.mov') ? 'captioned-video.mov' : 'captioned-video.mp4');

      downloadBlob(blob, filename);
      setExportStatus('done');
    } catch (error) {
      setExportStatus('error');
      setExportError(error instanceof Error ? error.message : 'Unable to render the captioned video.');
    } finally {
      setIsExporting(false);
    }
  }, [downloadBlob, editableWords, isExporting, selectedStyle, sourceFile, captionOffset, captionScale]);

  const handleCaptionDragStart = useCallback((clientY: number) => {
    dragStateRef.current = { startClientY: clientY, startOffset: captionOffset };
    setIsDraggingCaption(true);
  }, [captionOffset]);

  const handleCaptionDragMove = useCallback((clientY: number) => {
    const dragState = dragStateRef.current;
    const canvas = canvasRef.current;

    if (!dragState || !canvas) {
      return;
    }

    const displayHeight = canvas.getBoundingClientRect().height || 1;
    const deltaFraction = (clientY - dragState.startClientY) / displayHeight;
    const nextOffset = clamp(dragState.startOffset + deltaFraction, -0.35, 0.35);
    setCaptionOffset(nextOffset);
  }, [setCaptionOffset]);

  const handleCaptionDragEnd = useCallback(() => {
    dragStateRef.current = null;
    setIsDraggingCaption(false);
  }, []);

  const handleCanvasPointerDown = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    handleCaptionDragStart(event.clientY);
  }, [handleCaptionDragStart]);

  const handleCanvasPointerMove = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dragStateRef.current) {
      return;
    }
    handleCaptionDragMove(event.clientY);
  }, [handleCaptionDragMove]);

  const handleCanvasPointerUp = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId);
    handleCaptionDragEnd();
  }, [handleCaptionDragEnd]);

  const progress = useMemo(() => {
    if (!duration || !videoRef.current) {
      return 0;
    }

    return (videoRef.current.currentTime / duration) * 100;
  }, [duration]);

  const selectedWord = editableWords[selectedWordIndex] ?? null;

  return (
    <div className={className ?? 'rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-4 shadow-glow'}>
      <div className="relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/70">
        <canvas
          ref={canvasRef}
          className={`block h-auto w-full ${hasWords ? 'cursor-ns-resize touch-none' : ''}`}
          aria-label="Rendered caption preview"
          onPointerDown={hasWords ? handleCanvasPointerDown : undefined}
          onPointerMove={hasWords ? handleCanvasPointerMove : undefined}
          onPointerUp={hasWords ? handleCanvasPointerUp : undefined}
          onPointerCancel={hasWords ? handleCanvasPointerUp : undefined}
        />
        {hasWords ? (
          <div
            className={`pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[11px] text-white transition-opacity ${
              isDraggingCaption ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Drag to reposition captions
          </div>
        ) : null}
      </div>

      {hasWords ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
          <span className="whitespace-nowrap text-xs uppercase tracking-[0.28em] text-slate-400">
            Caption position
          </span>
          <input
            type="range"
            min={-35}
            max={35}
            step={1}
            value={Math.round(captionOffset * 100)}
            onChange={(event) => setCaptionOffset(clamp(Number(event.target.value) / 100, -0.35, 0.35))}
            className="h-1.5 flex-1 min-w-[8rem] accent-cyan-400"
          />
          <button
            type="button"
            onClick={() => setCaptionOffset(0)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            Reset
          </button>
        </div>
      ) : null}

      {hasWords ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
          <span className="whitespace-nowrap text-xs uppercase tracking-[0.28em] text-slate-400">
            Caption size
          </span>
          <input
            type="range"
            min={60}
            max={160}
            step={2}
            value={Math.round(captionScale * 100)}
            onChange={(event) => setCaptionScale(clamp(Number(event.target.value) / 100, 0.6, 1.6))}
            className="h-1.5 flex-1 min-w-[8rem] accent-cyan-400"
          />
          <span className="w-12 shrink-0 text-right text-xs text-slate-400">
            {Math.round(captionScale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setCaptionScale(1)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            Reset
          </button>
        </div>
      ) : null}

      <video ref={videoRef} src={videoSrc} className="hidden" muted={false} playsInline preload="auto" />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlayback}
            className="rounded-full bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={restartPlayback}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white transition hover:bg-white/10"
          >
            Restart
          </button>
          <button
            type="button"
            onClick={handleExportClick}
            disabled={isExporting || !sourceFile}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-300/60"
          >
            {isExporting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                Rendering...
              </>
            ) : (
              'Export with FFmpeg'
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-slate-400">
          <span>{isReady ? 'Canvas synced' : 'Loading video'}</span>
          <span>{duration ? `${Math.round(duration)}s` : '0s'}</span>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-sky-400 transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Editable caption timeline</p>
            <p className="mt-1 text-xs text-slate-400">
              Click any word to select it, then edit the transcript or adjust its timing before export.
            </p>
          </div>
          {selectedWord ? (
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">
              Selected: {selectedWord.word}
            </p>
          ) : null}
        </div>

        {editableWords.length > 0 ? (
          <>
            <div className="mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible md:pb-0">
              {editableWords.map((word, index) => {
                const currentTime = videoRef.current?.currentTime ?? 0;
                const isSelected = index === selectedWordIndex;
                const isActive = currentTime >= word.start && currentTime <= word.end;

                return (
                  <button
                    key={`${word.word}-${word.start}-${word.end}-${index}`}
                    type="button"
                    onClick={() => {
                      setSelectedWordIndex(index);
                      handleTimelineSeek(word.start);
                    }}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition ${
                      isSelected
                        ? 'border-cyan-300/70 bg-cyan-400/20 text-white'
                        : isActive
                          ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100'
                          : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {word.word}
                  </button>
                );
              })}
            </div>

            {selectedWord ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <label className="block text-xs uppercase tracking-[0.28em] text-slate-400">
                    Word text
                  </label>
                  <input
                    value={selectedWord.word}
                    onChange={(event) => updateSelectedWord({ word: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
                  />

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs uppercase tracking-[0.28em] text-slate-400">
                        Start time
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={selectedWord.start}
                        onChange={(event) => updateSelectedWord({ start: Number(event.target.value) })}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-[0.28em] text-slate-400">
                        End time
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={selectedWord.end}
                        onChange={(event) => updateSelectedWord({ end: Number(event.target.value) })}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Timing tools</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => nudgeSelectedWord(-0.1)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                    >
                      -0.1s
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeSelectedWord(0.1)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                    >
                      +0.1s
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedWordIndex((currentIndex) => Math.max(0, currentIndex - 1))}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedWordIndex((currentIndex) => Math.min(editableWords.length - 1, currentIndex + 1))}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                    >
                      Next
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-3 text-xs text-slate-400">
                    Drag-style timeline editing is handled with word selection plus start/end fields, which keeps the canvas and export preview in sync.
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-400">
            No timestamps yet. Once transcription data is available, each word will appear here for editing.
          </p>
        )}
      </div>

      {exportStatus === 'done' && exportUrl ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          Export complete. Your captioned video download should start automatically.
          <a
            href={exportUrl}
            download={exportFileName ?? 'captioned-video.mp4'}
            className="ml-2 font-semibold underline underline-offset-4"
          >
            Download again
          </a>
        </div>
      ) : null}

      {exportStatus === 'error' ? (
        <p className="mt-4 text-xs text-rose-300">
          {exportError ?? 'Unable to export the captioned video in this browser.'}
        </p>
      ) : null}

      {!hasWords ? (
        <p className="mt-4 text-xs text-slate-400">
          Add word timestamps to burn captions onto the video.
        </p>
      ) : null}
    </div>
  );
}