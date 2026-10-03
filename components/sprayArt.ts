/* ------------------------------------------------------------------------------------------
   Realistic vector illustrations for perfume notes (rose, jasmine, citrus, mint, vanilla, oud…).
   Each one is a self-contained 100×100 SVG drawn onto the spray canvas. Realism comes from SVG
   lighting (specular / diffuse), noise textures and soft shading — no cartoon outlines, no emoji,
   no image downloads.
------------------------------------------------------------------------------------------- */

type Stop = [number, string, number?];
const stops = (s: Stop[]) =>
  s.map(x => `<stop offset='${x[0]}' stop-color='${x[1]}'${x[2] !== undefined ? ` stop-opacity='${x[2]}'` : ""}/>`).join("");
const RG = (id: string, s: Stop[], o = "cx='50%' cy='40%' r='65%'") => `<radialGradient id='${id}' ${o}>${stops(s)}</radialGradient>`;
const LG = (id: string, s: Stop[], o = "x1='0' y1='0' x2='0' y2='1'") => `<linearGradient id='${id}' ${o}>${stops(s)}</linearGradient>`;
const rot = (n: number, step: number, fn: (a: number, i: number) => string) => Array.from({ length: n }, (_, i) => fn(i * step, i)).join("");
const rnd = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

/* Shared filters: texture, lighting, blur. */
const grain = (id: string, freq: string, k1: number, k2: number, seed = 4) =>
  `<filter id='${id}' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>
    <feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' seed='${seed}' result='n'/>
    <feColorMatrix in='n' type='saturate' values='0' result='g'/>
    <feComposite in='SourceGraphic' in2='g' operator='arithmetic' k1='${k1}' k2='${k2}' k3='0' k4='0' result='t'/>
    <feComposite in='t' in2='SourceAlpha' operator='in'/></filter>`;
const FX = `
  ${grain("fxFine", "1.9", 0.22, 0.89)}
  ${grain("fxGrain", "0.9", 0.45, 0.78)}
  ${grain("fxCoarse", "0.45", 1.1, 0.46, 9)}
  ${grain("fxWoodX", "0.04 0.6", 1.2, 0.42, 7)}
  ${grain("fxWoodY", "0.6 0.04", 1.2, 0.42, 7)}
  <filter id='fxGloss' x='-5%' y='-5%' width='110%' height='110%' color-interpolation-filters='sRGB'>
    <feGaussianBlur in='SourceAlpha' stdDeviation='4.5' result='b'/>
    <feSpecularLighting in='b' surfaceScale='6' specularConstant='0.9' specularExponent='28' lighting-color='#fff' result='s'><fePointLight x='22' y='10' z='70'/></feSpecularLighting>
    <feComposite in='s' in2='SourceAlpha' operator='in' result='s2'/>
    <feComposite in='SourceGraphic' in2='s2' operator='arithmetic' k1='0' k2='1' k3='0.8' k4='0'/></filter>
  <filter id='fxSheen' x='-5%' y='-5%' width='110%' height='110%' color-interpolation-filters='sRGB'>
    <feGaussianBlur in='SourceAlpha' stdDeviation='3' result='b'/>
    <feSpecularLighting in='b' surfaceScale='4' specularConstant='0.5' specularExponent='14' lighting-color='#fff' result='s'><fePointLight x='20' y='8' z='60'/></feSpecularLighting>
    <feComposite in='s' in2='SourceAlpha' operator='in' result='s2'/>
    <feComposite in='SourceGraphic' in2='s2' operator='arithmetic' k1='0' k2='1' k3='0.55' k4='0'/></filter>
  <filter id='fxMatte' color-interpolation-filters='sRGB'>
    <feGaussianBlur in='SourceAlpha' stdDeviation='3' result='b'/>
    <feDiffuseLighting in='b' surfaceScale='2.2' diffuseConstant='1' lighting-color='#fff' result='d'><feDistantLight azimuth='235' elevation='55'/></feDiffuseLighting>
    <feComposite in='SourceGraphic' in2='d' operator='arithmetic' k1='0.55' k2='0.55' k3='0' k4='0' result='l'/>
    <feComposite in='l' in2='SourceAlpha' operator='in'/></filter>
  <filter id='fxB06'><feGaussianBlur stdDeviation='0.6'/></filter>
  <filter id='fxB1' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='1.1'/></filter>
  <filter id='fxB2' x='-40%' y='-40%' width='180%' height='180%'><feGaussianBlur stdDeviation='2.2'/></filter>
  <filter id='fxB4' x='-60%' y='-60%' width='220%' height='220%'><feGaussianBlur stdDeviation='4'/></filter>
  <filter id='fxWobble' x='-10%' y='-10%' width='120%' height='120%'>
    <feTurbulence type='fractalNoise' baseFrequency='0.07' numOctaves='2' seed='3' result='n'/>
    <feDisplacementMap in='SourceGraphic' in2='n' scale='5' xChannelSelector='R' yChannelSelector='G'/></filter>
  <filter id='fxRough' x='-10%' y='-10%' width='120%' height='120%'>
    <feTurbulence type='fractalNoise' baseFrequency='0.35' numOctaves='2' seed='5' result='n'/>
    <feDisplacementMap in='SourceGraphic' in2='n' scale='2.6' xChannelSelector='R' yChannelSelector='G'/></filter>
  <filter id='fxWisp' x='-40%' y='-40%' width='180%' height='180%'>
    <feTurbulence type='fractalNoise' baseFrequency='0.045' numOctaves='3' seed='2' result='n'/>
    <feDisplacementMap in='SourceGraphic' in2='n' scale='16' xChannelSelector='R' yChannelSelector='G' result='d'/>
    <feGaussianBlur in='d' stdDeviation='1.4'/></filter>
`;
const lit = (inner: string, f1 = "fxMatte", f2 = "fxGrain") => (f2 ? `<g filter='url(#${f1})'><g filter='url(#${f2})'>${inner}</g></g>` : `<g filter='url(#${f1})'>${inner}</g>`);

/* ----------------------------------- flowers ----------------------------------- */

