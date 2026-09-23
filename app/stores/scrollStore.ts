import { create } from 'zustand';

interface ScrollStore {
  scrollProgress: number;
  setScrollProgress: (progress: number) => void;
  // Flipped once the viewer scrolls near the experience section. Heavy assets
  // (project textures, portal GLBs) wait on this instead of loading at page
  // load, where they compete with the hero for bandwidth and GPU memory.
  deferredAssetsReady: boolean;
  setDeferredAssetsReady: (ready: boolean) => void;
}

export const useScrollStore = create<ScrollStore>((set) => ({
  scrollProgress: 0,
  // ScrollWrapper calls this every frame; skipping no-op updates keeps
  // subscribers from re-rendering 60 times a second while idle.
  setScrollProgress: (progress) => set((state) => (
    state.scrollProgress === progress ? state : { scrollProgress: progress }
  )),
  deferredAssetsReady: false,
  setDeferredAssetsReady: (ready) => set(() => ({ deferredAssetsReady: ready })),
}));
