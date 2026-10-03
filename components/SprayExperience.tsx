"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { artDataUrl, artKeyFor } from "./sprayArt";

/* ------------------------------------------------------------------------------------------
   "Spray & Smell" — played right on the product page (no new screen).
   Tapping the button makes a luxury glass bottle appear on the main product photo. It sprays:
   a soft, realistic mist drifts out of the nozzle to the right across the page, carrying the
   perfume's own notes (rose, lemon, oud…) — Top notes first, then Heart, then Base.
   The photo box on the product page carries data-spray-anchor so the bottle knows where to stand.
------------------------------------------------------------------------------------------- */

type ProductLike = {
  name: string;
  brand?: string;
  topNotes?: string;
  heartNotes?: string;
  baseNotes?: string;
  mainAccord?: string;
  fragranceFamily?: string;
};

const GOLD = "#b8933a";

// Liquid colour per scent family
const LIQUIDS: [RegExp, string][] = [
  [/floral|rose|jasmine|peony|powdery/i, "#e7a0b4"],
  [/citrus|fresh|zest/i, "#f1d36a"],
  [/aquatic|marine|ozonic|water/i, "#8cc6e6"],
  [/fruity|gourmand|sweet|berry/i, "#e98a8a"],
  [/spicy|spice|leather|tobacco/i, "#d0782e"],
  [/aromatic|green|fougere|fougère|herbal/i, "#a9cf86"],
  [/oriental|amber|vanilla|oud|incense/i, "#d99a2b"],
  [/woody|wood|chypre|earthy|musk/i, "#c8873e"],
];
function liquidFor(text: string): string {
  for (const [re, c] of LIQUIDS) if (re.test(text)) return c;
  return "#e2b65a";
}

function splitNotes(value?: string, max = 5): string[] {
  if (!value) return [];
  return value.split(",").map(s => s.trim()).filter(Boolean).slice(0, max);
}

// A soft "psssht" made with the browser's audio engine (no file to download).
function playSpraySound(volume = 0.1) {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const len = Math.floor(ctx.sampleRate * 0.8);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.4) * Math.min(1, t * 40);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2400;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 9000;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(hp);
    hp.connect(lp);
    lp.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {
    /* sound is optional */
  }
}

/* ---------------------------------- the bottle ---------------------------------- */

// viewBox 160 x 320. The nozzle opening sits at (NOZ_X, NOZ_Y) of that box.
const VB_W = 160, VB_H = 320;
const NOZ_X = 97 / VB_W;
const NOZ_Y = 72 / VB_H;