function rose(c = ["#3d0412", "#8e0f2b", "#cf2546", "#f2768c"]) {
  const P = "M0 2 C-15 -2 -21 -17 -17 -28 C-13 -37 13 -37 17 -28 C21 -17 15 -2 0 2Z";
  const layer = (n: number, sc: number, off: number) =>
    `<circle r='${20 * sc}' fill='#1d0008' opacity='.45' filter='url(#fxB2)'/>` +
    rot(n, 360 / n, a => `<g transform='rotate(${a + off}) scale(${sc})'>
      <path d='${P}' fill='url(#rp)'/>
      <path d='${P}' fill='none' stroke='#2a0008' stroke-opacity='.55' stroke-width='1.6' filter='url(#fxB06)'/>
      <path d='M-17 -28 C-13 -37 13 -37 17 -28' fill='none' stroke='${c[3]}' stroke-opacity='.75' stroke-width='1.6' filter='url(#fxB06)'/>
      <path d='M0 -2 C-3 -12 -2 -22 0 -30' fill='none' stroke='${c[0]}' stroke-opacity='.25' stroke-width='1.2' filter='url(#fxB06)'/></g>`);
  return `<defs>${LG("rp", [[0, c[3]], [0.18, c[2]], [0.6, c[1]], [1, c[0]]], "x1='0' y1='0' x2='0' y2='1'")}${LG("rl", [[0, "#5d8b3a"], [1, "#1f3d16"]], "x1='0' y1='0' x2='1' y2='1'")}</defs>
  ${lit(`<path d='M50 70 C66 64 86 70 94 84 C78 90 60 86 50 70Z' fill='url(#rl)'/><path d='M50 72 C34 66 14 72 8 86 C24 92 42 88 50 72Z' fill='url(#rl)'/>`)}
  <path d='M52 72 C66 72 80 76 92 84 M48 74 C36 74 22 78 10 86' stroke='#a8c98a' stroke-opacity='.5' stroke-width='.8' fill='none'/>
  ${lit(`<g transform='translate(50 47)'>${layer(5, 1, 0)}${layer(5, 0.74, 36)}${layer(4, 0.52, 10)}${layer(3, 0.34, 60)}
    <circle r='5.5' fill='#4a0514'/>
    <path d='M0 0 m-2 0 a2 2 0 1 1 2 2 a4.5 4.5 0 1 1 -5 -5 a7 7 0 1 1 7.5 7.5' fill='none' stroke='#1d0008' stroke-width='1.5' filter='url(#fxB06)'/>
    <path d='M-4 -3 a5 5 0 0 1 7 -2' fill='none' stroke='${c[3]}' stroke-opacity='.7' stroke-width='1' filter='url(#fxB06)'/></g>`, "fxSheen", "")}`;
}

function whiteFlower(petal: { n: number; len: number; wid: number }, colors = ["#d6dcb8", "#ffffff", "#f1eee6"], centre = "#e8df98") {
  const { n, len, wid } = petal;
  const P = `M0 0 C${-wid * 0.7} -6 ${-wid} ${-len * 0.62} ${-wid * 0.4} ${-len * 0.95} C${-wid * 0.15} ${-len * 1.04} ${wid * 0.15} ${-len * 1.04} ${wid * 0.4} ${-len * 0.95} C${wid} ${-len * 0.62} ${wid * 0.7} -6 0 0Z`;
  const flower = (x: number, y: number, sc: number, r: number) => `<g transform='translate(${x} ${y}) rotate(${r}) scale(${sc})'>
    ${rot(n, 360 / n, a => `<path d='${P}' transform='rotate(${a}) translate(1.6 2.2)' fill='#4d4b3e' opacity='.28' filter='url(#fxB2)'/>`)}
    ${rot(n, 360 / n, a => `<g transform='rotate(${a})'><path d='${P}' fill='url(#wp)'/><path d='M0 -3 L0 ${-len * 0.85}' stroke='#c9c7b4' stroke-opacity='.5' stroke-width='.7' filter='url(#fxB06)'/></g>`)}
    <circle r='3.6' fill='url(#wc)'/><circle r='1.3' fill='#8f8a4c'/></g>`;
  return `<defs>${LG("wp", [[0, colors[0]], [0.3, colors[1]], [1, colors[2]]], "x1='0' y1='1' x2='0' y2='0'")}${RG("wc", [[0, "#fffbe0"], [1, centre]])}</defs>
  ${lit(`<path d='M70 92 C70 80 74 70 82 62' stroke='#5a7a3a' stroke-width='2.2' fill='none' stroke-linecap='round'/>
    <path d='M82 62 C80 54 84 48 88 46 C90 52 88 58 82 62Z' fill='#e8ecd2'/>`)}
  ${lit(flower(42, 46, 1, 8) + flower(76, 70, 0.55, -20), "fxSheen", "")}`;
}
const jasmine = () => whiteFlower({ n: 5, len: 33, wid: 13 });
const orangeBlossom = () => whiteFlower({ n: 5, len: 30, wid: 16 }, ["#e9e4c8", "#fffdf6", "#f5efe2"], "#f2c94c");

function colorFlower(n: number, c: [string, string, string], len = 30, wid = 15, centre = "#f2c94c") {
  const P = `M0 0 C${-wid} -8 ${-wid * 1.1} ${-len * 0.8} 0 ${-len} C${wid * 1.1} ${-len * 0.8} ${wid} -8 0 0Z`;
  return `<defs>${LG("fp", [[0, c[2]], [0.45, c[1]], [1, c[0]]], "x1='0' y1='1' x2='0' y2='0'")}${RG("fc", [[0, "#fff6c0"], [1, centre]])}</defs>
  ${lit(`<g transform='translate(50 50)'>
    ${rot(n, 360 / n, a => `<path d='${P}' transform='rotate(${a}) translate(1.4 2)' fill='#000' opacity='.25' filter='url(#fxB2)'/>`)}
    ${rot(n, 360 / n, a => `<g transform='rotate(${a})'><path d='${P}' fill='url(#fp)'/>
      ${[-4, 0, 4].map(o => `<path d='M0 -3 Q${o} ${-len * 0.5} ${o * 1.6} ${-len * 0.85}' stroke='${c[2]}' stroke-opacity='.35' stroke-width='.7' fill='none' filter='url(#fxB06)'/>`).join("")}</g>`)}
    <circle r='6' fill='url(#fc)' filter='url(#fxRough)'/>
    ${rot(10, 36, a => `<circle cx='0' cy='-8.5' r='1' transform='rotate(${a})' fill='#c9871a'/>`)}</g>`, "fxSheen", "")}`;
}
const iris = () => colorFlower(6, ["#e6d4ff", "#8e5ad6", "#3e1a7a"], 32, 14);
const peony = () => colorFlower(9, ["#ffe3ec", "#f4a3c0", "#b9446f"], 28, 15);
const lily = () => colorFlower(6, ["#ffffff", "#f8c7da", "#c0396f"], 36, 10, "#e3a33a");
const hibiscus = () => colorFlower(5, ["#ffb3b3", "#dc2b2b", "#6e0b0b"], 32, 17);

