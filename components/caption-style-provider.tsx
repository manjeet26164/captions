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
};

const CaptionStyleContext = createContext<CaptionStyleContextValue | null>(null);

export function CaptionStyleProvider({
  children
}: {
  children: ReactNode;
}) {
  const [selectedStyle, setSelectedStyle] = useState<CaptionStylePreset>(captionStylePresets[0]);
  const [captionOffset, setCaptionOffset] = useState(0);

  const value = useMemo(
    () => ({ selectedStyle, setSelectedStyle, captionOffset, setCaptionOffset }),
    [selectedStyle, captionOffset]
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