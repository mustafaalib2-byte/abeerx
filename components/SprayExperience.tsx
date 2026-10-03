"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { artDataUrl, artKeyFor } from "./sprayArt";

/* ------------------------------------------------------------------------------------------
   "Spray & Smell" — a small floating button on the product page.
   Tapping it softly blurs the page, a clear glass bottle appears and sprays three times
   (Top, Heart, Base). The mist carries the perfume's own notes out of the nozzle and they
   settle in three rows at the bottom of the screen: Base notes at the very bottom, Heart notes
   above them, Top notes on top — like the structure of the perfume itself.
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
const CLEAR_LIQUID = "#efe7d2"; // almost colourless perfume

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

/* ---------------------------------- the bottle (clear glass) ---------------------------------- */

// viewBox 160 x 320. The nozzle opening sits at (NOZ_X, NOZ_Y) of that box.
const VB_W = 160, VB_H = 320;
const NOZ_X = 97 / VB_W;
const NOZ_X_LEFT = 63 / VB_W; // nozzle position when the sprayer faces left
const NOZ_Y = 72 / VB_H;

// Splits a product name into at most 2 lines that fit the bottle front.
function labelLines(name: string): string[] {
  const words = name.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const full = words.join(" ");
  if (full.length <= 13) return [full];
  let best = [full, ""], bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
    const d = Math.max(a.length, b.length);
    if (d < bestDiff) { bestDiff = d; best = [a, b]; }
  }
  return best.filter(Boolean);
}