function lavender() {
  const r = rnd(42);
  const sprig = (x: number, rotDeg: number, h: number) => {
    let f = "";
    for (let i = 0; i < 16; i++) {
      const y = -h + i * (h * 0.045) + 2;
      const side = i % 2 ? 1 : -1;
      const col = ["#6e4fa8", "#8a6bc4", "#5a3d90", "#9c82d4"][(r() * 4) | 0];
      f += `<ellipse cx='${side * (2.2 + r() * 1.4)}' cy='${y}' rx='2.6' ry='3.4' transform='rotate(${side * 25} ${side * 2} ${y})' fill='${col}'/>
            <circle cx='${side * 2.6 - 0.7}' cy='${y - 1}' r='.8' fill='#e6dcff' opacity='.55'/>`;
    }
    return `<g transform='translate(${x} 94) rotate(${rotDeg})'><path d='M0 0 C0 -20 0 -40 0 ${-h}' stroke='#6b7f4a' stroke-width='1.8' fill='none'/>${f}</g>`;
  };
  return lit(sprig(42, -12, 84) + sprig(60, 10, 76), "fxMatte", "fxFine");
}

/* ----------------------------------- leaves ----------------------------------- */

function serratedLeaf(len: number, wid: number, teeth: number) {
  const pts: string[] = [];
  const N = teeth * 2;
  const w = (i: number) => wid * Math.pow(Math.sin(Math.PI * Math.min(1, (i / N) * 1.05)), 0.85) * (i % 2 ? 1.08 : 0.94);
  for (let i = 0; i <= N; i++) pts.push(`${(-w(i)).toFixed(2)} ${(-len * (i / N)).toFixed(2)}`);
  for (let i = N; i >= 0; i--) pts.push(`${w(i).toFixed(2)} ${(-len * (i / N)).toFixed(2)}`);
  return `M${pts.join(" L")}Z`;
}

function leafInner(veinCol: string, serr = 0, len = 82, wid = 24) {
  const path = serr ? serratedLeaf(len, wid, serr) : `M0 0 C${-wid * 1.3} ${-len * 0.25} ${-wid * 1.2} ${-len * 0.75} 0 ${-len} C${wid * 1.2} ${-len * 0.75} ${wid * 1.3} ${-len * 0.25} 0 0Z`;
  const veins = [0.18, 0.32, 0.46, 0.6, 0.74].map(t => {
    const y = -len * t;
    return `<path d='M0 ${y + 6} Q${-wid * 0.45} ${y - 2} ${-wid * 0.8} ${y - 10} M0 ${y + 6} Q${wid * 0.45} ${y - 2} ${wid * 0.8} ${y - 10}' stroke='${veinCol}' stroke-opacity='.55' stroke-width='.9' fill='none' filter='url(#fxB06)'/>`;
  }).join("");
  return `<path d='${path}' fill='url(#lf)'/><path d='M0 0 L0 ${-len * 0.96}' stroke='${veinCol}' stroke-opacity='.75' stroke-width='1.2' filter='url(#fxB06)'/>${veins}`;
}

function leaf(c: [string, string, string] = ["#8fbf5a", "#3f7a2a", "#173b12"], vein = "#c7e3a0", turn = -18, serr = 0) {
  return `<defs>${LG("lf", [[0, c[0]], [0.5, c[1]], [1, c[2]]], "x1='0' y1='0' x2='1' y2='1'")}</defs>
  <g transform='translate(52 92) rotate(${turn})'>${lit(leafInner(vein, serr), "fxSheen", "fxFine")}</g>`;
}

function mint() {
  const one = (r: number, s: number, y = 0) => `<g transform='translate(50 ${70 + y}) rotate(${r}) scale(${s})'>${leafInner("#14421a", 7, 60, 19)}</g>`;
  return `<defs>${LG("lf", [[0, "#a6dc86"], [0.55, "#3e9a3a"], [1, "#1d5a20"]], "x1='0' y1='0' x2='1' y2='1'")}</defs>
  ${lit(`<path d='M50 98 L50 64' stroke='#4c7a2c' stroke-width='2.6' stroke-linecap='round'/>${one(-55, 0.75, 4)}${one(55, 0.75, 4)}${one(0, 0.9, -6)}`, "fxMatte", "fxFine")}`;
}

/* ----------------------------------- citrus & fruit ----------------------------------- */

function lemon(c = ["#fff4a3", "#f1cb1c", "#b98a06"], leafy = true) {
  return `<defs>${RG("lm", [[0, c[0]], [0.55, c[1]], [1, c[2]]], "cx='38%' cy='34%' r='72%'")}${LG("lf", [[0, "#8fbf5a"], [1, "#24521a"]], "x1='0' y1='0' x2='1' y2='1'")}</defs>
  ${leafy ? lit(`<path d='M58 26 C64 10 84 6 92 8 C88 22 72 30 58 26Z' fill='url(#lf)'/><path d='M60 25 C70 18 80 12 90 9' stroke='#c7e3a0' stroke-opacity='.6' stroke-width='.7' fill='none'/>`, "fxSheen", "fxFine") : ""}
  ${lit(`<g transform='rotate(-24 50 56)'><path d='M8 56 C8 52 11 50 15 49 C20 36 36 30 50 30 C66 30 80 36 85 49 C89 50 92 52 92 56 C92 60 89 62 85 63 C80 76 66 82 50 82 C36 82 20 76 15 63 C11 62 8 60 8 56Z' fill='url(#lm)'/></g>`, "fxGloss", "fxFine")}`;
}

function citrus(rind: [string, string], flesh: [string, string, string], pith = "#fff4e2") {
  const wedges = rot(10, 36, a => {
    const r1 = 4.5, r2 = 31, a1 = ((a + 2.2) * Math.PI) / 180, a2 = ((a + 33.8) * Math.PI) / 180, am = ((a + 18) * Math.PI) / 180;
    const p = (r: number, t: number) => `${(Math.sin(t) * r).toFixed(2)} ${(-Math.cos(t) * r).toFixed(2)}`;
    return `<path d='M${p(r1, a1)} L${p(r2, a1)} Q${p(r2 + 2.4, am)} ${p(r2, a2)} L${p(r1, a2)}Z' fill='url(#fl)'/>`;
  });
  return `<defs>${RG("fl", [[0, flesh[0]], [0.6, flesh[1]], [1, flesh[2]]], "cx='50%' cy='50%' r='70%'")}${RG("rd", [[0.82, rind[0]], [1, rind[1]]], "cx='50%' cy='50%' r='50%'")}</defs>
  <g transform='translate(50 50) rotate(8)'>
    ${lit(`<circle r='43' fill='url(#rd)'/>`, "fxSheen", "fxFine")}
    <circle r='38.5' fill='${pith}'/><circle r='38.5' fill='none' stroke='#000' stroke-opacity='.08' stroke-width='2' filter='url(#fxB1)'/>
    <g filter='url(#fxSheen)'><g filter='url(#fxGrain)'>${wedges}</g></g>
    <circle r='4' fill='${pith}' opacity='.9'/>
  </g>`;
}
const orange = () => citrus(["#f5891c", "#c45a07"], ["#ffc77a", "#f7931e", "#d96a0a"]);
const grapefruit = () => citrus(["#f39a5b", "#c25a2c"], ["#ffb3a8", "#ef5f5a", "#c23a3a"], "#fff0e6");
const bergamot = () => citrus(["#c7d65a", "#7d8d1c"], ["#fff6b0", "#f0d84a", "#c9ae22"], "#fffbe6");
const limeSlice = () => citrus(["#4d9a2a", "#245a12"], ["#e9f7a8", "#a8d24a", "#6e9e22"], "#f6fbe4");

