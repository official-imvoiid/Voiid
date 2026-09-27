/* Stable pseudo-random number in [0, 1) from a string (FNV-1a).
   Same input, same number - so hand-drawn wobble and map scenery
   stay put between visits. */
export const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  // final avalanche, so "tree1" and "tree2" land far apart
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

export default hash;
