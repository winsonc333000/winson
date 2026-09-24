import { seededRandom } from "./constants";

// A clip-path that tears up to `depth` px into each edge of an element of any
// size, for the scrapbook page the canvas is drawn on.
export const tornClipPath = (seed = 1, depth = 7, stepsPerSide = 48) => {
  const rand = seededRandom(seed);
  let drift = 0;
  const bite = () => {
    drift = drift * 0.55 + rand() * 0.45;
    return (drift * depth + rand() * 1.5).toFixed(1);
  };
  const points: string[] = [];
  for (let i = 0; i < stepsPerSide; i++) points.push(`${(i / stepsPerSide) * 100}% ${bite()}px`);
  for (let i = 0; i < stepsPerSide; i++) points.push(`calc(100% - ${bite()}px) ${(i / stepsPerSide) * 100}%`);
  for (let i = 0; i < stepsPerSide; i++) points.push(`${100 - (i / stepsPerSide) * 100}% calc(100% - ${bite()}px)`);
  for (let i = 0; i < stepsPerSide; i++) points.push(`${bite()}px ${100 - (i / stepsPerSide) * 100}%`);
  return `polygon(${points.join(',')})`;
};
