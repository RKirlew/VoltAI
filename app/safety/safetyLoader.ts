let cachedKeywords: string[] | null = null;

export async function loadSafetyKeywords(): Promise<string[]> {
  if (cachedKeywords) return cachedKeywords;

  const res = await fetch("/safety_keywords.txt");
  const text = await res.text();

  cachedKeywords = text
    .split("\n")
    .map(w => w.trim().toLowerCase())
    .filter(Boolean);

  return cachedKeywords;
}
