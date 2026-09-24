import { create } from "zustand";
import { persist } from "zustand/middleware";

// Which skin the whole site renders in. 'classic' is the original starry-night
// scene; 'collage' re-dresses the same scene as a paper scrapbook.
export type SiteStyle = 'classic' | 'collage';

interface StyleStore {
  style: SiteStyle;
  setStyle: (style: SiteStyle) => void;
  // Set once the collage title has mounted, i.e. its cut-out fonts have loaded.
  // Fonts aren't tracked by useProgress, so the page-turn waits on this too.
  collageReady: boolean;
  setCollageReady: (ready: boolean) => void;
}

export const useStyleStore = create<StyleStore>()(
  persist(
    (set) => ({
      style: 'classic',
      setStyle: (style) => set(() => ({ style })),
      collageReady: false,
      setCollageReady: (collageReady) => set(() => ({ collageReady })),
    }),
    {
      name: "style-storage",
      partialize: (state) => ({ style: state.style }),
    }
  )
);

export const useIsCollage = () => useStyleStore((state) => state.style === 'collage');
