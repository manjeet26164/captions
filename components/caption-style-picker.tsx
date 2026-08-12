'use client';

import { motion } from 'framer-motion';
import {
  captionStylePresets,
  type CaptionAnimation,
  type CaptionStylePreset
} from '@/lib/captionStyles';
import { useCaptionStyle } from '@/components/caption-style-provider';

const sampleWords = ['kya', 'hua', 'bro'];

function getPreviewAnimation(animation: CaptionAnimation) {
  switch (animation) {
    case 'pop':
      return {
        initial: { scale: 0.9, opacity: 0.75 },
        animate: { scale: [1, 1.08, 1], opacity: [1, 1, 1] },
        transition: { duration: 1.3, repeat: Infinity, repeatDelay: 0.4, ease: 'easeInOut' as const }
      };
    case 'karaoke-highlight':
      return {
        initial: { y: 0 },
        animate: { y: [0, -2, 0] },
        transition: { duration: 1.1, repeat: Infinity, repeatDelay: 0.3, ease: 'easeInOut' as const }
      };
    case 'fade':
      return {
        initial: { opacity: 0.45 },
        animate: { opacity: [0.5, 1, 0.7, 1] },
        transition: { duration: 1.8, repeat: Infinity, repeatDelay: 0.2, ease: 'easeInOut' as const }
      };
    case 'bounce':
      return {
        initial: { y: 0 },
        animate: { y: [0, -8, 0] },
        transition: { duration: 0.95, repeat: Infinity, repeatDelay: 0.2, ease: 'easeInOut' as const }
      };
    case 'typewriter':
      return {
        initial: { width: 0 },
        animate: { width: '100%' },
        transition: { duration: 1.7, repeat: Infinity, repeatDelay: 0.5, ease: 'easeInOut' as const }
      };
    case 'glow-pulse':
      return {
        initial: { opacity: 0.75, scale: 1 },
        animate: { opacity: [0.75, 1, 0.75], scale: [1, 1.05, 1] },
        transition: { duration: 1.4, repeat: Infinity, repeatDelay: 0.2, ease: 'easeInOut' as const }
      };
    case 'highlight-box':
      return {
        initial: { scale: 0.96 },
        animate: { scale: [0.96, 1, 0.96] },
        transition: { duration: 1.1, repeat: Infinity, repeatDelay: 0.2, ease: 'easeInOut' as const }
      };
  }
}

