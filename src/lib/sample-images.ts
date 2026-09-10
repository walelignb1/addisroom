/** High-quality sample real-estate photos (Unsplash). */
export const SAMPLE_LISTING_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
  "https://images.unsplash.com/photo-1502672260066-1c1ef2d93688?w=1200&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c45730?w=1200&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80",
] as const;

/** Pick N sample URLs (stable variety based on a seed string). */
export function pickSampleImages(seed: string, count = 3): string[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const out: string[] = [];
  const pool = [...SAMPLE_LISTING_IMAGES];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = hash % pool.length;
    out.push(pool[idx]!);
    pool.splice(idx, 1);
    hash = (hash * 17 + 7) >>> 0;
  }
  return out;
}

export function parseImageUrls(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("http://") || s.startsWith("https://"));
}
