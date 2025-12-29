// src/app/api/tts/route.ts
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

export async function POST(req: Request) {
  const { text } = await req.json();

  const stream = await elevenlabs.textToSpeech.convert(
    "SAz9YHcvj6GT2YYXdXww",
    {
      modelId: "eleven_multilingual_v2",
      text,
    }
  );

  return new Response(stream, {
    headers: {
      "Content-Type": "audio/mpeg",
    },
  });
}