function pome(body: string, c: [string, string, string], opts: { gloss?: boolean; leafy?: boolean; cleft?: boolean; streaks?: string } = {}) {
  const { gloss = true, leafy = true, cleft = false, streaks } = opts;
  const r = rnd(7);
  const st = streaks ? Array.from({ length: 14 }, () => { const x = 24 + r() * 52; return `<path d='M${x} ${36 + r() * 10} Q${x + (r() - 0.5) * 8} 60 ${x + (r() - 0.5) * 6} ${76 + r() * 10}' stroke='${streaks}' stroke-opacity='${0.1 + r() * 0.16}' stroke-width='${0.8 + r() * 1.4}' fill='none' filter='url(#fxB2)'/>`; }).join("") : "";
  return `<defs>${RG("a", [[0, c[0]], [0.5, c[1]], [1, c[2]]], "cx='36%' cy='34%' r='75%'")}${LG("lf", [[0, "#8fbf5a"], [1, "#24521a"]], "x1='0' y1='0' x2='1' y2='1'")}<clipPath id='cl'><path d='${body}'/></clipPath></defs>
  ${lit(`<path d='${body}' fill='url(#a)'/><g clip-path='url(#cl)'>${st}${cleft ? `<path d='M50 30 C42 50 44 72 52 90' stroke='${c[2]}' stroke-opacity='.55' stroke-width='3' fill='none' filter='url(#fxB2)'/>` : ""}</g>`, gloss ? "fxGloss" : "fxMatte", "fxFine")}
  ${lit(`<path d='M50 32 C49 24 52 16 56 11' stroke='#5b3a1c' stroke-width='2.6' fill='none' stroke-linecap='round'/>${leafy ? `<path d='M55 18 C62 6 80 6 86 10 C80 22 64 26 55 18Z' fill='url(#lf)'/>` : ""}`, "fxSheen", "fxFine")}`;
}
const APPLE = "M50 32 C30 20 10 36 14 60 C18 82 36 94 50 88 C64 94 82 82 86 60 C90 36 70 20 50 32Z";
const apple = () => pome(APPLE, ["#ff8a7a", "#c81e1e", "#5e0909"], { streaks: "#ffd27a" });
const greenApple = () => pome(APPLE, ["#e9f7a0", "#8cc63a", "#3e6e12"], { streaks: "#f5f7c0" });
const peach = () => pome(APPLE, ["#ffe3b8", "#f7964a", "#c2412a"], { gloss: false, cleft: true });
const plum = () => pome("M50 26 C28 24 16 44 18 62 C20 82 36 92 52 90 C70 88 84 76 84 56 C84 38 70 26 50 26Z", ["#b9a0e8", "#5a2b96", "#1f0a3d"], { leafy: false, cleft: true });
const pear = () => pome("M50 16 C42 16 41 26 38 36 C20 46 14 70 30 84 C42 94 58 94 70 84 C86 70 80 46 62 36 C59 26 58 16 50 16Z", ["#f6f4b0", "#c6d44a", "#6a7a1a"], { gloss: false });

function mango() {
  return `<defs>${LG("m", [[0, "#5a9a2a"], [0.4, "#e8c22a"], [0.75, "#f58a1c"], [1, "#d8401a"]], "x1='0' y1='0' x2='1' y2='1'")}</defs>
  ${lit(`<path d='M30 22 C52 10 84 28 86 54 C88 80 64 94 44 88 C22 82 12 58 18 40 C20 32 24 26 30 22Z' fill='url(#m)'/>`, "fxGloss", "fxFine")}
  ${lit(`<path d='M30 22 C28 16 30 10 34 6' stroke='#5b3a1c' stroke-width='2.4' fill='none' stroke-linecap='round'/>`, "fxSheen", "fxFine")}`;
}

function strawberry() {
  const r = rnd(11);
  const body = "M50 94 C24 76 12 50 20 36 C28 24 42 28 50 32 C58 28 72 24 80 36 C88 50 76 76 50 94Z";
  const seeds = Array.from({ length: 26 }, () => {
    const x = 26 + r() * 48, y = 38 + r() * 44;
    return `<ellipse cx='${x}' cy='${y}' rx='1.8' ry='2.4' fill='#5e0612' opacity='.5' filter='url(#fxB06)'/><ellipse cx='${x}' cy='${y - 0.4}' rx='.8' ry='1.3' fill='#f2d36b'/>`;
  }).join("");
  return `<defs>${RG("s", [[0, "#ff7a7a"], [0.55, "#d3121e"], [1, "#6a0410"]], "cx='38%' cy='36%' r='75%'")}<clipPath id='cl'><path d='${body}'/></clipPath></defs>
  ${lit(`<path d='${body}' fill='url(#s)'/><g clip-path='url(#cl)'>${seeds}</g>`, "fxGloss", "fxFine")}
  ${lit(`<path d='M50 33 L34 22 L44 28 L38 14 L50 26 L62 14 L56 28 L66 22 L50 33Z M50 33 L26 32 L42 35 M50 33 L74 32 L58 35' fill='#3f8a2a' stroke='#3f8a2a' stroke-width='1.6' stroke-linejoin='round'/>`, "fxMatte", "fxFine")}`;
}

function drupes(c: [string, string, string], leafy: boolean) {
  const r = rnd(5);
  let d = "";
  for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++) {
    const x = 32 + col * 9 + (row % 2) * 4.5 + (r() - 0.5) * 1.5, y = 30 + row * 8;
    const w = Math.sin(((row + 0.5) / 7) * Math.PI);
    if (Math.abs(x - 52) > 24 * w + 3) continue;
    d += `<circle cx='${x}' cy='${y}' r='5.4' fill='url(#d)'/>`;
  }
  return `<defs>${RG("d", [[0, c[0]], [0.55, c[1]], [1, c[2]]], "cx='35%' cy='30%' r='70%'")}</defs>
  ${leafy ? lit(`<path d='M52 26 C46 12 30 8 22 12 C30 24 44 28 52 26Z M52 26 C60 12 76 8 84 12 C76 24 62 28 52 26Z' fill='#3f8a2a'/>`, "fxMatte", "fxFine") : ""}
  ${lit(d, "fxGloss", "fxFine")}`;
}
const raspberry = () => drupes(["#ff9aa8", "#d81b4a", "#6a0620"], true);
const blackberry = () => drupes(["#8a7aa8", "#2a1440", "#07020d"], true);

