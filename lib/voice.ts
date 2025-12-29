export async function listenForSpeech(
  onResult: (text: string) => void,
  onStart?: () => void,
  onEnd?: () => void
) {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech recognition not supported");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onstart = () => onStart?.();

  recognition.onresult = (event: any) => {
    const text = event.results[0][0].transcript;
    onResult(text);
  };

  recognition.onerror = () => onEnd?.();
  recognition.onend = () => onEnd?.();

  recognition.start();
}