function Bottle({ pressed, style, brand, name, knobLoop, facing = "right" }: { pressed: boolean; style?: CSSProperties; brand?: string; name?: string; knobLoop?: boolean; facing?: "left" | "right" }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (n: string) => `sb${n}${uid}`;
  const u = (n: string) => `url(#${id(n)})`;
  const liquid = CLEAR_LIQUID;
  const BODY = "M30 118 H130 Q142 118 142 131 V281 Q142 300 123 300 H37 Q18 300 18 281 V131 Q18 118 30 118Z";
  const CAV = "M36 132 H124 Q129 132 129 138 V264 Q129 271 122 271 H38 Q31 271 31 264 V138 Q31 132 36 132Z";
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ overflow: "visible", display: "block", width: "100%", height: "100%", ...style }} aria-hidden="true">
      <defs>
        <filter id={id("b1")} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1" /></filter>
        <filter id={id("b2")} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" /></filter>
        <filter id={id("b5")} x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="5" /></filter>
        <linearGradient id={id("glass")} x1="0" x2="1">
          <stop offset="0" stopColor="#5d6670" stopOpacity="0.55" />
          <stop offset="0.04" stopColor="#c9d1d9" stopOpacity="0.35" />
          <stop offset="0.12" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="0.85" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="0.93" stopColor="#8b95a0" stopOpacity="0.32" />
          <stop offset="0.975" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="1" stopColor="#4c545d" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={id("liqH")} x1="0" x2="1">
          <stop offset="0" stopColor="#56606b" stopOpacity="0.28" />
          <stop offset="0.2" stopColor="#000" stopOpacity="0.02" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.7" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#56606b" stopOpacity="0.32" />
        </linearGradient>
        <linearGradient id={id("liqV")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={liquid} stopOpacity="0.25" />
          <stop offset="0.6" stopColor={liquid} stopOpacity="0.38" />
          <stop offset="1" stopColor={liquid} stopOpacity="0.55" />
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
          <stop offset="0.5" stopColor="#d9b85a" />
          <stop offset="1" stopColor="#8a6a22" />
        </linearGradient>
        <clipPath id={id("cav")}><path d={CAV} /></clipPath>
        <clipPath id={id("body")}><path d={BODY} /></clipPath>
      </defs>

      {/* soft shadow */}
      <ellipse cx="80" cy="303" rx="64" ry="6" fill="#000" opacity="0.22" filter={u("b5")} />

      {/* glass body */}
      <path d={BODY} fill="#eef2f5" fillOpacity="0.28" />
      <g clipPath={u("body")}>
        <rect x="24" y="274" width="112" height="20" fill="#dfe6ec" opacity="0.6" filter={u("b2")} />
        <path d="M30 296 H130" stroke="#fff" strokeOpacity="0.9" strokeWidth="1.6" filter={u("b1")} />
      </g>
      {/* clear liquid */}
      <g clipPath={u("cav")}>
        <rect x="31" y="150" width="98" height="122" fill={u("liqV")} />
        <rect x="31" y="150" width="98" height="122" fill={u("liqH")} />
        <ellipse cx="80" cy="150" rx="49" ry="2.6" fill="#fff" opacity="0.75" />
        <path d="M31 152.5 H129" stroke="#56606b" strokeOpacity="0.28" strokeWidth="0.9" />
        {/* dip tube */}
        <path d="M80 112 C80 160 81 220 84 268" stroke="#fff" strokeOpacity="0.75" strokeWidth="1.8" fill="none" />
        <path d="M81.6 112 C81.6 160 82.6 220 85.6 268" stroke="#56606b" strokeOpacity="0.3" strokeWidth="0.8" fill="none" />
      </g>
      <path d="M80 112 C80 125 80 132 80 150" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.6" fill="none" />
      <path d="M81.6 112 V150" stroke="#56606b" strokeOpacity="0.25" strokeWidth="0.7" fill="none" />
      {/* inner wall edges (glass thickness) */}
      <path d={CAV} fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="0.9" filter={u("b1")} />
      <path d={CAV} fill="none" stroke="#3b434c" strokeOpacity="0.28" strokeWidth="0.6" />
      {/* reflections */}
      <path d={BODY} fill={u("glass")} />
      <g clipPath={u("body")}>
        <rect x="23" y="124" width="7" height="168" rx="3.5" fill="#fff" opacity="0.85" filter={u("b2")} />
        <rect x="38" y="138" width="3" height="120" rx="1.5" fill="#fff" opacity="0.4" filter={u("b1")} />
        <rect x="132" y="128" width="3.4" height="160" rx="1.7" fill="#fff" opacity="0.6" filter={u("b1")} />
        <path d="M26 123 Q80 116 134 123" stroke="#fff" strokeOpacity="0.9" strokeWidth="2" fill="none" filter={u("b1")} />
      </g>
      <path d={BODY} fill="none" stroke="#56606b" strokeOpacity="0.6" strokeWidth="0.9" />

      {/* engraved lettering */}
      {(() => {
        // Perfume name and brand engraved on the glass (falls back to ABEERX)
        const lines = name ? labelLines(name) : [];
        if (!lines.length) {
          return <text x="80" y="214" textAnchor="middle" fontSize="12.5" fontFamily="Georgia, 'Times New Roman', serif" letterSpacing="4.2" fill={u("engrave")}>ABEERX</text>;
        }
        const longest = Math.max(...lines.map(l => l.length));
        const fs = Math.min(12, 92 / (longest * 0.68));
        const lh = fs * 1.18;
        const top = 206 - ((lines.length - 1) * lh) / 2;
        const b = (brand || "").trim().toUpperCase();
        const bfs = b ? Math.min(5.6, 88 / (b.length * 0.78)) : 0;
        return (
          <g fontFamily="Georgia, 'Times New Roman', serif" textAnchor="middle">
            {b && <text x="80" y={top - fs - 3} fontSize={bfs} letterSpacing="1.6" fill="#5a5a5a" opacity="0.85">{b}</text>}
            {lines.map((l, i) => (
              <text key={i} x="80" y={top + i * lh} fontSize={fs} letterSpacing={fs > 9 ? 2 : 0.8} fill={u("engrave")}>{l}</text>
            ))}
            <line x1="62" x2="98" y1={top + (lines.length - 1) * lh + 6} y2={top + (lines.length - 1) * lh + 6} stroke="#b8933a" strokeOpacity="0.6" strokeWidth="0.5" />
          </g>
        );
      })()}

      {/* glass neck + gold collar */}
      <rect x="64" y="104" width="32" height="16" fill="#e6ecf1" fillOpacity="0.6" stroke="#56606b" strokeOpacity="0.4" strokeWidth="0.6" />
      <rect x="57" y="88" width="46" height="24" rx="2" fill={u("gold")} />
      {[92, 96, 100, 104].map(y => <rect key={y} x="57" y={y} width="46" height="0.8" fill="#3d2c08" opacity="0.28" />)}
      <rect x="53" y="110" width="54" height="9" rx="3" fill={u("gold")} />
      <rect x="53" y="110" width="54" height="2" rx="1" fill="#fff" opacity="0.35" />

      {/* atomiser — moves down when pressed */}
      <g className={knobLoop && !pressed ? "spr-knob" : undefined} style={knobLoop && !pressed ? undefined : { transform: pressed ? "translateY(6px)" : "translateY(0)", transition: "transform .08s ease-out" }}>
        <rect x="75" y="84" width="10" height="8" fill={u("silver")} />
        <rect x="64" y="58" width="32" height="28" rx="3" fill={u("gold")} />
        <ellipse cx="80" cy="58" rx="16" ry="3.2" fill={u("goldTop")} />
        <rect x="64" y="82" width="32" height="4" rx="1.5" fill="#3d2c08" opacity="0.25" />
        <ellipse cx={facing === "left" ? 64 : 96} cy="72" rx="1.1" ry="2.1" fill="#1a1205" />
      </g>
    </svg>
  );
}