function Bottle({ liquid, pressed, className, style }: { liquid: string; pressed: boolean; className?: string; style?: CSSProperties }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (n: string) => `sb${n}${uid}`;
  const u = (n: string) => `url(#${id(n)})`;
  const BODY = "M30 118 H130 Q142 118 142 131 V281 Q142 300 123 300 H37 Q18 300 18 281 V131 Q18 118 30 118Z";
  const CAV = "M36 132 H124 Q129 132 129 138 V264 Q129 271 122 271 H38 Q31 271 31 264 V138 Q31 132 36 132Z";
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className={className} style={{ overflow: "visible", ...style }} aria-hidden="true">
      <defs>
        <filter id={id("b1")} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1" /></filter>
        <filter id={id("b2")} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" /></filter>
        <filter id={id("b5")} x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="5" /></filter>
        <linearGradient id={id("glass")} x1="0" x2="1">
          <stop offset="0" stopColor="#5d6670" stopOpacity="0.55" />
          <stop offset="0.04" stopColor="#c9d1d9" stopOpacity="0.35" />
          <stop offset="0.12" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="0.85" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="0.93" stopColor="#8b95a0" stopOpacity="0.32" />
          <stop offset="0.975" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#4c545d" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={id("liqH")} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.4" />
          <stop offset="0.2" stopColor="#000" stopOpacity="0.05" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.7" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id={id("liqV")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={liquid} stopOpacity="0.82" />
          <stop offset="0.6" stopColor={liquid} stopOpacity="0.95" />
          <stop offset="1" stopColor={liquid} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={id("liqDark")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#3a1a00" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={id("gold")} x1="0" x2="1">
          <stop offset="0" stopColor="#5e4512" />
          <stop offset="0.14" stopColor="#c9a24a" />
          <stop offset="0.3" stopColor="#fbe9b0" />
          <stop offset="0.42" stopColor="#d8b25a" />
          <stop offset="0.62" stopColor="#8a6a22" />
          <stop offset="0.82" stopColor="#c7a14c" />
          <stop offset="1" stopColor="#4e3a10" />
        </linearGradient>
        <linearGradient id={id("goldTop")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff5d0" />
          <stop offset="1" stopColor="#b8913c" />
        </linearGradient>
        <linearGradient id={id("silver")} x1="0" x2="1">
          <stop offset="0" stopColor="#5d6168" />
          <stop offset="0.35" stopColor="#eef0f2" />
          <stop offset="0.65" stopColor="#9da2a8" />
          <stop offset="1" stopColor="#4a4e55" />
        </linearGradient>
        <linearGradient id={id("engrave")} x1="0" x2="1">
          <stop offset="0" stopColor="#8a6a22" />
          <stop offset="0.5" stopColor="#f3dc8a" />
          <stop offset="1" stopColor="#8a6a22" />
        </linearGradient>
        <clipPath id={id("cav")}><path d={CAV} /></clipPath>
        <clipPath id={id("body")}><path d={BODY} /></clipPath>
      </defs>

      {/* shadow + coloured caustic light on the surface */}
      <ellipse cx="80" cy="303" rx="64" ry="6" fill="#000" opacity="0.28" filter={u("b5")} />
      <ellipse cx="116" cy="304" rx="44" ry="5" fill={liquid} opacity="0.35" filter={u("b5")} />

      {/* glass body */}
      <path d={BODY} fill="#eef2f5" fillOpacity="0.32" />
      <g clipPath={u("body")}>
        {/* liquid seen through the walls (refracted, a little wider) */}
        <rect x="22" y="150" width="116" height="125" fill={liquid} opacity="0.28" filter={u("b2")} />
        {/* thick base: refracted liquid colour + bright bottom edge */}
        <rect x="24" y="274" width="112" height="20" fill={liquid} opacity="0.4" filter={u("b2")} />
        <path d="M30 296 H130" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.6" filter={u("b1")} />
      </g>
      {/* liquid */}
      <g clipPath={u("cav")}>
        <rect x="31" y="150" width="98" height="122" fill={u("liqV")} />
        <rect x="31" y="150" width="98" height="122" fill={u("liqH")} />
        <rect x="31" y="150" width="98" height="122" fill={u("liqDark")} />
        <ellipse cx="80" cy="150" rx="49" ry="2.6" fill="#fff" opacity="0.55" />
        <path d="M31 152.5 H129" stroke="#000" strokeOpacity="0.12" strokeWidth="1" />
        {/* dip tube */}
        <path d="M80 112 C80 160 81 220 84 268" stroke="#fff" strokeOpacity="0.65" strokeWidth="1.8" fill="none" />
        <path d="M81.6 112 C81.6 160 82.6 220 85.6 268" stroke="#000" strokeOpacity="0.18" strokeWidth="0.8" fill="none" />
      </g>
      <path d="M80 112 C80 125 80 132 80 150" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.6" fill="none" />
      {/* inner wall edges */}
      <path d={CAV} fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.9" filter={u("b1")} />
      <path d={CAV} fill="none" stroke="#3b434c" strokeOpacity="0.18" strokeWidth="0.6" />
      {/* glass surface shading and reflections */}
      <path d={BODY} fill={u("glass")} />
      <g clipPath={u("body")}>
        <rect x="23" y="124" width="7" height="168" rx="3.5" fill="#fff" opacity="0.8" filter={u("b2")} />
        <rect x="38" y="138" width="3" height="120" rx="1.5" fill="#fff" opacity="0.35" filter={u("b1")} />
        <rect x="132" y="128" width="3.4" height="160" rx="1.7" fill="#fff" opacity="0.55" filter={u("b1")} />
        <path d="M26 123 Q80 116 134 123" stroke="#fff" strokeOpacity="0.85" strokeWidth="2" fill="none" filter={u("b1")} />
      </g>
      <path d={BODY} fill="none" stroke="#56606b" strokeOpacity="0.55" strokeWidth="0.9" />

      {/* engraved gold lettering */}
      <text x="80" y="214" textAnchor="middle" fontSize="12.5" fontFamily="Georgia, 'Times New Roman', serif" letterSpacing="4.2" fill={u("engrave")}>ABEERX</text>
      <text x="80" y="227" textAnchor="middle" fontSize="5" fontFamily="Georgia, 'Times New Roman', serif" letterSpacing="2.6" fill="#5a4a2a" opacity="0.75">EAU DE PARFUM</text>

      {/* glass neck */}
      <rect x="64" y="104" width="32" height="16" fill="#e6ecf1" fillOpacity="0.6" stroke="#56606b" strokeOpacity="0.4" strokeWidth="0.6" />
      {/* gold ferrule collar with crimp ridges */}
      <rect x="57" y="88" width="46" height="24" rx="2" fill={u("gold")} />
      {[92, 96, 100, 104].map(y => <rect key={y} x="57" y={y} width="46" height="0.8" fill="#3d2c08" opacity="0.28" />)}
      <rect x="53" y="110" width="54" height="9" rx="3" fill={u("gold")} />
      <rect x="53" y="110" width="54" height="2" rx="1" fill="#fff" opacity="0.35" />

      {/* atomiser — moves down when pressed */}
      <g style={{ transform: pressed ? "translateY(5px)" : "translateY(0)", transition: "transform .08s ease-out" }}>
        <rect x="75" y="84" width="10" height="8" fill={u("silver")} />
        <rect x="64" y="58" width="32" height="28" rx="3" fill={u("gold")} />
        <ellipse cx="80" cy="58" rx="16" ry="3.2" fill={u("goldTop")} />
        <rect x="64" y="82" width="32" height="4" rx="1.5" fill="#3d2c08" opacity="0.25" />
        <ellipse cx="96" cy="72" rx="1.1" ry="2.1" fill="#1a1205" />
      </g>
    </svg>
  );
}

/* ---------------------------------- mist sprites (soft, wispy, cool grey) ---------------------------------- */

function makeMistSprites(rgb: [number, number, number], count = 7): HTMLCanvasElement[] {
  const S = 160;
  // value noise
  const P = 64;
  const out: HTMLCanvasElement[] = [];
  for (let k = 0; k < count; k++) {
    let seed = 7 + k * 7919;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const grid = Array.from({ length: P * P }, () => rnd());
    const vn = (x: number, y: number) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const g = (a: number, b: number) => grid[((b % P + P) % P) * P + ((a % P + P) % P)];
      const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
      return (g(xi, yi) * (1 - sx) + g(xi + 1, yi) * sx) * (1 - sy) + (g(xi, yi + 1) * (1 - sx) + g(xi + 1, yi + 1) * sx) * sy;
    };
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(S, S);
    const ox = rnd() * 50, oy = rnd() * 50;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const nx = x / S, ny = y / S;
        let f = 0, amp = 0.55, fr = 3;
        for (let o = 0; o < 4; o++) { f += amp * vn(nx * fr + ox, ny * fr + oy); amp *= 0.5; fr *= 2.1; }
        const dx = nx - 0.5, dy = ny - 0.5;
        const d = Math.sqrt(dx * dx + dy * dy) * 2;
        const fall = Math.max(0, 1 - d);
        const a = Math.max(0, f - 0.38) * 1.9 * fall * fall;
        const i = (y * S + x) * 4;
        img.data[i] = rgb[0]; img.data[i + 1] = rgb[1]; img.data[i + 2] = rgb[2];
        img.data[i + 3] = Math.min(255, a * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
    out.push(c);
  }
  return out;
}

/* ---------------------------------- the animation engine ---------------------------------- */

type Tier = { key: "top" | "heart" | "base"; en: string; ar: string; notes: string[] };
type Puff = {
  x: number; y: number; vx: number; vy: number; age: number; life: number;
  s0: number; s1: number; rot: number; vr: number; spr: number; peak: number; seed: number; front: boolean;
};
type Drop = { x: number; y: number; vx: number; vy: number; age: number; life: number; r: number };
type FlyingNote = {
  img: CanvasImageSource | null; label: string; age: number; T: number;
  x0: number; y0: number; laneY: number; size: number; spin: number; phase: number; dist: number;
};
type TimelineEvent = { t: number; kind: "spritz" | "note"; tier: number; label?: string };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const smooth = (a: number, b: number, t: number) => { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

// Each note illustration is rasterised once into a canvas (crisp and cheap to draw every frame).
const artCache = new Map<string, HTMLCanvasElement | "loading">();
function noteArt(key: string): HTMLCanvasElement | null {
  const c = artCache.get(key);
  if (c && c !== "loading") return c;
  if (!c) {
    artCache.set(key, "loading");
    const im = new Image();
    im.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 256;
      cv.getContext("2d")!.drawImage(im, 0, 0, 256, 256);
      artCache.set(key, cv);
    };
    im.onerror = () => artCache.delete(key);
    im.src = artDataUrl(key);
  }
  return null;
}

type Engine = { start: (tiers: Tier[], getNozzle: () => { x: number; y: number } | null) => void; stop: () => void };

function createEngine(canvas: HTMLCanvasElement, cb: { onTier: (i: number) => void; onSpritz: (i: number) => void; onDone: () => void }): Engine {
  const ctx = canvas.getContext("2d")!;
  const sprites = makeMistSprites([160, 173, 190]);
  let W = 0, H = 0, dpr = 1, s = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    s = clamp(Math.min(W, H * 1.1) / 430, 0.8, 1.45);
  };
  resize();
  window.addEventListener("resize", resize);

  const puffs: Puff[] = [];
  const drops: Drop[] = [];
  const notes: FlyingNote[] = [];
  let timeline: TimelineEvent[] = [];
  let tIdx = 0, tClock = -1, tEnd = 0, doneFired = true, emitAcc = 0, emitting = 0, lastTier = -1, laneCursor = 0;
  let nozzleFn: () => { x: number; y: number } | null = () => null;
  let raf = 0, last = 0, running = false;

  const nozzle = () => nozzleFn() ?? { x: W * 0.15, y: H * 0.35 };

  const spawnPuff = (n: { x: number; y: number }, v0: number, burst: boolean, delay = 0) => {
    const ang = (Math.random() - 0.5) * (burst ? 0.42 : 0.3) - 0.05;
    const sp = v0 * (burst ? 0.45 + Math.random() * 0.75 : 0.25 + Math.random() * 0.32);
    puffs.push({
      x: n.x + Math.random() * 4, y: n.y + (Math.random() - 0.5) * 3,
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - Math.random() * 12 * s,
      age: -delay, life: (burst ? 3.2 : 3.6) + Math.random() * 2.4,
      s0: (10 + Math.random() * 12) * s, s1: (burst ? 150 + Math.random() * 170 : 120 + Math.random() * 140) * s,
      rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4,
      spr: (Math.random() * sprites.length) | 0,
      peak: burst ? 0.34 + Math.random() * 0.36 : 0.22 + Math.random() * 0.2,
      seed: Math.random() * 100, front: Math.random() < 0.3,
    });
  };

  const spritz = (tier: number) => {
    const n = nozzle();
    const v0 = clamp(W - n.x, 260, 1500) * 0.9;
    emitting = 2.2;
    for (let i = 0; i < 56; i++) spawnPuff(n, v0, true, Math.random() * 0.5);
    for (let i = 0; i < 110; i++) {
      const a = (Math.random() - 0.5) * 0.45 - 0.04;
      const sp = v0 * (0.8 + Math.random() * 1.2);
      drops.push({ x: n.x, y: n.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: -Math.random() * 0.35, life: 0.45 + Math.random() * 1.0, r: (0.5 + Math.random() * 1.3) * s });
    }
    cb.onSpritz(tier);
  };

  const spawnNote = (ev: TimelineEvent) => {
    const n = nozzle();
    const key = artKeyFor(ev.label || "");
    noteArt(key);
    const size = clamp(W / 5.6, 60, 104);
    const bandTop = Math.max(64, n.y - H * 0.26);
    const bandBot = Math.min(H - 70, n.y + H * 0.3);
    const order = [1, 3, 0, 4, 2];
    const lane = order[laneCursor++ % 5];
    const laneY = lerp(bandTop, Math.max(bandTop + 40, bandBot), lane / 4) + (Math.random() - 0.5) * 12 * s;
    notes.push({
      img: null, label: ev.label || "", age: 0, T: 7.6 + Math.random() * 0.8,
      x0: n.x, y0: n.y, laneY, size, spin: (Math.random() - 0.5) * 30, phase: Math.random() * 6.28,
      dist: W - n.x + size * 1.4,
    });
    (notes[notes.length - 1] as FlyingNote & { key?: string }).key = key;
  };

  const drawPuff = (p: Puff) => {
    const u = p.age / p.life;
    const size = lerp(p.s0, p.s1, easeOutCubic(clamp(u, 0, 1)));
    const a = p.peak * smooth(0, 0.08, u) * Math.pow(1 - clamp(u, 0, 1), 1.5);
    if (a <= 0.003) return;
    ctx.globalAlpha = a;
    const c = Math.cos(p.rot), sn = Math.sin(p.rot);
    ctx.setTransform(c * dpr, sn * dpr, -sn * dpr, c * dpr, p.x * dpr, p.y * dpr);
    ctx.drawImage(sprites[p.spr], -size / 2, -size / 2, size, size);
  };

  const frame = (now: number) => {
    const real = clamp((now - last) / 1000, 0, 0.25);
    const dt = Math.min(0.05, real);
    last = now;

    if (tClock >= 0) {
      tClock += real;
      while (tIdx < timeline.length && timeline[tIdx].t <= tClock) {
        const ev = timeline[tIdx++];
        if (ev.tier !== lastTier) { lastTier = ev.tier; cb.onTier(ev.tier); }
        if (ev.kind === "spritz") spritz(ev.tier); else spawnNote(ev);
      }
      if (!doneFired && tClock > tEnd) { doneFired = true; cb.onDone(); }
    }
    if (emitting > 0) {
      emitting -= dt;
      emitAcc += dt * 34;
      const n = nozzle();
      const v0 = clamp(W - n.x, 260, 1500) * 0.9;
      while (emitAcc >= 1) { emitAcc -= 1; spawnPuff(n, v0, false); }
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);

    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.age += dt;
      if (p.age < 0) continue;
      if (p.age > p.life) { puffs.splice(i, 1); continue; }
      const drag = Math.exp(-0.85 * dt);
      p.vx = p.vx * drag + 14 * s * dt;
      p.vy = p.vy * drag + Math.sin(p.seed + p.age * 1.6 + p.x * 0.006) * 46 * s * dt - 6 * s * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
    for (const p of puffs) if (!p.front && p.age >= 0) drawPuff(p);

    for (let i = notes.length - 1; i >= 0; i--) {
      const nt = notes[i] as FlyingNote & { key?: string };
      nt.age += dt;
      const p = nt.age / nt.T;
      if (p >= 1) { notes.splice(i, 1); continue; }
      const img = nt.key ? noteArt(nt.key) : null;
      const x = nt.x0 + nt.dist * (0.5 * easeOutCubic(p) + 0.5 * p);
      const y = lerp(nt.y0, nt.laneY, easeOutCubic(clamp(p * 2.4, 0, 1))) + Math.sin(p * 8 + nt.phase) * 9 * s * smooth(0.05, 0.4, p);
      const sz = nt.size * lerp(0.15, 1, easeOutCubic(clamp(p * 4.5, 0, 1))) * (1 + Math.sin(nt.age * 2 + nt.phase) * 0.03);
      const alpha = smooth(0, 0.08, p) * (1 - smooth(0.85, 1, p));
      const rotn = (nt.spin * nt.age + Math.sin(nt.age * 1.2 + nt.phase) * 8) * (Math.PI / 180);
      // gentle 3D tumble: squash horizontally as it turns
      const tumble = 0.82 + 0.18 * Math.cos(nt.age * 1.4 + nt.phase);
      const c = Math.cos(rotn), sn = Math.sin(rotn);
      ctx.globalAlpha = alpha;
      ctx.setTransform(c * dpr * tumble, sn * dpr * tumble, -sn * dpr, c * dpr, x * dpr, y * dpr);
      if (img) ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const la = alpha * smooth(0.12, 0.28, p);
      if (la > 0.01) {
        const fs = clamp(W / 36, 10, 13.5);
        ctx.font = `600 ${fs}px Georgia, 'Times New Roman', serif`;
        (ctx as any).letterSpacing = "2px";
        ctx.textAlign = "center";
        ctx.globalAlpha = la;
        ctx.shadowColor = "rgba(255,255,255,1)";
        ctx.shadowBlur = 5;
        ctx.fillStyle = "#2a2a2a";
        const ty = y + sz * 0.5 + fs + 2;
        ctx.fillText(nt.label.toUpperCase(), x, ty);
        ctx.fillText(nt.label.toUpperCase(), x, ty);
        ctx.shadowBlur = 0;
        (ctx as any).letterSpacing = "0px";
      }
    }

    for (const p of puffs) if (p.front && p.age >= 0) drawPuff(p);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.age += dt;
      if (d.age < 0) continue;
      if (d.age > d.life) { drops.splice(i, 1); continue; }
      d.vx *= Math.exp(-1.6 * dt);
      d.vy = d.vy * Math.exp(-1.6 * dt) + 16 * s * dt;
      d.x += d.vx * dt; d.y += d.vy * dt;
      const u = d.age / d.life;
      ctx.globalAlpha = (1 - u) * 0.55;
      ctx.fillStyle = "#7d8a9a";
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r * (1 - u * 0.5), 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;

    const idle = tClock < 0 || doneFired;
    if (idle && !puffs.length && !drops.length && !notes.length) { running = false; ctx.clearRect(0, 0, W, H); return; }
    raf = requestAnimationFrame(frame);
  };

  return {
    start(tiers, getNozzle) {
      nozzleFn = getNozzle;
      const evs: TimelineEvent[] = [];
      let cursor = 0.15;
      tiers.forEach((tier, ti) => {
        if (!tier.notes.length) return;
        evs.push({ t: cursor, kind: "spritz", tier: ti });
        tier.notes.forEach((nt, i) => evs.push({ t: cursor + 0.4 + i * 0.5, kind: "note", tier: ti, label: nt }));
        tier.notes.forEach(nt => noteArt(artKeyFor(nt)));
        cursor += 0.4 + tier.notes.length * 0.5 + 1.1;
      });
      timeline = evs.sort((a, b) => a.t - b.t);
      tIdx = 0; tClock = 0; tEnd = cursor + 6.5; doneFired = false; lastTier = -1; laneCursor = 0;
      notes.length = 0;
      if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    },
    stop() {
      cancelAnimationFrame(raf);
      running = false;
      window.removeEventListener("resize", resize);
    },
  };
}

