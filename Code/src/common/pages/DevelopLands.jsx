import { LAND, project } from "../content/worldLand";

/**
 * DevelopLands - the world, stamped on the board like an engraved print:
 * solid brown continents, with the engraver's ornament (rings, tick marks,
 * stars, lettering and a compass rose) printed across them and clipped to
 * the coast. Drawn on the 1000 x 500 world; `scale` fits it to the map.
 * Looks: common/styles/pages/develop.css (.dv-world ...)
 */

const ring = (cx, cy, r) => `M ${cx - r} ${cy} a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 ${-r * 2} 0`;

/* concentric rings with a band of ticks, a band of stars and a line of lettering */
const Rings = ({ id, x, y, r, words }) => {
  const ticks = [];
  for (let k = 0; k < 180; k++) {
    const a = (k / 180) * Math.PI * 2;
    const r1 = r * 0.84;
    const r2 = r * (k % 5 ? 0.87 : 0.9);
    ticks.push(`M ${(x + Math.cos(a) * r1).toFixed(1)} ${(y + Math.sin(a) * r1).toFixed(1)} L ${(x + Math.cos(a) * r2).toFixed(1)} ${(y + Math.sin(a) * r2).toFixed(1)}`);
  }
  const stars = [];
  for (let k = 0; k < 48; k++) {
    const a = (k / 48) * Math.PI * 2;
    const sx = x + Math.cos(a) * r * 0.64;
    const sy = y + Math.sin(a) * r * 0.64;
    stars.push(`M ${sx.toFixed(1)} ${(sy - 2.4).toFixed(1)} l 0.8 1.6 l 1.6 0.8 l -1.6 0.8 l -0.8 1.6 l -0.8 -1.6 l -1.6 -0.8 l 1.6 -0.8 Z`);
  }
  return (
    <g className="dv-orn">
      <path d={`${ring(x, y, r)} ${ring(x, y, r * 0.96)} ${ring(x, y, r * 0.84)} ${ring(x, y, r * 0.72)} ${ring(x, y, r * 0.56)}`} />
      <path d={ticks.join(" ")} className="is-fine" />
      <path d={stars.join(" ")} className="dv-orn-star" />
      <path id={id} d={ring(x, y, r * 0.765)} className="dv-orn-guide" />
      <text className="dv-orn-text">
        <textPath href={`#${id}`}>{words.repeat(Math.max(1, Math.round((r * 4.8) / (words.length * 5.2))))}</textPath>
      </text>
    </g>
  );
};

/* a sixteen-point compass rose, printed large across Africa like the old charts */
const Rose = ({ x, y, r }) => {
  const pts = [];
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 - Math.PI / 2;
    const len = k % 4 === 0 ? r : k % 2 === 0 ? r * 0.66 : r * 0.42;
    const w = (k % 4 === 0 ? 0.12 : 0.09) * r;
    const tip = [x + Math.cos(a) * len, y + Math.sin(a) * len];
    const l = [x + Math.cos(a - Math.PI / 2) * w, y + Math.sin(a - Math.PI / 2) * w];
    const rt = [x + Math.cos(a + Math.PI / 2) * w, y + Math.sin(a + Math.PI / 2) * w];
    pts.push({ k, dark: `M ${x} ${y} L ${l[0]} ${l[1]} L ${tip[0]} ${tip[1]} Z`, light: `M ${x} ${y} L ${rt[0]} ${rt[1]} L ${tip[0]} ${tip[1]} Z` });
  }
  return (
    <g className="dv-rose-print">
      <path d={`${ring(x, y, r * 0.46)} ${ring(x, y, r * 0.4)}`} className="dv-orn-line" />
      {pts.map((p) => (
        <g key={p.k}>
          <path d={p.dark} className="is-dark" />
          <path d={p.light} className="is-light" />
        </g>
      ))}
      <path d={ring(x, y, r * 0.06)} className="is-dark" />
    </g>
  );
};

const World = ({ scale }) => {
  const africa = project(21, 3);
  const america = project(-100, 42);
  const asia = project(98, 48);
  const south = project(-60, -18);
  const oceania = project(134, -25);
  return (
    <g className="dv-world" transform={`scale(${scale})`}>
      <defs>
        <clipPath id="dv-world-land">
          <path d={LAND} fillRule="evenodd" />
        </clipPath>
      </defs>
      <path d={LAND} fillRule="evenodd" className="dv-world-land" />
      <g clipPath="url(#dv-world-land)">
        <Rings id="dv-orn-america" x={america.x} y={america.y} r={150} words="TERRA NOVA · OPERA PRIMA · " />
        <Rings id="dv-orn-asia" x={asia.x} y={asia.y} r={190} words="ORBIS CODICIS · ANNO DOMINI · " />
        <Rings id="dv-orn-south" x={south.x} y={south.y} r={95} words="MARE INCOGNITUM · " />
        <Rings id="dv-orn-oceania" x={oceania.x} y={oceania.y} r={70} words="TERRA AUSTRALIS · " />
        <Rose x={africa.x} y={africa.y} r={62} />
        <Rings id="dv-orn-africa" x={africa.x} y={africa.y} r={105} words="AFRICA · MERIDIES · " />
      </g>
      <path d={LAND} fillRule="evenodd" className="dv-world-coast" />
    </g>
  );
};

export default World;
