export async function sendAudioForTranscription(audio: Blob) {
  const formData = new FormData();
  formData.append("file", audio);

  const res = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to transcribe audio");
  }

  return res.json();
}