/* ------------------------------------- the component ------------------------------------- */

export default function SprayExperience({ product, isArabic }: { product: ProductLike; isArabic: boolean }) {
  const top = useMemo(() => splitNotes(product.topNotes), [product.topNotes]);
  const heart = useMemo(() => splitNotes(product.heartNotes), [product.heartNotes]);
  const base = useMemo(() => splitNotes(product.baseNotes), [product.baseNotes]);
  const accords = useMemo(() => splitNotes(product.mainAccord, 5), [product.mainAccord]);
  const tiers: Tier[] = useMemo(() => {
    const t: Tier[] = [];
    if (top.length) t.push({ key: "top", en: "Top notes", ar: "النوتات العليا", notes: top });
    if (heart.length) t.push({ key: "heart", en: "Heart notes", ar: "نوتات القلب", notes: heart });
    if (base.length) t.push({ key: "base", en: "Base notes", ar: "النوتات الأساسية", notes: base });
    if (!t.length && accords.length) t.push({ key: "heart", en: "Main accords", ar: "الأكوردات الرئيسية", notes: accords });
    return t;
  }, [top, heart, base, accords]);
  const liquid = useMemo(() => liquidFor(`${product.fragranceFamily || ""} ${product.mainAccord || ""}`), [product.fragranceFamily, product.mainAccord]);

  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [phase, setPhase] = useState<"idle" | "spraying" | "leaving">("idle");
  const [played, setPlayed] = useState(false);
  const [tierIdx, setTierIdx] = useState(-1);
  const [pressed, setPressed] = useState(false);
  const [staticNotes, setStaticNotes] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const nozzleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setAnchor(document.querySelector<HTMLElement>("[data-spray-anchor]"));
  }, []);

  useEffect(() => () => engineRef.current?.stop(), []);

  const start = useCallback(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setStaticNotes(true); return; }
    const a = document.querySelector<HTMLElement>("[data-spray-anchor]");
    setAnchor(a);
    const go = () => {
      if (!canvasRef.current) return;
      if (!engineRef.current) {
        engineRef.current = createEngine(canvasRef.current, {
          onTier: i => setTierIdx(i),
          onSpritz: i => {
            setPressed(true);
            setTimeout(() => setPressed(false), 160);
            playSpraySound(i === 0 ? 0.1 : 0.07);
            try { navigator.vibrate?.(i === 0 ? [22] : [12]); } catch { /* optional */ }
          },
          onDone: () => {
            setPhase("leaving");
            setTimeout(() => { setPhase("idle"); setTierIdx(-1); }, 700);
          },
        });
      }
      engineRef.current.start(tiers, () => {
        const el = nozzleRef.current;
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    };
    setTierIdx(-1);
    setPhase("spraying");
    setPlayed(true);
    // make sure the photo (where the bottle appears) is on screen
    if (a) {
      const r = a.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) {
        a.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(go, 650);
        return;
      }
    }
    setTimeout(go, 550); // let the bottle settle in first
  }, [tiers]);

  const hasNotes = tiers.length > 0;
  if (!hasNotes) return null;

  const L = (en: string, ar: string) => (isArabic ? ar : en);
  const cur = tierIdx >= 0 ? tiers[tierIdx] : null;
  const busy = phase !== "idle";

  // The bottle stands on the product photo (or bottom-left of the screen if the photo box isn't found)
  const bottleBox: CSSProperties = anchor
    ? { position: "absolute", left: "4%", bottom: "3%", height: "min(86%, 360px)", aspectRatio: `${VB_W} / ${VB_H}`, zIndex: 5 }
    : { position: "fixed", left: 12, bottom: 24, height: "min(40vh, 320px)", aspectRatio: `${VB_W} / ${VB_H}`, zIndex: 61 };
  const show = phase === "spraying";

  const bottle = (
    <div aria-hidden="true" style={{ ...bottleBox, pointerEvents: "none", opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(14px)", transition: "opacity .5s ease, transform .5s ease" }}>
      <Bottle liquid={liquid} pressed={pressed} className="w-full h-full" style={{ width: "100%", height: "100%", display: "block", filter: "drop-shadow(0 10px 14px rgba(0,0,0,.12))" }} />
      <div ref={nozzleRef} style={{ position: "absolute", left: `${NOZ_X * 100}%`, top: `${NOZ_Y * 100}%`, width: 2, height: 2 }} />
    </div>
  );

  const caption = anchor && cur && show && (
    <div key={tierIdx} className="spr-in" style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 6, pointerEvents: "none", background: "rgba(255,255,255,.88)", border: `1px solid ${GOLD}`, padding: "5px 14px", fontSize: 10.5, letterSpacing: "0.32em", textTransform: "uppercase", color: "#5a4718", whiteSpace: "nowrap", fontFamily: "Georgia, serif" }}>
      {isArabic ? cur.ar : cur.en}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spr-in{from{opacity:0;transform:translate(-50%,-6px)}to{opacity:1;transform:translate(-50%,0)}}
        .spr-in{animation:spr-in .5s ease-out both}
        @keyframes spr-t-mist{0%{transform:translateX(0) scale(.5);opacity:0}25%{opacity:.6}100%{transform:translateX(90px) scale(1.8);opacity:0}}
        .spr-t-mist{animation:spr-t-mist 2.8s ease-out infinite}
        @keyframes spr-t-arrow{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}
        .spr-t-arrow{animation:spr-t-arrow 1s ease-in-out infinite}
        @media (prefers-reduced-motion: reduce){.spr-in,.spr-t-mist,.spr-t-arrow{animation:none!important}}
      `}</style>

      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="w-full mb-6 md:mb-8"
        dir={isArabic ? "rtl" : "ltr"}
        style={{
          position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 14, padding: "8px 14px",
          background: "linear-gradient(100deg, #ffffff 0%, #fbf7ec 100%)", border: `1px solid ${GOLD}`, color: "#1a1a1a",
          textAlign: isArabic ? "right" : "left", cursor: busy ? "default" : "pointer",
        }}
      >
        {[0, 0.9, 1.8].map((d, i) => (
          <span key={i} className="spr-t-mist" style={{ position: "absolute", [isArabic ? "right" : "left"]: 46, top: 14, width: 40, height: 26, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(126,140,158,.35), rgba(126,140,158,0))", animationDelay: `${d}s`, pointerEvents: "none" }} />
        ))}
        <span style={{ position: "relative", width: 30, height: 60, flexShrink: 0, display: "block" }}>
          <Bottle liquid={liquid} pressed={false} style={{ width: "100%", height: "100%", display: "block" }} />
        </span>
        <span style={{ display: "flex", flexDirection: "column", gap: 3, position: "relative" }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: "#8a6a1e", fontFamily: "Georgia, serif", display: "flex", alignItems: "center", gap: 8 }}>
            {busy ? (cur ? (isArabic ? cur.ar : cur.en) : L("Spraying…", "جارٍ الرش…")) : played ? L("Spray again", "رش مرة أخرى") : L("Spray & Smell", "رشّ وتخيّل العطر")}
            {!busy && (
              <svg className="spr-t-arrow" width="10" height="13" viewBox="0 0 30 40" aria-hidden="true"><path d="M11 1 H19 V20 H27 L15 38 L3 20 H11Z" fill="#b8933a" /></svg>
            )}
          </span>
          <span style={{ fontSize: 11.5, color: "#666", lineHeight: 1.4 }}>
            {L("Can't smell it online? Tap to spray and watch its notes drift out.", "لا يمكنك شمّه؟ اضغط للرش وشاهد نوتاته تتطاير أمامك")}
          </span>
        </span>
      </button>

      {staticNotes && (
        <div className="mb-6" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {tiers.flatMap(t => t.notes).map((n, i) => (
            <figure key={i} style={{ margin: 0, width: 72, textAlign: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={artDataUrl(artKeyFor(n))} alt="" width={60} height={60} />
              <figcaption style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>{n}</figcaption>
            </figure>
          ))}
        </div>
      )}

      {mounted && createPortal(
        <canvas ref={canvasRef} aria-hidden="true" style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 60 }} />,
        document.body
      )}
      {mounted && (busy || played) && createPortal(<>{bottle}{caption}</>, anchor ?? document.body)}
    </>
  );
}