function grapes() {
  const pts: [number, number][] = [[34, 34], [52, 32], [68, 36], [42, 50], [60, 50], [30, 52], [72, 54], [50, 66], [38, 68], [62, 68], [50, 82]];
  return `<defs>${RG("g", [[0, "#b9a6e0"], [0.5, "#5b2e8c"], [1, "#1e0a36"]], "cx='35%' cy='30%' r='70%'")}</defs>
  ${lit(`<path d='M52 24 C52 14 56 10 60 6' stroke='#6a4a2a' stroke-width='2.4' fill='none' stroke-linecap='round'/>`, "fxSheen", "fxFine")}
  ${lit(pts.map(([x, y]) => `<circle cx='${x}' cy='${y}' r='10.5' fill='url(#g)'/>`).join(""), "fxGloss", "fxGrain")}`;
}

function cherry() {
  return `<defs>${RG("c", [[0, "#ff7a7a"], [0.45, "#a80c1c"], [1, "#3a0208"]], "cx='35%' cy='30%' r='70%'")}${LG("lf", [[0, "#8fbf5a"], [1, "#24521a"]], "x1='0' y1='0' x2='1' y2='1'")}</defs>
  ${lit(`<path d='M30 60 C34 40 44 22 58 12 M70 62 C66 44 62 26 58 12' stroke='#5a6a2a' stroke-width='2' fill='none' stroke-linecap='round'/><path d='M58 12 C66 2 84 4 88 8 C82 20 66 20 58 12Z' fill='url(#lf)'/>`, "fxSheen", "fxFine")}
  ${lit(`<path d='M30 56 C18 54 10 64 12 74 C14 86 26 90 34 86 C44 82 48 70 42 62 C40 58 36 56 30 56Z' fill='url(#c)'/><path d='M70 58 C58 56 50 66 52 76 C54 88 66 92 74 88 C84 84 88 72 82 64 C80 60 76 58 70 58Z' fill='url(#c)'/>`, "fxGloss", "fxFine")}`;
}

function coconut() {
  return `<defs>${RG("sh", [[0.7, "#8a5a32"], [1, "#3a2210"]], "cx='50%' cy='50%' r='50%'")}${RG("fl", [[0, "#f2ede0"], [0.8, "#ffffff"], [1, "#e6dfcc"]], "cx='50%' cy='45%' r='55%'")}</defs>
  ${lit(`<circle cx='50' cy='52' r='42' fill='url(#sh)'/>`, "fxMatte", "fxCoarse")}
  ${lit(`<circle cx='50' cy='52' r='34' fill='url(#fl)'/><circle cx='50' cy='54' r='24' fill='#d9d2bf' opacity='.6' filter='url(#fxB4)'/>`, "fxSheen", "fxFine")}`;
}

/* ----------------------------------- spices & sweets ----------------------------------- */

function cinnamon() {
  const stick = (x: number, y: number, r: number, l = 64) => `<g transform='translate(${x} ${y}) rotate(${r})'>
    <path d='M${-l / 2} -8 H${l / 2 - 4} A4 8 0 0 1 ${l / 2 - 4} 8 H${-l / 2} A4 8 0 0 1 ${-l / 2} -8Z' fill='url(#cn)'/>
    <ellipse cx='${l / 2 - 4}' cy='0' rx='4.4' ry='8' fill='#7a3c16'/>
    <path d='M${l / 2 - 4} 0 m-0.8 0 a1.6 2.6 0 1 1 1.6 2.6 a3 5.4 0 1 1 -3.4 -5.6' fill='none' stroke='#3a1806' stroke-width='1.2'/></g>`;
  return `<defs>${LG("cn", [[0, "#c47a44"], [0.35, "#a55a28"], [1, "#4f230c"]])}</defs>
  ${lit(stick(48, 34, -14) + stick(52, 54, 8) + stick(46, 72, -5, 58), "fxMatte", "fxWoodX")}`;
}

function anise() {
  return `<defs>${RG("a", [[0, "#b8693a"], [0.6, "#6e3214"], [1, "#2e1206"]], "cx='50%' cy='70%' r='75%'")}${RG("sd", [[0, "#f0d6a8"], [1, "#a8723a"]])}</defs>
  ${lit(`<g transform='translate(50 50)'>${rot(8, 45, a => `<g transform='rotate(${a})'><path d='M0 -3 C-9 -10 -10 -26 0 -40 C10 -26 9 -10 0 -3Z' fill='url(#a)'/><path d='M0 -12 C-2 -20 -2 -28 0 -34 C2 -28 2 -20 0 -12Z' fill='#1e0a02' opacity='.7'/><ellipse cx='0' cy='-24' rx='2.6' ry='4.4' fill='url(#sd)'/></g>`)}<circle r='6' fill='#3a1806'/></g>`, "fxMatte", "fxGrain")}`;
}

function peppercorns(c: [string, string, string], n = 7) {
  const r = rnd(3);
  const pts = Array.from({ length: n }, (_, i) => [24 + ((i * 37) % 52) + r() * 6, 30 + ((i * 23) % 44) + r() * 6, 10 + r() * 4] as const);
  return `<defs>${RG("p", [[0, c[0]], [0.55, c[1]], [1, c[2]]], "cx='35%' cy='30%' r='70%'")}</defs>
  ${lit(pts.map(([x, y, rr]) => `<circle cx='${x}' cy='${y}' r='${rr}' fill='url(#p)' filter='url(#fxRough)'/>`).join(""), "fxMatte", "fxCoarse")}`;
}
const pepper = () => peppercorns(["#6a5a4a", "#2a1f16", "#0a0605"]);
const pinkPepper = () => peppercorns(["#ffb0b0", "#d2384a", "#6a0e18"], 9);

function cardamom() {
  const pod = (x: number, y: number, r: number) => `<g transform='translate(${x} ${y}) rotate(${r})'>
    <path d='M0 -34 C14 -22 16 22 0 34 C-16 22 -14 -22 0 -34Z' fill='url(#cd)'/>
    ${[-8, -3, 3, 8].map(o => `<path d='M${o * 0.45} -28 C${o * 1.4} -10 ${o * 1.4} 10 ${o * 0.45} 28' stroke='#3e5a1a' stroke-opacity='.5' stroke-width='.9' fill='none' filter='url(#fxB06)'/>`).join("")}</g>`;
  return `<defs>${LG("cd", [[0, "#d6e3a0"], [0.5, "#93ad4a"], [1, "#4a6018"]], "x1='0' y1='0' x2='1' y2='0'")}</defs>${lit(pod(38, 52, -22) + pod(64, 50, 16), "fxMatte", "fxGrain")}`;
}

