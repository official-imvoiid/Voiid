import { LAND, WORLD_H, WORLD_W, project } from "./worldLand";

/**
 * worldTour.js - where each project sits on the Develop world map.
 *
 * The voyage follows TOUR, a line of waypoints round the continents
 * (longitude, latitude). Projects are spread evenly along its land legs,
 * oldest first; legs marked `sea` are crossed by ship and get no stops.
 * Each stop is then nudged onto dry land if it landed in the water.
 * Coordinates are on the 1000 x 500 world (see worldLand.js); the map
 * scales them to its own width.
 */

const TOUR = [
  // North America - one sweep: across Canada, down the east, round the Gulf
  [-150, 64], [-132, 61], [-114, 56], [-96, 53], [-80, 49], [-73, 44], [-78, 38],
  [-83, 31], [-92, 31], [-99, 30], [-103, 23], [-92, 16],
  // South America - down the west side, back up the east
  [-74, 5], [-76, -9], [-64, -17], [-64, -32], [-69, -45], [-58, -33], [-50, -24],
  [-44, -13], [-39, -6],
  // across the Atlantic
  { sea: true }, [-14, 14],
  // Africa - west, down, round the Cape, up the east, back along the north
  [-3, 17], [8, 10], [22, -3], [17, -13], [25, -29], [34, -19], [34, -6], [40, 8],
  [30, 15], [30, 26], [16, 27], [2, 29], [-6, 32],
  // Europe - Spain to Moscow
  [-4, 40], [2, 46], [12, 43], [22, 43], [18, 52], [15, 61], [26, 63], [38, 55],
  // Asia - out across Siberia, back through the steppe, round India, into China
  [60, 57], [90, 62], [125, 63], [140, 60], [105, 47], [70, 47], [55, 33], [45, 23],
  [77, 23], [77, 13], [97, 20], [105, 32], [117, 30], [103, 13], [114, 0],
  // across to Australia
  { sea: true }, [121, -24],
  [134, -24], [145, -19], [146, -34],
];

/* the tour as projected legs: [{ a, b, len, sea }] */
function legs() {
  const out = [];
  let prev = null;
  let sea = false;
  for (const w of TOUR) {
    if (!Array.isArray(w)) { sea = true; continue; }
    const p = project(w[0], w[1]);
    if (prev) out.push({ a: prev, b: p, len: Math.hypot(p.x - prev.x, p.y - prev.y), sea });
    prev = p;
    sea = false;
  }
  return out;
}

/* is a point on land? (asks the browser, using the coastline itself) */
let landTest = null;
function onLand(x, y) {
  if (!landTest) {
    const canvas = document.createElement("canvas");
    canvas.width = WORLD_W;
    canvas.height = WORLD_H;
    const ctx = canvas.getContext("2d");
    const path = new Path2D(LAND);
    landTest = (px, py) => ctx.isPointInPath(path, px, py, "evenodd");
  }
  return landTest(x, y);
}

/* the nearest dry land to (x, y), looking out in widening rings */
function toLand(p) {
  if (onLand(p.x, p.y)) return p;
  for (let r = 3; r <= 40; r += 3) {
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const q = { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r };
      if (onLand(q.x, q.y)) return q;
    }
  }
  return p;
}

/**
 * Places for `count` stops along the tour (plus one more: where the next
 * project will go), on the 1000 x 500 world. The answer only depends on
 * `count`, so it's worked out once per count and remembered - the nudging
 * onto land is hundreds of point-in-path tests.
 */
const placed = new Map();
export function placeStops(count) {
  if (placed.has(count)) return placed.get(count);
  const out = placeStopsNow(count);
  placed.set(count, out);
  return out;
}
function placeStopsNow(count) {
  const ls = legs();
  const land = ls.filter((l) => !l.sea);
  const total = land.reduce((s, l) => s + l.len, 0);
  const n = count + 1;
  const out = [];
  for (let i = 0; i < n; i++) {
    // spread evenly over the land legs, a half-step in from each end
    let at = ((i + 0.5) / n) * total;
    let p = land[land.length - 1].b;
    for (const l of land) {
      if (at <= l.len) {
        const t = at / l.len;
        p = { x: l.a.x + (l.b.x - l.a.x) * t, y: l.a.y + (l.b.y - l.a.y) * t };
        break;
      }
      at -= l.len;
    }
    out.push(toLand(p));
  }
  return out;
}

export { project };
