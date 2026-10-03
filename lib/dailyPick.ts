// Picks a different set of perfumes each day (changes at midnight Kuwait time).
// Same result for everyone on the same day, so the page can still be cached.

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

export function kuwaitToday(): string {
  // Kuwait is UTC+3 all year (no daylight saving)
  return new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);
}

export function dailyShuffle<T>(items: T[], salt = ""): T[] {
  const rand = seededRandom(hash(kuwaitToday() + salt));
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