/* ---------------------------------- mist sprites (soft, wispy, cool grey) ---------------------------------- */

function makeMistSprites(rgb: [number, number, number], count = 7): HTMLCanvasElement[] {
  const S = 160, P = 64;
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
        const fall = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 2);
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
  key: string; label: string; tier: number; age: number;
  x0: number; y0: number; laneY: number; dist: number;
  slotX: number; slotY: number; slotW: number;
  spin: number; phase: number;
};
type TimelineEvent = { t: number; kind: "spritz" | "note"; tier: number; idx: number; label?: string };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
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

const FLY = 1.5;      // seconds a note drifts in the mist before heading to its place
const SETTLE = 1.5;   // seconds to glide into its place

// Size of the note rows at the bottom of the screen (shared by the animation and the bottle placement)
function rowsLayout(W: number, H: number) {
  const margin = 34 + Math.min(26, H * 0.03); // clear of phone gesture bars
  const size = clamp(Math.min(W / 6.2, H / 9.5), 46, 84);
  const nameFs = clamp(size / 6.2, 9.5, 13);
  const capH = 16;
  const rowH = capH + size + nameFs * 2.2 + 16; // room for two-line names
  return { size, rowH, capH, nameFs, margin };
}

type Engine = {
  start: (tiers: Tier[], tierLabels: string[], getNozzle: () => { x: number; y: number } | null, dir?: 1 | -1) => void;
  dismiss: () => void;
  stop: () => void;
};

