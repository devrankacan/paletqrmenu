type AnyProduct = { name: string; description: string; [key: string]: unknown };
type AnyCategory = { name: string; products: AnyProduct[]; [key: string]: unknown };

async function batchTranslate(texts: string[], tl: string): Promise<string[]> {
  if (!texts.length) return [];

  // Split into ≤2000-char chunks, translate chunks in parallel
  const chunks: Array<Array<{ i: number; t: string }>> = [[]];
  let len = 0;
  texts.forEach((t, i) => {
    const add = t.length + 1;
    if (len + add > 2000 && chunks[chunks.length - 1].length > 0) {
      chunks.push([]);
      len = 0;
    }
    chunks[chunks.length - 1].push({ i, t });
    len += add;
  });

  const out = [...texts];
  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const joined = chunk.map((c) => c.t).join('\n');
        const url =
          'https://translate.googleapis.com/translate_a/single' +
          `?client=gtx&sl=tr&tl=${tl}&dt=t&q=${encodeURIComponent(joined)}`;
        const res = await fetch(url);
        const data = (await res.json())[0] as [string][];
        const parts = data.map((p) => p[0]).join('').split('\n');
        chunk.forEach(({ i }, j) => {
          if (parts[j]?.trim()) out[i] = parts[j].trim();
        });
      } catch {
        // keep originals on error
      }
    })
  );
  return out;
}

export async function translateMenu<
  P extends AnyProduct,
  C extends AnyCategory & { products: P[] },
>(data: C[], lang: 'en' | 'ar'): Promise<C[]> {
  const tl = lang === 'ar' ? 'ar' : 'en';

  // Deduplicate strings so identical texts are translated only once
  const unique: string[] = [];
  const map = new Map<string, number>();
  const dedup = (s: string | undefined): number => {
    if (!s?.trim()) return -1;
    if (map.has(s)) return map.get(s)!;
    map.set(s, unique.length);
    unique.push(s);
    return unique.length - 1;
  };

  const catIdx = data.map((c) => dedup(c.name));
  const pNameIdx = data.map((c) => c.products.map((p) => dedup(p.name)));
  const pDescIdx = data.map((c) => c.products.map((p) => dedup(p.description)));

  const xlated = await batchTranslate(unique, tl);
  const get = (i: number, fb: string) => (i < 0 ? fb : (xlated[i] ?? fb));

  return data.map((cat, ci) => ({
    ...cat,
    name: get(catIdx[ci], cat.name),
    products: cat.products.map((p, pi) => ({
      ...p,
      name: get(pNameIdx[ci][pi], p.name),
      description: p.description ? get(pDescIdx[ci][pi], p.description) : p.description,
    })) as P[],
  }));
}
