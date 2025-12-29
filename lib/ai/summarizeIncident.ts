import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function summarizeIncident(transcript: string): Promise<string> {
  const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: `
Summarize this incident in 2–3 concise sentences for an operations dashboard.
Be factual. No fluff.

Transcript:
"""${transcript}"""
`,
});

const summary =
  response.text ??
  "Incident reported. Summary could not be generated automatically.";

return summary.trim();

}
