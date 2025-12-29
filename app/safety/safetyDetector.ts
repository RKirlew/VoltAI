import { SafetyHazard } from "../../types/safetyhazard";

export function detectSafetyHazard(
  text: string,
  keywords: string[]
): SafetyHazard | null {
  const lower = text.toLowerCase();

  for (const word of keywords) {
    if (!lower.includes(word)) continue;

    // Normalize keyword -> hazard
    if (["gas", "hissing"].includes(word)) return "gas";
    if (["fire", "flames", "burning"].includes(word)) return "fire";
    if (["sparks"].includes(word)) return "sparks";
    if (["smoke"].includes(word)) return "smoke";
    if (["explosion"].includes(word)) return "explosion";
    if (["downed line","downed power line",, "power line", "transformer down", "line down"].includes(word))
      return "downed_line";
  }

  return null;
}
