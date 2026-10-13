/**
 * Cleans product details that come from the POS (itemDetails) before they reach the
 * website, Google Shopping and Meta. The POS data has been damaged by earlier imports in
 * a few repeatable ways; every rule here repairs one of them. The same rules run in
 * admin.html when a sheet is imported, so new imports stay clean too.
 *
 * The item's own POS name is the most reliable source for concentration, size and gender
 * ("... EDT 125 ML", "... MEN ..."), so where the name says it, the name wins.
 */

// "A, r, o, m, a, t, i, c, ,, , F, r, e, s, h" — a text was split into single letters
// and joined with ", ". An empty piece was a space.
export function fixLetterSplit(value: string): string {
  if (!value.includes(", ")) return value;
  const parts = value.split(", ");
  if (parts.length < 5 || !parts.every((p) => p.length <= 1)) return value;
  return parts.map((p) => p || " ").join("").replace(/\s+/g, " ").trim();
}

// Arabic read with the wrong encoding: "Ø¹Ø·Ø±" instead of "عطر". The text is UTF-8 bytes
// that were read as Latin-1, so turn the characters back into bytes and decode them as UTF-8.
export function fixMojibake(value: string): string {
  if (!/[\u00d8-\u00db][\u0080-\u00bf]/.test(value)) return value;
  for (let i = 0; i < value.length; i++) if (value.charCodeAt(i) > 255) return value;
  try {
    const bytes = Uint8Array.from(value, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return value;
  }
}

// "['Mint', 'Lemon']" (a Python list saved as text) -> "Mint, Lemon"
export function fixListText(value: string): string {
  const t = value.trim();
  if (!/^\[[\s\S]*\]$/.test(t)) return value;
  return t
    .slice(1, -1)
    .split(",")
    .map((p) => p.trim().replace(/^['"\u2018\u2019\u201c\u201d]+|['"\u2018\u2019\u201c\u201d]+$/g, "").trim())
    .filter(Boolean)
    .join(", ");
}

export function cleanText(value: unknown): string {
  if (value === undefined || value === null) return "";
  let s = String(value);
  s = fixMojibake(s);
  s = fixLetterSplit(s);
  s = fixListText(s);
  return s.replace(/\uFFFD/g, "").replace(/\s+/g, " ").trim();
}

// The POS swaps "." in item names for "�" (Firebase keys can't hold dots). For display,
// "2�5 ML" is "2.5 ML" and a trailing one ("100 ML�") is dropped.
export function displayName(key: string): string {
  return key
    .replace(/(\d)\uFFFD(\d)/g, "$1.$2")
    .replace(/\uFFFD/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---- concentration ---------------------------------------------------------------
// Letters-only boundaries so "EDP100M" still counts as EDP.
const W = (p: string) => new RegExp(`(?<![A-Z])(?:${p})(?![A-Z])`);
const CONCENTRATION_RULES: [RegExp, string][] = [
  [W("HAIR MIST|HAIR PERFUME|PARFUM POUR LES CHEVEUX"), "Hair Mist"],
  [W("BODY MIST|BODY SPRAY"), "Body Mist"],
  [W("PARFUM DE TOILETTE"), "Parfum de Toilette"],
  [W("EXTRAIT|EXTRAIIT|EXRAIT|EXTRIAT|EXTARIT|EXTRAIT DEPARFUM"), "Extrait de Parfum"],
  [W("EDP|EAU DE PARFUM"), "EDP"],
  [W("EDT|EAU DE TOILETTE"), "EDT"],
  [W("EDC|EAU DE COLOGNE|ED COLOGNE|COLOGNE|COLONGE"), "EDC"],
  [W("PARFUM|PROFUMO"), "Parfum"],
];

export function concentrationFromName(name: string): string {
  const n = name.toUpperCase();
  for (const [re, value] of CONCENTRATION_RULES) if (re.test(n)) return value;
  return "";
}

const CONCENTRATION_NAMES: Record<string, string> = {
  EDP: "EDP", "EAU DE PARFUM": "EDP",
  EDT: "EDT", "EAU DE TOILETTE": "EDT",
  EDC: "EDC", COLOGNE: "EDC", "EAU DE COLOGNE": "EDC",
  PARFUM: "Parfum", PERFUME: "Parfum",
  EXTRAIT: "Extrait de Parfum", "EXTRAIT DE PARFUM": "Extrait de Parfum",
};

export function normalizeConcentration(value: string): string {
  const v = cleanText(value);
  if (!v) return "";
  return CONCENTRATION_NAMES[v.toUpperCase()] || v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
}

export function resolveConcentration(name: string, stored: unknown): string {
  return concentrationFromName(name) || normalizeConcentration(String(stored || ""));
}

// ---- size ------------------------------------------------------------------------
export const SIZE_AT_END = /\s*[-()]*\s*(\d+(?:\.\d+)?)\s*(ml|oz)\s*[-()]*\s*$/i;

// "75 ML" -> "75ml". Older imports filled an empty size cell with exactly "100ml", which
// is a guess, not data, so it is ignored.
export function normalizeStoredSize(value: unknown): string {
  const v = cleanText(value);
  if (!v || v === "100ml") return "";
  const m = v.match(/^(\d+(?:\.\d+)?)\s*(ml|oz)$/i);
  return m ? m[1] + m[2].toLowerCase() : v.toLowerCase();
}

// ---- gender ----------------------------------------------------------------------
const MEN = W("MEN|MAN|HOMME|UOMO|HOMBRE|FOR HIM|POUR LUI|MASCULINE|MUSCULINE");
const WOMEN = W("WOMEN|WOMAN|FEMME|DONNA|MUJER|LADY|LADIES|FOR HER|POUR ELLE|W");

export function resolveGender(name: string, stored: unknown): string {
  const n = name.toUpperCase();
  const men = MEN.test(n), women = WOMEN.test(n);
  const s = cleanText(stored);
  if (men && !women) return "Men";
  if (women && !men) return "Women";
  return ["Men", "Women", "Unisex"].includes(s) ? s : "Unisex";
}
