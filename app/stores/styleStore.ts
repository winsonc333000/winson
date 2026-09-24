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
      // The scrapbook is the site's front door; the night sky is one click away.
      style: 'collage',
      setStyle: (style) => set(() => ({ style })),
      collageReady: false,
      setCollageReady: (collageReady) => set(() => ({ collageReady })),
    }),
    {
      name: "style-storage",
      partialize: (state) => ({ style: state.style }),
      // Version 0 stored 'classic' for everyone who visited before the
      // scrapbook became the default. Start them all on the scrapbook once;
      // choices made from here on are kept.
      version: 1,
      migrate: () => ({ style: 'collage' as SiteStyle }),
    }
  )
);

export const useIsCollage = () => useStyleStore((state) => state.style === 'collage');
