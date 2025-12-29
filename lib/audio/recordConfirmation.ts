import { sendAudioForTranscription } from "./uploadAudio";

let mediaRecorder: MediaRecorder | null = null;
let stream: MediaStream | null = null;
let chunks: BlobPart[] = [];
export async function recordConfirmation(): Promise<string> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Audio recording not supported");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  let chunks: BlobPart[] = [];

  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      try {
        const blob = new Blob(chunks, { type: "audio/webm" });
        let transcript = await sendAudioForTranscription(blob);

       
        if (typeof transcript !== "string") transcript = "";

        resolve(transcript);
      } catch (err) {
        reject(err);
      } finally {
        stream.getTracks().forEach((t) => t.stop());
      }
    };

    mediaRecorder.onerror = (err) => reject(err);

    mediaRecorder.start();

    // Stop automatically after 5 seconds
    setTimeout(() => {
      if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
    }, 5000);
  });
}
