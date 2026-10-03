"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* Home page hero: a slideshow of real product photos on a dark spotlight backdrop.
   Heading sits at the top, "Shop Now" at the bottom, so each perfume is seen clearly in the middle. */

export type HeroSlide = { image: string; name: string; brand: string; href: string };

const INTERVAL = 4500;

export default function HeroSlideshow({ slides, locale }: { slides: HeroSlide[]; locale: string }) {
  const isArabic = locale === "ar";
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  // Every visit starts on a different perfume, so returning customers see something new
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (count > 1) setIndex(Math.floor(Math.random() * count));
    setReady(true);
  }, [count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setIndex(i => (i + 1) % count), INTERVAL);
    return () => clearTimeout(t);
  }, [index, count, paused]);

  const go = (d: number) => setIndex(i => (i + d + count) % count);

  return (
    <section
      className="relative w-full h-[calc(100svh-180px)] md:h-[calc(100vh-140px)] min-h-[440px] max-h-[820px] overflow-hidden select-none flex flex-col"
      style={{ background: "radial-gradient(ellipse 70% 55% at 50% 55%, #3a322a 0%, #1c1916 55%, #0b0a09 100%)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? (isArabic ? -1 : 1) : (isArabic ? 1 : -1));
        touchX.current = null;
      }}
    >
      <style>{`
        @keyframes hero-zoom{from{transform:scale(.94) translateY(8px)}to{transform:scale(1.02) translateY(0)}}
        .hero-zoom{animation:hero-zoom ${INTERVAL + 1200}ms ease-out both}
        @media (prefers-reduced-motion: reduce){.hero-zoom{animation:none}}
      `}</style>

      {/* Heading — top */}
      <div className="relative z-20 text-center px-4 pt-5 md:pt-10 shrink-0">
        <h1 className="text-3xl md:text-6xl font-serif leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,.5)]">
          {isArabic ? "اكتشف عطرك المميز" : "Discover Your Signature Scent"}
        </h1>
        <div className="w-16 h-[1px] bg-ring mx-auto mt-3 md:mt-4" />
      </div>

      {/* Slides — middle */}
      <div className="relative flex-1 min-h-0">
      {slides.map((s, i) => {
        const active = ready && i === index;
        return (
          <div
            key={s.href + i}
            className="absolute inset-0 flex flex-col items-center justify-center py-3 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: active ? 1 : 0, pointerEvents: active ? "auto" : "none" }}
            aria-hidden={!active}
          >
            {/* soft spotlight under the bottle */}
            <div className="absolute left-1/2 -translate-x-1/2 rounded-[50%]" style={{ bottom: 52, width: "min(60vw, 420px)", height: 40, background: "radial-gradient(closest-side, rgba(212,175,55,.28), rgba(212,175,55,0))", filter: "blur(4px)" }} />
            <Link href={s.href} className="relative block" style={{ height: "calc(100% - 56px)", maxHeight: 460 }} tabIndex={active ? 0 : -1}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={active ? `on-${index}` : `off-${i}`}
                src={s.image}
                alt={`${s.brand} ${s.name}`}
                loading={i < 2 ? "eager" : "lazy"}
                className={`h-full w-auto max-w-[80vw] object-contain ${active ? "hero-zoom" : ""}`}
                style={{ filter: "drop-shadow(0 18px 24px rgba(0,0,0,.55))" }}
              />
            </Link>
            <Link href={s.href} className="relative mt-3 text-center px-4" tabIndex={active ? 0 : -1} dir={isArabic ? "rtl" : "ltr"}>
              <span className="block text-[10px] md:text-xs tracking-[0.3em] uppercase text-ring">{s.brand}</span>
              <span className="block text-sm md:text-base font-serif text-white/90 mt-1 line-clamp-1 max-w-[80vw]">{s.name}</span>
            </Link>
          </div>
        );
      })}
      </div>

      {/* Shop Now + dots — bottom */}
      <div className="relative z-20 flex flex-col items-center gap-3 md:gap-4 px-4 pt-2 pb-5 md:pb-8 shrink-0">
        <Link
          href={`/${locale}/shop`}
          className="bg-ring text-white px-10 py-3.5 md:py-4 text-sm tracking-widest uppercase font-bold hover:bg-white hover:text-black transition-colors w-full max-w-xs text-center"
        >
          {isArabic ? "تسوق الآن" : "Shop Now"}
        </Link>
        {count > 1 && (
          <div className="flex gap-2" role="tablist" aria-label={isArabic ? "الشرائح" : "Slides"}>
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1} / ${count}`}
                aria-selected={i === index}
                role="tab"
                className={`h-[3px] transition-all duration-500 ${i === index ? "w-8 bg-ring" : "w-4 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop arrows */}
      {count > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Previous" className="hidden md:grid absolute left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 place-items-center border border-white/30 text-white/80 hover:bg-white hover:text-black transition-colors">‹</button>
          <button type="button" onClick={() => go(1)} aria-label="Next" className="hidden md:grid absolute right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 place-items-center border border-white/30 text-white/80 hover:bg-white hover:text-black transition-colors">›</button>
        </>
      )}
    </section>
  );
}
