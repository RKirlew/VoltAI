import { NextRequest, NextResponse } from "next/server";
import { elevenlabs } from "@/lib/elevenlabs/client";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as Blob;

  const transcription = await elevenlabs.speechToText.convert({
    file,
    modelId: "scribe_v1",
    languageCode: "eng",
  });

  return NextResponse.json({ transcript: transcription });
}
