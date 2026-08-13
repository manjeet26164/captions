'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  captionStylePresets,
  type CaptionStylePreset
} from '@/lib/captionStyles';

type CaptionStyleContextValue = {
  selectedStyle: CaptionStylePreset;
  setSelectedStyle: (style: CaptionStylePreset) => void;
  /** Manual vertical nudge as a fraction of frame height (-0.35 to 0.35, 0 = preset default). */
  captionOffset: number;
  setCaptionOffset: (offset: number) => void;
  /** Global caption size multiplier applied on top of the preset's fontSize (0.5 - 2, 1 = preset default). */
  captionScale: number;
  setCaptionScale: (scale: number) => void;
  /**
   * Global font family override. When set, every word/line renders in this font instead of
   * the preset's fontFamily (and instead of any per-word/per-line variant font, e.g. the
   * cascade preset's italic line). null = use the preset's own fonts.
   */
  captionFontFamily: string | null;
  setCaptionFontFamily: (fontFamily: string | null) => void;
  /** Multiplier on the vertical gap between caption lines (0.6 - 1.4, lower = tighter). */
  captionLineSpacing: number;
  setCaptionLineSpacing: (spacing: number) => void;
};

const CaptionStyleContext = createContext<CaptionStyleContextValue | null>(null);

export function CaptionStyleProvider({
  children
}: {
  children: ReactNode;
}) {
  const [selectedStyle, setSelectedStyle] = useState<CaptionStylePreset>(captionStylePresets[0]);
  const [captionOffset, setCaptionOffset] = useState(0);
  const [captionScale, setCaptionScale] = useState(1);
  const [captionFontFamily, setCaptionFontFamily] = useState<string | null>(null);
  const [captionLineSpacing, setCaptionLineSpacing] = useState(0.85);

  const value = useMemo(
    () => ({
      selectedStyle,
      setSelectedStyle,
      captionOffset,
      setCaptionOffset,
      captionScale,
      setCaptionScale,
      captionFontFamily,
      setCaptionFontFamily,
      captionLineSpacing,
      setCaptionLineSpacing
    }),
    [selectedStyle, captionOffset, captionScale, captionFontFamily, captionLineSpacing]
  );

  return (
    <CaptionStyleContext.Provider value={value}>
      {children}
    </CaptionStyleContext.Provider>
  );
}

export function useCaptionStyle() {
  const context = useContext(CaptionStyleContext);

  if (!context) {
    throw new Error('useCaptionStyle must be used within a CaptionStyleProvider.');
  }

  return context;
}