function createEngine(canvas: HTMLCanvasElement, cb: { onTier: (i: number) => void; onSpritz: (i: number) => void; onDone: () => void; onGone: () => void }): Engine {
  const ctx = canvas.getContext("2d")!;
  const sprites = makeMistSprites([160, 173, 190]);
  let W = 0, H = 0, dpr = 1, s = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    const r = canvas.getBoundingClientRect();
    W = r.width || window.innerWidth; H = r.height || window.innerHeight;
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
  let tiersRef: Tier[] = [];
  let labels: string[] = [];
  let tIdx = 0, tClock = -1, tEnd = 0, doneFired = true, emitAcc = 0, emitting = 0, lastTier = -1, laneCursor = 0;
  let fade = 1, dismissing = false;
  let dir: 1 | -1 = 1; // 1 = spray to the right, -1 = to the left
  let nozzleFn: () => { x: number; y: number } | null = () => null;
  let raf = 0, last = 0, running = false;
  let layout = { size: 64, rowH: 100, capH: 16, nameFs: 11, margin: 24 };

  const nozzle = () => nozzleFn() ?? { x: W * 0.2, y: H * 0.3 };

  // Rows at the bottom: base notes lowest, heart above, top notes on top.
  const computeLayout = () => {
    layout = rowsLayout(W, H);
  };
  const slotFor = (tier: number, idx: number) => {
    const n = tiersRef[tier].notes.length;
    const fromBottom = tiersRef.length - 1 - tier;
    const { size, rowH, capH, margin } = layout;
    const rowTop = H - margin - (fromBottom + 1) * rowH;
    const slotW = Math.min((W - 24) / n, size * 1.75);
    return { x: W / 2 + (idx - (n - 1) / 2) * slotW, y: rowTop + capH + size / 2, w: slotW };
  };

  const spawnPuff = (n: { x: number; y: number }, v0: number, burst: boolean, delay = 0) => {
    const ang = (Math.random() - 0.5) * (burst ? 0.42 : 0.3) - 0.05;
    const sp = v0 * (burst ? 0.45 + Math.random() * 0.75 : 0.25 + Math.random() * 0.32);
    puffs.push({
      x: n.x + Math.random() * 4, y: n.y + (Math.random() - 0.5) * 3,
      vx: Math.cos(ang) * sp * dir, vy: Math.sin(ang) * sp - Math.random() * 12 * s,
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
    const v0 = clamp(dir > 0 ? W - n.x : n.x, 260, 1500) * 0.9;
    emitting = 2.0;
    for (let i = 0; i < 56; i++) spawnPuff(n, v0, true, Math.random() * 0.5);
    for (let i = 0; i < 110; i++) {
      const a = (Math.random() - 0.5) * 0.45 - 0.04;
      const sp = v0 * (0.8 + Math.random() * 1.2);
      drops.push({ x: n.x, y: n.y, vx: Math.cos(a) * sp * dir, vy: Math.sin(a) * sp, age: -Math.random() * 0.35, life: 0.45 + Math.random() * 1.0, r: (0.5 + Math.random() * 1.3) * s });
    }
    cb.onSpritz(tier);
  };

  const spawnNote = (ev: TimelineEvent) => {
    const n = nozzle();
    const key = artKeyFor(ev.label || "");
    noteArt(key);
    const slot = slotFor(ev.tier, ev.idx);
    const order = [1, 3, 0, 4, 2];
    const lane = order[laneCursor++ % 5];
    const laneY = n.y + (lane / 4 - 0.35) * H * 0.22;
    notes.push({
      key, label: ev.label || "", tier: ev.tier, age: 0,
      x0: n.x, y0: n.y, laneY, dist: clamp(W * 0.55, 140, Math.max(160, (dir > 0 ? W - n.x : n.x) - layout.size)),
      slotX: slot.x, slotY: slot.y, slotW: slot.w,
      spin: (Math.random() - 0.5) * 60, phase: Math.random() * 6.28,
    });
  };

  const drawPuff = (p: Puff) => {
    const u = p.age / p.life;
    const size = lerp(p.s0, p.s1, easeOutCubic(clamp(u, 0, 1)));
    const a = p.peak * smooth(0, 0.08, u) * Math.pow(1 - clamp(u, 0, 1), 1.5) * fade;
    if (a <= 0.003) return;
    ctx.globalAlpha = a;
    const c = Math.cos(p.rot), sn = Math.sin(p.rot);
    ctx.setTransform(c * dpr, sn * dpr, -sn * dpr, c * dpr, p.x * dpr, p.y * dpr);
    ctx.drawImage(sprites[p.spr], -size / 2, -size / 2, size, size);
  };

  const label = (text: string, x: number, y: number, fs: number, maxW: number, color: string, alpha: number, spacing = 1.6, wrap = false) => {
    if (alpha <= 0.01) return;
    const setFont = (f: number, sp: number) => { ctx.font = `600 ${f}px Georgia, 'Times New Roman', serif`; (ctx as any).letterSpacing = `${sp}px`; };
    let f = fs, sp = spacing;
    let lines = [text];
    setFont(f, sp);
    // too wide: first try two lines (for names with a space), then shrink
    if (wrap && ctx.measureText(text).width > maxW && text.includes(" ")) {
      const w = text.split(" ");
      let best = [text], bestW = Infinity;
      for (let i = 1; i < w.length; i++) {
        const a = w.slice(0, i).join(" "), b = w.slice(i).join(" ");
        const m = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
        if (m < bestW) { bestW = m; best = [a, b]; }
      }
      lines = best;
    }
    const widest = () => Math.max(...lines.map(l => ctx.measureText(l).width));
    while (f > 7 && widest() > maxW) {
      f -= 0.5;
      sp = Math.max(0.3, sp - 0.15);
      setFont(f, sp);
    }
    ctx.textAlign = "center";
    ctx.globalAlpha = alpha;
    ctx.shadowColor = "rgba(255,255,255,1)";
    ctx.shadowBlur = 5;
    ctx.fillStyle = color;
    lines.forEach((l, i) => {
      ctx.fillText(l, x, y + i * f * 1.2);
      ctx.fillText(l, x, y + i * f * 1.2);
    });
    ctx.shadowBlur = 0;
    (ctx as any).letterSpacing = "0px";
  };

  const frame = (now: number) => {
    const real = clamp((now - last) / 1000, 0, 0.25);
    const dt = Math.min(0.05, real);
    last = now;
    const time = now / 1000;

    if (tClock >= 0 && !dismissing) {
      tClock += real;
      while (tIdx < timeline.length && timeline[tIdx].t <= tClock) {
        const ev = timeline[tIdx++];
        if (ev.tier !== lastTier) { lastTier = ev.tier; cb.onTier(ev.tier); }
        if (ev.kind === "spritz") spritz(ev.tier); else spawnNote(ev);
      }
      if (!doneFired && tClock > tEnd) { doneFired = true; cb.onDone(); }
    }
    if (emitting > 0 && !dismissing) {
      emitting -= dt;
      emitAcc += dt * 34;
      const n = nozzle();
      const v0 = clamp(dir > 0 ? W - n.x : n.x, 260, 1500) * 0.9;
      while (emitAcc >= 1) { emitAcc -= 1; spawnPuff(n, v0, false); }
    }
    if (dismissing) fade = Math.max(0, fade - real * 2.4);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);

    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.age += dt;
      if (p.age < 0) continue;
      if (p.age > p.life) { puffs.splice(i, 1); continue; }
      const drag = Math.exp(-0.85 * dt);
      p.vx = p.vx * drag + 14 * s * dt * dir;
      p.vy = p.vy * drag + Math.sin(p.seed + p.age * 1.6 + p.x * 0.006) * 46 * s * dt - 6 * s * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
    for (const p of puffs) if (!p.front && p.age >= 0) drawPuff(p);

    // row captions (Top / Heart / Base) appear as their first note lands
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tiersRef.forEach((t, ti) => {
      const first = notes.find(n => n.tier === ti);
      if (!first) return;
      const a = smooth(FLY + SETTLE * 0.5, FLY + SETTLE, first.age) * fade;
      const slot = slotFor(ti, 0);
      const y = slot.y - layout.size / 2 - 6;
      label(labels[ti] || t.en, W / 2, y, 9.5, W - 40, GOLD, a, 3.2);
      ctx.globalAlpha = a * 0.6;
      ctx.fillStyle = GOLD;
      const lw = Math.min(W * 0.5, 260);
      ctx.fillRect(W / 2 - lw / 2, y + 4, lw, 0.6);
    });

    for (const nt of notes) {
      nt.age += real;
      const img = noteArt(nt.key);
      const tf = clamp(nt.age / (FLY + 0.8), 0, 1);
      const fx = nt.x0 + nt.dist * easeOutCubic(tf) * dir;
      const fy = lerp(nt.y0, nt.laneY, easeOutCubic(clamp(nt.age / 1.1, 0, 1))) + Math.sin(nt.age * 3 + nt.phase) * 8 * s;
      const q = easeInOut(clamp((nt.age - FLY) / SETTLE, 0, 1));
      const x = lerp(fx, nt.slotX, q);
      const y = lerp(fy, nt.slotY, q) + Math.sin(time * 1.5 + nt.phase) * 2 * q;
      const grow = lerp(0.15, 1, easeOutCubic(clamp(nt.age / 0.7, 0, 1)));
      const sz = layout.size * grow;
      const alpha = smooth(0, 0.18, nt.age) * fade;
      const rotn = (nt.spin * nt.age + Math.sin(nt.age * 1.2 + nt.phase) * 8) * (Math.PI / 180) * (1 - q);
      const tumble = lerp(0.82 + 0.18 * Math.cos(nt.age * 1.4 + nt.phase), 1, q);
      const c = Math.cos(rotn), sn = Math.sin(rotn);
      ctx.globalAlpha = alpha;
      ctx.setTransform(c * dpr * tumble, sn * dpr * tumble, -sn * dpr, c * dpr, x * dpr, y * dpr);
      if (img) ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const la = alpha * smooth(0.3, 0.8, nt.age);
      const maxW = lerp(160, nt.slotW - 6, q);
      label(nt.label.toUpperCase(), x, y + sz * 0.5 + layout.nameFs + 3, layout.nameFs, maxW, "#2a2a2a", la, 1.6, q > 0.5);
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
      ctx.globalAlpha = (1 - u) * 0.55 * fade;
      ctx.fillStyle = "#7d8a9a";
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r * (1 - u * 0.5), 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (dismissing && fade <= 0) {
      running = false;
      puffs.length = 0; drops.length = 0; notes.length = 0;
      ctx.clearRect(0, 0, W, H);
      cb.onGone();
      return;
    }
    raf = requestAnimationFrame(frame);
  };

  return {
    start(tiers, tierLabels, getNozzle, direction = 1) {
      dir = direction;
      nozzleFn = getNozzle;
      tiersRef = tiers;
      labels = tierLabels;
      resize();
      computeLayout();
      const evs: TimelineEvent[] = [];
      let cursor = 0.15, lastSpawn = 0;
      tiers.forEach((tier, ti) => {
        evs.push({ t: cursor, kind: "spritz", tier: ti, idx: -1 });
        tier.notes.forEach((nt, i) => {
          lastSpawn = cursor + 0.4 + i * 0.4;
          evs.push({ t: lastSpawn, kind: "note", tier: ti, idx: i, label: nt });
          noteArt(artKeyFor(nt));
        });
        cursor += 0.4 + tier.notes.length * 0.4 + 1.0;
      });
      timeline = evs.sort((a, b) => a.t - b.t);
      tIdx = 0; tClock = 0; tEnd = lastSpawn + FLY + SETTLE + 0.3; doneFired = false; lastTier = -1; laneCursor = 0;
      notes.length = 0; fade = 1; dismissing = false;
      if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    },
    dismiss() {
      dismissing = true;
      if (!running) cb.onGone();
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

  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<"idle" | "spraying" | "done" | "closing">("idle");
  const [tierIdx, setTierIdx] = useState(-1);
  const [pressed, setPressed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [hint, setHint] = useState(true);
  const [tapPress, setTapPress] = useState(false);
  // where the bottle stands during the show, and the jump from the page button to there
  const [stage, setStage] = useState<{ left: number; top: number; height: number } | null>(null);
  const [flip, setFlip] = useState<{ dx: number; dy: number; s: number } | null>(null);
  const [atButton, setAtButton] = useState(false); // true = drawn exactly over the page button
  const [animateMove, setAnimateMove] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<{ left: number; top: number; height: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const nozzleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setReduced(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    const t = setTimeout(() => setHint(false), 6000); // the "Spray & Smell" label tucks away after a few seconds
    return () => clearTimeout(t);
  }, []);
  useEffect(() => () => engineRef.current?.stop(), []);

  const open = phase !== "idle";
  // keep the page still while the show is on
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const L = (en: string, ar: string) => (isArabic ? ar : en);
  // The page bottle sits at the edge, so it sprays towards the middle of the screen
  const facing: "left" | "right" = isArabic ? "right" : "left";
  const nozX = facing === "left" ? NOZ_X_LEFT : NOZ_X;

  const start = useCallback(() => {
    setTierIdx(-1);
    setHint(false);
    if (reduced) { setPhase("done"); return; }
    setPhase("spraying");
    setTimeout(() => {
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
          onDone: () => setPhase(p => (p === "spraying" ? "done" : p)),
          onGone: () => setTierIdx(-1),
        });
      }
      engineRef.current.start(tiers, tiers.map(t => (isArabic ? t.ar : t.en).toUpperCase()), () => {
        const el = nozzleRef.current;
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }, facing === "left" ? -1 : 1);
    }, 750); // let the bottle glide into place first
  }, [tiers, reduced, isArabic, facing]);

  // Bottle position for the show: exactly where it stands on the page, lifted up just enough
  // to clear the rows where the notes settle.
  const computeStage = useCallback(() => {
    const W = window.innerWidth, H = window.innerHeight;
    const Lr = rowsLayout(W, H);
    const el = triggerRef.current;
    const r = el ? el.getBoundingClientRect() : { left: W - 90, top: H * 0.4, height: 144 };
    const rowsTop = H - Lr.margin - tiers.length * Lr.rowH - 14;
    const top = clamp(Math.min(r.top - 40, rowsTop - r.height), 56, Math.max(56, r.top));
    return { left: r.left, top, height: r.height };
  }, [tiers.length]);

  // How to draw the stage bottle so it sits exactly on the page button
  const flipFrom = (st: { left: number; top: number; height: number }) => {
    const el = triggerRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { dx: r.left - st.left, dy: r.top - st.top, s: r.height / st.height };
  };

  // The knob goes down under the finger, then the SAME bottle lifts off the page and sprays
  const tap = useCallback(() => {
    setTapPress(true);
    playSpraySound(0.06);
    setTimeout(() => {
      setTapPress(false);
      const st = computeStage();
      const f = flipFrom(st);
      setStage(st);
      stageRef.current = st;
      setFlip(f);
      setAnimateMove(false);
      setAtButton(!!f);
      // next frames: glide from the button up to the stage
      requestAnimationFrame(() => requestAnimationFrame(() => { setAnimateMove(true); setAtButton(false); }));
      start();
    }, 180);
  }, [start, computeStage]);

  const close = useCallback(() => {
    setPhase("closing");
    if (engineRef.current) engineRef.current.dismiss();
    // glide the bottle back down onto the page, then hand over to the page button
    const st = stageRef.current;
    const f = st ? flipFrom(st) : null;
    if (f) { setFlip(f); setAnimateMove(true); setAtButton(true); }
    setTimeout(() => { setPhase("idle"); setAtButton(false); setAnimateMove(false); }, 700);
  }, []);

  if (!tiers.length) return null;

  const cur = tierIdx >= 0 ? tiers[tierIdx] : null;
  const visible = phase === "spraying" || phase === "done";
    const pill: CSSProperties = {
    background: "rgba(255,255,255,.92)", border: `1px solid ${GOLD}`, padding: "8px 16px", fontSize: 11,
    letterSpacing: "0.22em", textTransform: "uppercase", color: "#5a4718", fontFamily: "Georgia, serif", cursor: "pointer",
  };

  return (
    <>
      <style>{`
        @keyframes spr-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
        .spr-in{animation:spr-in .45s ease-out both}
        @keyframes spr-ring{0%{transform:scale(1);opacity:.55}100%{transform:scale(1.55);opacity:0}}
        .spr-ring{animation:spr-ring 2s ease-out infinite}
        @keyframes spr-puff{0%{transform:translate(0,0) scale(.3);opacity:0}20%{opacity:.85}100%{transform:translate(20px,-3px) scale(1.5);opacity:0}}
        .spr-puff{animation:spr-puff 1.6s ease-out infinite}
        @keyframes spr-arrow{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}
        .spr-arrow{animation:spr-arrow .9s ease-in-out infinite}
        @keyframes spr-knob{0%,62%,100%{transform:translateY(0)}68%,76%{transform:translateY(6px)}}
        .spr-knob{animation:spr-knob 2.2s ease-in-out infinite}
        @keyframes spr-tpuff{0%,64%{transform:translate(0,0) scale(.3);opacity:0}70%{opacity:.9}100%{transform:translate(34px,-4px) scale(1.9);opacity:0}}
        .spr-tpuff{animation:spr-tpuff 2.2s ease-out infinite}
        @keyframes spr-tpuffL{0%,64%{transform:translate(0,0) scale(.3);opacity:0}70%{opacity:.9}100%{transform:translate(-34px,-4px) scale(1.9);opacity:0}}
        .spr-tpuffL{animation:spr-tpuffL 2.2s ease-out infinite}
        .spr-trigger:active .spr-bottlebox{transform:scale(.97)}
        @media (prefers-reduced-motion: reduce){.spr-in,.spr-ring,.spr-puff,.spr-arrow,.spr-knob,.spr-tpuff,.spr-tpuffL{animation:none!important}}
      `}</style>

      {/* Bottle trigger: sits on the right, just above the Add to Cart button */}
      <div style={{ position: "relative", height: 0 }} dir="ltr">
        <div style={{ position: "absolute", [isArabic ? "left" : "right"]: 2, bottom: 10, display: "flex", alignItems: "flex-end", gap: 8, flexDirection: isArabic ? "row-reverse" : "row", zIndex: 5 }}>
          {hint && phase === "idle" && (
            <button type="button" onClick={tap} className="spr-in" style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", marginBottom: 56, fontSize: 9.5, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, fontFamily: "Georgia, serif", whiteSpace: "nowrap" }}>
              {L("Tap to spray", "اضغط للرش")}
            </button>
          )}
          <button
            ref={triggerRef}
            type="button"
            className="spr-trigger"
            onPointerDown={() => setTapPress(true)}
            onPointerUp={() => setTapPress(false)}
            onPointerLeave={() => setTapPress(false)}
            onClick={tap}
            aria-label={L("Spray and smell this perfume", "رشّ وتخيّل العطر")}
            style={{ position: "relative", width: 72, height: 144, background: "transparent", border: 0, padding: 0, cursor: "pointer", WebkitTapHighlightColor: "transparent", touchAction: "manipulation", visibility: phase === "idle" ? "visible" : "hidden" }}
          >
            {/* gold arrow pointing down at the sprayer */}
            <svg className="spr-arrow" width="11" height="14" viewBox="0 0 30 40" aria-hidden="true" style={{ position: "absolute", left: 30.5, top: 8, filter: "drop-shadow(0 1px 2px rgba(0,0,0,.2))" }}>
              <path d="M11 1 H19 V20 H27 L15 38 L3 20 H11Z" fill={GOLD} />
            </svg>
            <span className="spr-bottlebox" style={{ position: "absolute", inset: 0, display: "block", transition: "transform .1s", filter: "drop-shadow(0 6px 8px rgba(0,0,0,.18))" }}>
              <Bottle pressed={tapPress} knobLoop={!tapPress} brand={product.brand} name={product.name} facing={facing} />
            </span>
            {/* mist leaving the nozzle each time the knob goes down */}
            {[0, 0.12, 0.24].map((d, i) => (
              <span key={i} className={facing === "left" ? "spr-tpuffL" : "spr-tpuff"} style={{ position: "absolute", left: facing === "left" ? 72 * nozX - 17 : 72 * nozX + 3, top: 144 * NOZ_Y - 6, width: 14, height: 10, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(140,155,175,.8), rgba(140,155,175,0))", animationDelay: `${d}s`, pointerEvents: "none" }} />
            ))}
          </button>
        </div>
      </div>

      {mounted && createPortal(
        <>
          {/* Blurred page behind the show (tap anywhere to close) */}
          <div
            onClick={open ? close : undefined}
            aria-hidden={!open}
            style={{
              position: "fixed", inset: 0, zIndex: 70, background: "rgba(255,255,255,.38)",
              backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)",
              opacity: visible ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity .5s ease",
            }}
          />

          {/* The bottle */}
          <div aria-hidden="true" style={{
            position: "fixed", left: stage?.left ?? 14, top: stage?.top ?? 60, height: stage?.height ?? 260, aspectRatio: `${VB_W} / ${VB_H}`, zIndex: 71,
            pointerEvents: "none", opacity: open ? 1 : 0,
            transformOrigin: "0 0",
            transform: atButton && flip ? `translate(${flip.dx}px, ${flip.dy}px) scale(${flip.s})` : "none",
            transition: animateMove ? "transform .65s cubic-bezier(.22,.8,.25,1)" : "none",
            filter: "drop-shadow(0 10px 14px rgba(0,0,0,.14))",
          }}>
            <Bottle pressed={pressed} brand={product.brand} name={product.name} facing={facing} />
            <div ref={nozzleRef} style={{ position: "absolute", left: `${nozX * 100}%`, top: `${NOZ_Y * 100}%`, width: 2, height: 2 }} />
          </div>

          <canvas ref={canvasRef} aria-hidden="true" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 72 }} />

          {/* Caption + controls */}
          {open && (
            <div style={{ position: "fixed", top: "max(14px, env(safe-area-inset-top))", left: 0, right: 0, zIndex: 73, display: "flex", justifyContent: "center", pointerEvents: "none", opacity: visible ? 1 : 0, transition: "opacity .4s" }} dir={isArabic ? "rtl" : "ltr"}>
              {phase === "spraying" && cur && (
                <div key={tierIdx} className="spr-in" style={{ ...pill, cursor: "default" }}>{isArabic ? cur.ar : cur.en}</div>
              )}
              {phase === "done" && (
                <div className="spr-in" style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
                  <button type="button" style={pill} onClick={start}>{L("Spray again", "رش مرة أخرى")}</button>
                  <button type="button" style={{ ...pill, background: "#111", color: "#fff", borderColor: "#111" }} onClick={close}>{L("Close", "إغلاق")}</button>
                </div>
              )}
            </div>
          )}
          {open && (
            <button type="button" onClick={close} aria-label={L("Close", "إغلاق")} style={{ position: "fixed", top: "max(10px, env(safe-area-inset-top))", [isArabic ? "left" : "right"]: 12, zIndex: 74, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.9)", border: `1px solid ${GOLD}`, cursor: "pointer", display: "grid", placeItems: "center", opacity: visible ? 1 : 0, transition: "opacity .4s" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5a4718" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          )}

          {/* Reduced motion: the same rows, without the animation */}
          {reduced && phase === "done" && (
            <div style={{ position: "fixed", left: 0, right: 0, bottom: 24, zIndex: 72, display: "flex", flexDirection: "column-reverse", gap: 14, alignItems: "center", pointerEvents: "none" }}>
              {[...tiers].reverse().map(t => (
                <div key={t.key} style={{ textAlign: "center" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 10, letterSpacing: "0.3em", color: GOLD, textTransform: "uppercase" }}>{isArabic ? t.ar : t.en}</p>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    {t.notes.map((n, i) => (
                      <figure key={i} style={{ margin: 0, width: 64, textAlign: "center" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={artDataUrl(artKeyFor(n))} alt="" width={52} height={52} />
                        <figcaption style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}>{n}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>,
        document.body
      )}
    </>
  );
}
