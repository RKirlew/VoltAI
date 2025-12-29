import { elevenlabs } from "./client";

export async function transcribeAudio(audioBlob: Blob) {
  const transcription = await elevenlabs.speechToText.convert({
    file: audioBlob,
    modelId: "scribe_v1",
    tagAudioEvents: false,
    diarize: false,
    languageCode: "eng",
  });

  return transcription;
}
