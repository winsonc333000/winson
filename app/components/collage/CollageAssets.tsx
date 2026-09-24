'use client';

import { useTexture } from "@react-three/drei";

import { ALL_COLLAGE_TEXTURES } from "./constants";

// One per URL: useTexture caches by its exact input, so loading the list as a
// single array would decode a second, unused copy of every image.
const TextureGate = ({ url }: { url: string }) => {
  useTexture(url);
  return null;
};

// Starts the collage textures loading outside React's render. Loading them from
// inside a render (the first useTexture call) updates drei's progress store
// mid-render, which React warns about.
export const preloadCollageTextures = () => ALL_COLLAGE_TEXTURES.forEach((url) => useTexture.preload(url));

// Suspends until every collage texture has loaded. Mount a <WarmUp /> after it
// in the same Suspense boundary so it uploads them before they scroll into view.
const CollageAssets = () => (
  <>
    {ALL_COLLAGE_TEXTURES.map((url) => <TextureGate key={url} url={url} />)}
  </>
);

export default CollageAssets;