function vanilla() {
  return `<defs>${LG("v", [[0, "#6a3e22"], [0.5, "#2e170a"], [1, "#140803"]], "x1='0' y1='0' x2='1' y2='1'")}${LG("op", [[0, "#e9eab0"], [1, "#fffde8"]], "x1='0' y1='1' x2='0' y2='0'")}</defs>
  ${lit(`<path d='M14 84 C28 62 46 38 74 12 L80 18 C54 44 36 68 22 90Z' fill='url(#v)'/><path d='M26 88 C40 68 56 46 82 22 L86 28 C62 50 46 72 34 92Z' fill='url(#v)'/>`, "fxGloss", "fxWoodY")}
  ${lit(`<g transform='translate(68 74)'>${rot(5, 72, a => `<ellipse cx='0' cy='-9.5' rx='4.4' ry='9.5' transform='rotate(${a})' fill='url(#op)'/>`)}<circle r='3.4' fill='#e9c45a'/></g>`, "fxMatte", "fxFine")}`;
}

function coffee() {
  const bean = (x: number, y: number, r: number, s: number) => `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})'>
    <ellipse rx='20' ry='28' fill='url(#b)'/><path d='M0 -26 C-9 -8 9 8 0 26' stroke='#120803' stroke-width='3.2' fill='none' stroke-linecap='round' filter='url(#fxB06)'/></g>`;
  return `<defs>${RG("b", [[0, "#8a5a38"], [0.6, "#3d2314"], [1, "#160b05"]], "cx='38%' cy='32%' r='75%'")}</defs>
  ${lit(bean(40, 46, -30, 1) + bean(68, 62, 24, 0.8), "fxGloss", "fxFine")}`;
}

function chocolate() {
  const sq = (x: number, y: number) => `<rect x='${x}' y='${y}' width='30' height='30' rx='2.5' fill='url(#ch)'/><rect x='${x + 4}' y='${y + 4}' width='22' height='22' rx='1.6' fill='#000' opacity='.18' filter='url(#fxB06)'/>`;
  return `<defs>${LG("ch", [[0, "#7a4a30"], [1, "#2a140b"]], "x1='0' y1='0' x2='1' y2='1'")}</defs>${lit(sq(18, 18) + sq(52, 18) + sq(18, 52) + sq(52, 52), "fxGloss", "fxFine")}`;
}

function honey() {
  return `<defs>${RG("h", [[0, "#ffe9a0"], [0.45, "#f0a020"], [1, "#8a3e04"]], "cx='42%' cy='55%' r='65%'")}</defs>
  ${lit(`<path d='M50 6 C50 6 18 46 18 64 C18 82 32 94 50 94 C68 94 82 82 82 64 C82 46 50 6 50 6Z' fill='url(#h)'/><ellipse cx='54' cy='76' rx='14' ry='7' fill='#fff2b0' opacity='.45' filter='url(#fxB4)'/>`, "fxGloss", "fxFine")}`;
}

function almond() {
  const a = (x: number, y: number, r: number, s: number) => `<g transform='translate(${x} ${y}) rotate(${r}) scale(${s})'><path d='M0 -40 C24 -24 26 18 0 40 C-26 18 -24 -24 0 -40Z' fill='url(#a)'/></g>`;
  return `<defs>${RG("a", [[0, "#e6b882"], [0.6, "#a8693a"], [1, "#5a3214"]], "cx='38%' cy='34%' r='75%'")}</defs>${lit(a(42, 50, 18, 0.95) + a(70, 58, -24, 0.65), "fxMatte", "fxWoodY")}`;
}

/* ----------------------------------- woods, resins, musk, water ----------------------------------- */

function woodDisc(c: [string, string, string, string]) {
  return `<defs>${RG("w", [[0, c[1]], [0.85, c[2]], [1, c[3]]], "cx='50%' cy='50%' r='50%'")}</defs>
  ${lit(`<circle cx='50' cy='50' r='43' fill='${c[0]}'/>`, "fxMatte", "fxCoarse")}
  ${lit(`<circle cx='50' cy='50' r='37' fill='url(#w)'/>
    <g filter='url(#fxWobble)' fill='none' stroke='${c[0]}'>${[33, 28, 23.5, 19, 15, 11, 7.5, 4].map((r, i) => `<circle cx='${50 + (i % 3) * 0.6}' cy='${50 - (i % 2) * 0.6}' r='${r}' stroke-opacity='${0.22 + (i % 3) * 0.08}' stroke-width='${0.8 + (i % 2) * 0.6}'/>`).join("")}</g>
    <path d='M50 50 L84 42' stroke='${c[0]}' stroke-opacity='.45' stroke-width='1' filter='url(#fxWobble)'/>`, "fxMatte", "fxFine")}`;
}
const sandal = () => woodDisc(["#6a4020", "#f0d2a2", "#d9a86a", "#b07a40"]);
const cedar = () => woodDisc(["#5a2a14", "#e7a27a", "#c06a3e", "#8a3e1e"]);

function oud() {
  const chip = (pts: string, t: string) => `<g transform='${t}'><polygon points='${pts}' fill='url(#o)'/><polygon points='${pts}' fill='url(#os)' opacity='.6'/></g>`;
  return `<defs>${LG("o", [[0, "#6a4428"], [0.5, "#3a2212"], [1, "#160a04"]], "x1='0' y1='0' x2='1' y2='0'")}${LG("os", [[0, "#000", 0], [0.4, "#000", 0.7], [0.55, "#000", 0], [0.8, "#000", 0.6], [1, "#000", 0]], "x1='0' y1='0' x2='1' y2='0'")}</defs>
  ${lit(chip("6,50 30,38 74,40 92,52 70,62 24,64", "rotate(-16 50 50) translate(0 -12)") + chip("10,70 40,62 82,66 70,78 30,80", "rotate(8 50 70) translate(0 6)"), "fxSheen", "fxWoodX")}`;
}