function PreviewText({ style }: { style: CaptionStylePreset }) {
  const previewMotion = getPreviewAnimation(style.animation);

  if (style.animation === 'karaoke-highlight') {
    return (
      <div className="mt-4 flex justify-center gap-1.5 text-sm font-semibold" style={{ fontFamily: style.fontFamily }}>
        {sampleWords.map((word, index) => (
          <motion.span
            key={word}
            initial={{ opacity: 0.45, y: 2 }}
            animate={{ opacity: [0.45, 1, 0.6, 1], y: [0, -1, 0] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              repeatDelay: 0.2,
              delay: index * 0.16,
              ease: 'easeInOut'
            }}
            style={{
              color: index === 1 ? style.color : '#cbd5e1',
              textShadow: `${style.strokeWidth / 2}px ${style.strokeWidth / 2}px 0 ${style.strokeColor}`,
              backgroundColor: index === 1 ? style.backgroundColor : 'transparent',
              paddingInline: index === 1 ? '0.35rem' : 0,
              borderRadius: index === 1 ? '999px' : 0
            }}
          >
            {word}
          </motion.span>
        ))}
      </div>
    );
  }

  if (style.animation === 'glow-pulse') {
    const words = style.uppercase ? sampleWords.map((word) => word.toUpperCase()) : sampleWords;

    return (
      <motion.div
        className="mt-4 text-sm font-semibold"
        initial={previewMotion.initial}
        animate={previewMotion.animate}
        transition={previewMotion.transition}
        style={{
          fontFamily: style.fontFamily,
          color: style.color,
          textShadow: `0 0 12px ${style.glowColor ?? style.color}, 0 0 24px ${style.glowColor ?? style.color}, ${style.strokeWidth / 3}px ${style.strokeWidth / 3}px 0 ${style.strokeColor}`
        }}
      >
        {words.join(' ')}
      </motion.div>
    );
  }

  if (style.animation === 'highlight-box') {
    const words = style.uppercase ? sampleWords.map((word) => word.toUpperCase()) : sampleWords;

    return (
      <div className="mt-4 flex flex-wrap justify-center gap-1.5 text-sm font-semibold" style={{ fontFamily: style.fontFamily }}>
        {words.map((word, index) => (
          <motion.span
            key={word}
            initial={{ scale: 0.96 }}
            animate={{ scale: index === 1 ? [0.96, 1.08, 0.96] : 1 }}
            transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.2, delay: index * 0.1, ease: 'easeInOut' }}
            style={{
              color: index === 1 ? style.activeColor ?? '#000000' : style.color,
              backgroundColor: index === 1 ? style.activeBackgroundColor : 'transparent',
              textShadow: index === 1 ? 'none' : `${style.strokeWidth / 3}px ${style.strokeWidth / 3}px 0 ${style.strokeColor}`,
              paddingInline: index === 1 ? '0.4rem' : 0,
              borderRadius: index === 1 ? '0.4rem' : 0
            }}
          >
            {word}
          </motion.span>
        ))}
      </div>
    );
  }

  if (style.animation === 'typewriter') {
    return (
      <div className="mt-4 overflow-hidden text-sm font-semibold uppercase tracking-[0.22em]" style={{ fontFamily: style.fontFamily }}>
        <motion.div
          className="whitespace-nowrap"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.4, ease: 'easeInOut' }}
          style={{
            color: style.color,
            textShadow: `${style.strokeWidth / 2}px ${style.strokeWidth / 2}px 0 ${style.strokeColor}`,
            borderRight: `2px solid ${style.color}`
          }}
        >
          kya hua bro
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="mt-4 text-sm font-semibold"
      initial={previewMotion.initial}
      animate={previewMotion.animate}
      transition={previewMotion.transition}
      style={{
        fontFamily: style.fontFamily,
        color: style.color,
        textShadow: `${style.strokeWidth / 2}px ${style.strokeWidth / 2}px 0 ${style.strokeColor}`
      }}
    >
      <span
        className="inline-flex rounded-full px-3 py-1"
        style={{ backgroundColor: style.backgroundColor ?? 'transparent' }}
      >
        kya hua bro
      </span>
    </motion.div>
  );
}

export function CaptionStylePicker() {
  const { selectedStyle, setSelectedStyle } = useCaptionStyle();

  return (
    <section className="mx-auto w-full max-w-7xl px-0 pb-16 sm:px-0 lg:px-0">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-cyan-200/75">Caption styles</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Pick a preset before generating captions</h2>
        </div>
        <div className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
          Selected: <span className="font-semibold text-white">{selectedStyle.name}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {captionStylePresets.map((style) => {
          const isSelected = style.name === selectedStyle.name;

          return (
            <button
              key={style.name}
              type="button"
              onClick={() => setSelectedStyle(style)}
              className={`group rounded-[1.5rem] border p-4 text-left transition ${
                isSelected
                  ? 'border-cyan-300/70 bg-white/10 shadow-[0_0_0_1px_rgba(103,232,249,0.18),0_20px_60px_rgba(8,15,30,0.5)]'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{style.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.26em] text-slate-400">
                    {style.animation} · {style.position}
                  </p>
                </div>
                <span
                  className={`h-3 w-3 rounded-full ${
                    isSelected ? 'bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.8)]' : 'bg-slate-500'
                  }`}
                />
              </div>

              <div
                className="mt-4 rounded-[1.2rem] border border-white/10 p-4 sm:p-5"
                style={{
                  background: 'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(2,6,23,0.9))',
                  minHeight: '10rem'
                }}
              >
                <div className="flex h-full min-h-[7rem] flex-col justify-between">
                  <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Preview</div>
                  <PreviewText style={style} />
                  <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-slate-300">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                      {style.fontFamily.split(',')[0]}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                      {style.fontSize}px
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                      {style.position}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}