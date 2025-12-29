let mediaRecorder: MediaRecorder | null = null;
let stream: MediaStream | null = null;
let chunks: BlobPart[] = [];

export async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Audio recording not supported");
  }

  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  chunks = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.start();
}

export function stopRecording(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || !stream) {
      reject(new Error("Recorder not started"));
      return;
    }

    mediaRecorder.onstop = () => {
      stream?.getTracks().forEach((t) => t.stop());

      const blob = new Blob(chunks, { type: "audio/webm" });

      mediaRecorder = null;
      stream = null;
      chunks = [];

      resolve(blob);
    };

    mediaRecorder.stop();
  });
}