function amber() {
  const lump = (x: number, y: number, r: number) => `<circle cx='${x}' cy='${y}' r='${r}' fill='url(#am)'/>`;
  return `<defs>${RG("am", [[0, "#ffe08a"], [0.45, "#f2a01c"], [0.85, "#a8480a"], [1, "#5a2004"]], "cx='45%' cy='45%' r='55%'")}</defs>
  <g filter='url(#fxGloss)'><g filter='url(#fxWobble)'>${lump(40, 46, 24)}${lump(68, 64, 18)}${lump(30, 74, 12)}</g></g>
  <g fill='#5a2004' opacity='.6'><circle cx='36' cy='48' r='1'/><circle cx='46' cy='40' r='.7'/><circle cx='70' cy='66' r='.9'/></g>
  <ellipse cx='42' cy='50' rx='10' ry='7' fill='#fff1b0' opacity='.35' filter='url(#fxB4)'/>`;
}

function incense() {
  return `<defs>${RG("t", [[0, "#fff6d0"], [0.6, "#e8c36a"], [1, "#a8782a"]], "cx='38%' cy='34%' r='70%'")}</defs>
  <g filter='url(#fxWisp)' fill='none' stroke-linecap='round'>
    <path d='M50 70 C40 60 62 52 50 40 C40 30 60 22 52 8' stroke='#8a8a8a' stroke-opacity='.55' stroke-width='5'/>
    <path d='M46 70 C34 58 56 50 42 36 C34 28 48 18 40 10' stroke='#b0b0b0' stroke-opacity='.4' stroke-width='3'/>
    <path d='M56 68 C68 58 50 48 64 36' stroke='#9a9a9a' stroke-opacity='.35' stroke-width='3'/></g>
  ${lit([[34, 82, 9], [52, 84, 11], [70, 82, 8], [44, 74, 7], [61, 74, 6]].map(([x, y, r]) => `<circle cx='${x}' cy='${y}' r='${r}' fill='url(#t)'/>`).join(""), "fxGloss", "fxWobble")}`;
}

function musk() {
  const r = rnd(9);
  const puffs = Array.from({ length: 22 }, () => { const a = r() * 6.28, d = r() * 22; return `<circle cx='${50 + Math.cos(a) * d * 1.2}' cy='${54 + Math.sin(a) * d * 0.8}' r='${10 + r() * 10}' fill='url(#m)'/>`; }).join("");
  return `<defs>${RG("m", [[0, "#ffffff"], [0.7, "#f6f2fa"], [1, "#d6cfe0"]], "cx='42%' cy='35%' r='65%'")}</defs>
  <g filter='url(#fxMatte)'><g filter='url(#fxWobble)'>${puffs}</g></g>
  <g filter='url(#fxWisp)' opacity='.5'>${puffs}</g>`;
}

function water() {
  return `<defs>${RG("d", [[0, "#ffffff", 0.9], [0.5, "#9fd4f2", 0.75], [0.85, "#3c8fc8", 0.85], [1, "#0f4c86", 0.95]], "cx='42%' cy='58%' r='60%'")}</defs>
  ${lit(`<path d='M50 6 C50 6 20 44 20 63 C20 80 33 92 50 92 C67 92 80 80 80 63 C80 44 50 6 50 6Z' fill='url(#d)'/>`, "fxGloss", "fxFine")}
  <ellipse cx='56' cy='80' rx='12' ry='5' fill='#ffffff' opacity='.7' filter='url(#fxB2)'/>
  ${lit(`<circle cx='82' cy='30' r='6' fill='url(#d)'/><circle cx='16' cy='30' r='4' fill='url(#d)'/>`, "fxGloss", "fxFine")}`;
}

function leather() {
  return `<defs>${LG("l", [[0, "#9a5a32"], [0.5, "#6a3418"], [1, "#2e1408"]], "x1='0' y1='0' x2='1' y2='1'")}</defs>
  ${lit(`<path d='M12 26 Q14 20 22 20 H80 Q88 22 88 30 V70 Q86 80 76 80 H22 Q12 80 12 70Z' fill='url(#l)'/>`, "fxSheen", "fxCoarse")}
  <path d='M19 27 H81 V73 H19Z' fill='none' stroke='#e2b07a' stroke-opacity='.85' stroke-width='1.2' stroke-dasharray='3 2.4' filter='url(#fxB06)'/>
  <path d='M12 56 C34 48 56 64 88 50' stroke='#1a0a04' stroke-opacity='.35' stroke-width='2' fill='none' filter='url(#fxB2)'/>`;
}

function whisky() {
  return `<defs>${LG("w", [[0, "#ffc56a"], [1, "#a0480a"]])}${LG("gl", [[0, "#ffffff", 0.5], [0.2, "#ffffff", 0.08], [0.8, "#ffffff", 0.06], [1, "#ffffff", 0.45]], "x1='0' y1='0' x2='1' y2='0'")}</defs>
  <path d='M24.6 42 H75.4 L72 88 Q72 92 66 92 H34 Q28 92 28 88Z' fill='url(#w)' opacity='.92'/>
  <g filter='url(#fxGloss)'><rect x='34' y='44' width='20' height='20' rx='3' transform='rotate(-12 44 54)' fill='#fff' fill-opacity='.55'/><rect x='52' y='54' width='18' height='18' rx='3' transform='rotate(14 60 63)' fill='#fff' fill-opacity='.5'/></g>
  <path d='M22 22 H78 L72 88 Q72 93 66 93 H34 Q28 93 28 88Z' fill='url(#gl)'/>
  <path d='M22 22 H78 L72 88 Q72 93 66 93 H34 Q28 93 28 88Z' fill='none' stroke='#8a96a0' stroke-opacity='.6' stroke-width='1' filter='url(#fxB06)'/>
  <rect x='28' y='86' width='44' height='7' rx='3' fill='#fff' opacity='.35' filter='url(#fxB06)'/>`;
}

function aura() {
  return `<defs>${RG("s", [[0, "#fffbe8"], [0.4, "#f3dc8a"], [1, "#c9a23a", 0]], "cx='50%' cy='50%' r='50%'")}</defs>
  <circle cx='50' cy='50' r='34' fill='url(#s)' filter='url(#fxB2)'/>
  ${[[30, 34, 5], [68, 30, 4], [72, 66, 6], [34, 70, 3.5], [52, 18, 3]].map(([x, y, r]) => `<circle cx='${x}' cy='${y}' r='${r}' fill='#fff6d0' opacity='.7' filter='url(#fxB1)'/>`).join("")}`;
}

/* ----------------------------------- mapping ----------------------------------- */

type ArtDef = { key: string; draw: () => string };
const A = (key: string, draw: () => string): ArtDef => ({ key, draw });

const ART: ArtDef[] = [
  A("rose", () => rose()),
  A("jasmine", jasmine),
  A("orangeBlossom", orangeBlossom),
  A("lavender", lavender),
  A("iris", iris),
  A("peony", peony),
  A("lily", lily),
  A("hibiscus", hibiscus),
  A("mint", mint),
  A("leaf", () => leaf()),
  A("tobaccoLeaf", () => leaf(["#d9a866", "#9a5e28", "#4a2810"], "#f0d0a0", 14)),
  A("patchouli", () => leaf(["#7aa25a", "#2f5a24", "#0f2a0c"], "#b8d8a0", -20, 8)),
  A("lemon", () => lemon()),
  A("lime", () => lemon(["#d9f2a0", "#6aa82a", "#2e5a10"])),
  A("orange", orange),
  A("grapefruit", grapefruit),
  A("bergamot", bergamot),
  A("limeSlice", limeSlice),
  A("apple", apple),
  A("greenApple", greenApple),
  A("pear", pear),
  A("peach", peach),
  A("plum", plum),
  A("strawberry", strawberry),
  A("raspberry", raspberry),
  A("blackberry", blackberry),
  A("grapes", grapes),
  A("cherry", cherry),
  A("coconut", coconut),
  A("mango", mango),
  A("cinnamon", cinnamon),
  A("anise", anise),
  A("pepper", pepper),
  A("pinkPepper", pinkPepper),
  A("cardamom", cardamom),
  A("vanilla", vanilla),
  A("coffee", coffee),
  A("chocolate", chocolate),
  A("honey", honey),
  A("almond", almond),
  A("oud", oud),
  A("sandal", sandal),
  A("cedar", cedar),
  A("amber", amber),
  A("incense", incense),
  A("musk", musk),
  A("water", water),
  A("leather", leather),
  A("whisky", whisky),
  A("aura", aura),
];
const ART_BY_KEY = new Map(ART.map(a => [a.key, a]));

// First match wins — specific words before general ones.
const NOTE_MAP: [RegExp, string][] = [
  [/pink pepper|rose pepper/i, "pinkPepper"],
  [/orange blossom|neroli|orange flower/i, "orangeBlossom"],
  [/jasmine|jasmin|tiare|gardenia|tuberose|magnolia|frangipani|ylang|osmanthus|mimosa|lotus|water lily|lily of the valley|muguet|white flower|white floral/i, "jasmine"],
  [/rose|damask|taif|geranium/i, "rose"],
  [/lavender|lavandin/i, "lavender"],
  [/violet|iris|orris|lilac|wisteria|heliotrope|orchid/i, "iris"],
  [/lily|poppy|freesia|hyacinth/i, "lily"],
  [/hibiscus/i, "hibiscus"],
  [/peony|cherry blossom|sakura|cyclamen|floral|flower|blossom|carnation|camellia|chamomile|daisy/i, "peony"],
  [/tobacco|tabac|cigar|hay/i, "tobaccoLeaf"],
  [/patchouli|vetiver|moss|oakmoss|fern/i, "patchouli"],
  [/mint|basil|sage|thyme|rosemary|herb|clary|tea\b|spearmint|peppermint|marjoram|oregano|lemongrass/i, "mint"],
  [/lemon/i, "lemon"],
  [/lime|yuzu|citron/i, "lime"],
  [/grapefruit|pomelo/i, "grapefruit"],
  [/bergamot|petitgrain|bitter orange|citrus|clementine/i, "bergamot"],
  [/orange|mandarin|tangerine/i, "orange"],
  [/green apple/i, "greenApple"],
  [/apple/i, "apple"],
  [/pear/i, "pear"],
  [/peach|apricot|nectarine/i, "peach"],
  [/plum|fig\b|prune/i, "plum"],
  [/blackcurrant|cassis|blackberry|blueberry|currant|mulberry|bilberry/i, "blackberry"],
  [/raspberry|berry|berries|cranberry/i, "raspberry"],
  [/strawberry|pomegranate/i, "strawberry"],
  [/grape|wine|champagne/i, "grapes"],
  [/cherry|amarena/i, "cherry"],
  [/coconut/i, "coconut"],
  [/pineapple|mango|passion|papaya|tropical|guava|lychee|melon|banana|fruit|watermelon|kiwi/i, "mango"],
  [/leaf|leaves|green|grass|bamboo|eucalyptus|galbanum|clover|cucumber|tomato|aloe/i, "leaf"],
  [/cardamom|saffron/i, "cardamom"],
  [/anise|fennel|licorice|liquorice/i, "anise"],
  [/cinnamon|clove|nutmeg|spice|spicy|curry|cumin|coriander|ginger|turmeric|allspice|cassia/i, "cinnamon"],
  [/pepper|peppercorn/i, "pepper"],
  [/vanilla|tonka|marshmallow|custard|cream|milk|praline|cookie|biscuit/i, "vanilla"],
  [/caramel|toffee|sugar|candy|honey|cotton candy|butterscotch|maple|syrup|nectar|beeswax/i, "honey"],
  [/chocolate|cocoa|cacao/i, "chocolate"],
  [/coffee|espresso|cafe/i, "coffee"],
  [/almond|hazelnut|walnut|\bnuts?\b|pistachio|peanut/i, "almond"],
  [/oud|agarwood|aoud|oudh|guaiac|ebony/i, "oud"],
  [/sandalwood|sandal|balsa|rosewood|palo santo|birch|teak/i, "sandal"],
  [/cedar|cypress|pine|fir\b|juniper|oak\b|wood|driftwood/i, "cedar"],
  [/amber|ambergris|ambroxan|labdanum|benzoin|resin|opoponax|balsam|copal/i, "amber"],
  [/incense|frankincense|myrrh|olibanum|smoke|smoky|smoked|burnt|bakhoor|fire/i, "incense"],
  [/leather|suede/i, "leather"],
  [/musk|cashmere|powder|powdery|skin|soft|velvet|white cloud/i, "musk"],
  [/marine|sea\b|seaweed|ocean|aquatic|water|watery|salt|rain|aldehyde|ozon|fresh|ice\b|mineral|cool|dew|calone|aqua/i, "water"],
  [/whisky|whiskey|rum\b|cognac|brandy|vodka|gin\b|liquor|beer|bourbon|absinthe|alcohol/i, "whisky"],
];

export function artKeyFor(note: string): string {
  for (const [re, key] of NOTE_MAP) if (re.test(note)) return key;
  return "aura";
}

export function artSvg(key: string): string {
  const def = ART_BY_KEY.get(key) ?? ART_BY_KEY.get("aura")!;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 100 100'>
    <defs>${FX}<filter id='dshadow' x='-20%' y='-20%' width='140%' height='150%'><feDropShadow dx='0' dy='3' stdDeviation='2.6' flood-color='#1a1208' flood-opacity='.32'/></filter></defs>
    <g filter='url(#dshadow)' transform='translate(7 6) scale(.86)'>${def.draw()}</g>
  </svg>`;
}

export function artDataUrl(key: string): string {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(artSvg(key));
}

export const ALL_ART_KEYS = ART.map(a => a.key);
