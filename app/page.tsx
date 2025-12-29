"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Phone, Zap, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react"
import { listenForSpeech } from "@/lib/voice";
import { simulateCall } from "@/lib/voltai"
import {stopRecording, startRecording } from "@/lib/audio/recordAudio";
import { sendAudioForTranscription } from "@/lib/audio/uploadAudio";
import { IncidentDraft } from "@/types/incident"
import { INCIDENT_STEPS } from "@/lib/audio/incidentSteps"
import { summarizeIncident } from "@/lib/ai/summarizeIncident"
import { recordConfirmation } from "@/lib/audio/recordConfirmation"
import { useSafetyKeywords } from "./safety/useSafetyKeywords"
import { detectSafetyHazard } from "./safety/safetyDetector"
import { getSafetyAnnouncement, getSafetyInstructions } from "./safety/safetyProtocols"
import Link from "next/link"
import { SafetyHazard } from "@/types/safetyhazard"
import VisionPortal from "@/components/visionportal"
import { ConnectionIndicator } from "@/components/connectionindicator"
type Severity = "High" | "Medium" | "Low"

interface Incident {
  id: number
  caller: string
  timestamp: string
  incidentType: string
  severity: Severity
  transcript: {
    caller: string[]
    ai: string[]
  }
}

const mockIncidents: Incident[] = [
  {
    id: 1,
    caller: "+1 204-555-0100",
    timestamp: "2025-12-16 10:00",
    incidentType: "Power Outage",
    severity: "High",
    transcript: {
      ai: [
        "VoltAI here. What is the nature of your incident?",
        "Thank you. Can you provide the exact location?",
        "Understood. Incident logged as high priority. Our team will respond within 15 minutes.",
      ],
      caller: [
        "We have a complete power outage affecting the downtown district.",
        "Corner of Main Street and 5th Avenue, affecting approximately 200 customers.",
        "Thank you.",
      ],
    },
  },
  {
    id: 2,
    caller: "+1 204-555-0101",
    timestamp: "2025-12-16 09:45",
    incidentType: "Transformer Fault",
    severity: "Medium",
    transcript: {
      ai: [
        "VoltAI here. What is the nature of your incident?",
        "Can you describe what you observed?",
        "Incident logged. Maintenance crew has been dispatched.",
      ],
      caller: [
        "There is a transformer making unusual sounds near the industrial park.",
        "Humming noise and occasional sparking. No power loss yet.",
        "Understood, thank you.",
      ],
    },
  },
]



export default function VoltAIPage() {
  const { keywords: safetyKeywords, ready } = useSafetyKeywords();
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connecting" | "connected">("idle");

  
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showVisionPortal,setShowVisionPortal]= useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [pausedForHazard, setPausedForHazard] = useState(false);

  const [stepIndex, setStepIndex] = useState(0);
  const [incidentDraft, setIncidentDraft] = useState<IncidentDraft>({});
  const [fullTranscript, setFullTranscript] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [summaryRead, setSummaryRead] = useState(false);
  const [callSummary, setCallSummary] = useState<string>("");
  const [confirmationAnswer, setConfirmationAnswer] = useState<string>("");

  const [protocolRead, setProtocolRead] = useState(false);
  const [hazardDetected, setHazardDetected] = useState<SafetyHazard | null>(null);


useEffect(() => {
  if (!isCallModalOpen) return;
  if (pausedForHazard) return; // skip normal steps while demo is ongoing

  if (stepIndex < INCIDENT_STEPS.length) {
    askCurrentQuestion();
  } else {
    finalizeIncident(); // save to Firebase
  }
}, [stepIndex, pausedForHazard]);

 
  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case "High":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      case "Medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20"
      case "Low":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    }
  }


  const numberMap: Record<string, string> = {
  "zero": "0",
  "one": "1",
  "two": "2",
  "three": "3",
  "four": "4",
  "five": "5",
  "six": "6",
  "seven": "7",
  "eight": "8",
  "nine": "9",
  "ten": "10",
  "eleven": "11",
  "twelve": "12",
  "thirteen": "13",
  "fourteen": "14",
  "fifteen": "15",
  "sixteen": "16",
  "seventeen": "17",
  "eighteen": "18",
  "nineteen": "19",
  "twenty": "20",
  "thirty": "30",
  "forty": "40",
  "fifty": "50",
  "hundred": "00",
};

function normalizeAddress(text: string) {
  let normalized = text.toLowerCase();
  Object.entries(numberMap).forEach(([word, digit]) => {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, "g"), digit);
  });
  return normalized;
}
async function handleStartRecording() {
  try {
    setLoading(true);
    await startRecording();
  } catch (err) {
    console.error(err);
    setLoading(false);
  }
}

function normalizeAnswer(
  key: keyof IncidentDraft,
  text: string
) {
  const t = text.toLowerCase();

  if (key === "severity") {
    if (t.includes("critical")) return "critical";
    if (t.includes("moderate")) return "moderate";
    if (t.includes("minor")) return "minor";
    return undefined;
  }

  return text.trim();
}

function getDispatchMessage(hazard: SafetyHazard) {
  switch (hazard) {
    case "fire":
    case "sparks":
      return "Emergency utility crews have been notified and are being dispatched. Please keep clear of the area.";

    case "gas":
      return "Gas emergency crews have been notified. Please remain at a safe distance until they arrive.";

    default:
      return "Utility crews have been notified and are on the way.";
  }
}


async function handleStopRecording() {
  try {
    setIsRecording(false);
    const audio = await stopRecording();
    const transcript = await sendAudioForTranscription(audio);

    setFullTranscript(prev => [...prev, transcript.transcript.text]);

    const hazard = detectSafetyHazard(
    transcript.transcript.text,
    safetyKeywords
  );

  if (hazard && !protocolRead) {
     // Mark safety protocol as read so we don’t repeat the instructions set up 
    setProtocolRead(true);
    setHazardDetected(hazard);
    await speakText(getSafetyAnnouncement());
    await speakText(getSafetyInstructions(hazard));

    if (hazard === "downed_line") {
        setIsCallModalOpen(false);
        setPausedForHazard(true);

        setShowVisionPortal(true); // the demo UI for judges
        return;
    }
    
  }


    const step = INCIDENT_STEPS[stepIndex];

    // Confirmation step → store raw answer only in memory
    if (step.key === "confirmation") {
      setConfirmationAnswer(transcript.transcript.text); // save in state, not incidentDraft
      setStepIndex(i => i + 1);
      return;
    }

    // Normal steps
    const value = normalizeAnswer(step.key, transcript.transcript.text);

    if (!value) {
      await speakText("Sorry, I didn’t catch that. Please try again.");
      await askCurrentQuestion();
      return;
    }

    setIncidentDraft(prev => ({
      ...prev,
      [step.key]: step.key === "location" ? normalizeAddress(value) : value,
    }));

    setStepIndex(i => i + 1);
  } catch (err) {
    console.error(err);
  }
}


async function finalizeIncident() {
    const confirmed =
    (confirmationAnswer ?? "").toLowerCase().includes("yes");
    if (hazardDetected) {
        await speakText(getDispatchMessage(hazardDetected));
      }
  await speakText(
    confirmed
      ? "Thank you. Your incident has been recorded."
      : "Thank you. Your incident has been recorded and marked for review."
  );

  const incident = {
    ...incidentDraft,
    transcript: fullTranscript.join(" "),
    confirmed,
    needsReview: !confirmed,
    summary: callSummary,
    createdAt: Date.now(),
  };

  Object.keys(incident).forEach(
    key =>
      incident[key as keyof typeof incident] === undefined &&
      delete incident[key as keyof typeof incident]
  );

  console.log("Sending to Firestore:", incident);

  await fetch("/api/incidents", {
    method: "POST",
    body: JSON.stringify(incident),
  });

  setIsCallModalOpen(false);
}



async function speakText(text: string) {
  const res = await fetch("/api/tts", {
    method: "POST",
    body: JSON.stringify({ text }),
  });

  const audioBlob = await res.blob();
  const audio = new Audio(URL.createObjectURL(audioBlob));

  await new Promise<void>((resolve) => {
    audio.onended = () => resolve();
    audio.play();
  });
}


async function askCurrentQuestion() {
  const step = INCIDENT_STEPS[stepIndex];
  if (!step) return;

  // 🔹 Confirmation step
  if (step.key === "confirmation") {
    if (!summaryRead) {
      await speakText("Please hold while I generate a summary.");

      let callSummary =
        "Incident reported. Summary could not be generated automatically.";

      try {
        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: fullTranscript.join(" "),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          callSummary = data.summary;
        }
      } catch (err) {
        console.error("Summarize failed", err);
      }

      setCallSummary(callSummary);
      setSummaryRead(true);

      await speakText(
        `Here is a summary of the incident. ${callSummary}. Is this correct? Please say yes or no.`
      );
    }

    await handleStartRecording();
    return;
  }

  // 🔹 Normal steps
  await speakText(step.prompt);
  await handleStartRecording();
}



async function startCall() {
  setIsCallModalOpen(true);
  setConnectionStatus("connecting");
  await speakText(
     "Hi there. You are connected to Volt AI incident intake. I will now ask you a few questions."
  );
  setConnectionStatus("connected");

    await askCurrentQuestion();

}
if (!ready) {
    return null; 
  }

  
  return (


    
    <div className="min-h-screen bg-gradient-to-br from-[#001829] via-[#00263d] to-[#001829]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
  {/* Left side */}
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 bg-[#00A651] rounded-lg flex items-center justify-center">
      <Zap className="w-5 h-5 text-white" />
    </div>
    <span className="text-xl font-bold text-white">VoltAI</span>
  </div>

  {/* Right side buttons */}
  <div className="flex items-center gap-2">
    <Link href="/admin">
      <Badge
        variant="outline"
        className="
          bg-[#007BFF]/20
          text-[#0056b3]
          border border-[#007BFF]/50
          rounded-lg
          font-medium
          shadow-sm
          hover:bg-[#007BFF]/30
          hover:text-white
          transition-all
          duration-200
          cursor-pointer
        "
      >
        Incidents Map
      </Badge>
    </Link>

    <Badge
      variant="outline"
      className="bg-[#00A651]/10 text-[#00A651] border-[#00A651]/30"
    >
      Demo Mode
    </Badge>
  </div>
</div>
</header>


      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1.5 bg-[#00A651]/10 border border-[#00A651]/20 rounded-full mb-6">
            <span className="text-sm text-[#00A651] font-medium">AI-Powered Operations</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
            VoltAI — AI-Powered Incident Intake Line
          </h1>
          <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto text-pretty">
            AI-driven incident intake for utilities and operations teams.
          </p>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Capture, validate, and log operational incidents through phone calls, powered by AI and voice technology.
          </p>
          <Button
            size="lg"
            onClick={startCall}
            className="bg-[#00A651] hover:bg-[#008f45] text-white gap-2 text-lg px-8 py-6"
          >
            Simulate Call
            <ArrowRight className="w-5 h-5" />
          </Button>
          <p className="text-sm text-gray-500 mt-4">Try a demo incident now and see VoltAI in action.</p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-medium">Total Incidents</span>
              <AlertTriangle className="w-5 h-5 text-[#00A651]" />
            </div>
            <div className="text-3xl font-bold text-white">3</div>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-medium">Active Calls</span>
              <Phone className="w-5 h-5 text-[#00A651] animate-pulse" />
            </div>
            <div className="text-3xl font-bold text-white">1</div>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-medium">Demo Mode</span>
              <CheckCircle2 className="w-5 h-5 text-[#00A651]" />
            </div>
            <div className="text-3xl font-bold text-[#00A651]">ON</div>
          </Card>
        </div>

        {/* Recent Incidents Table */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white">Recent Incidents</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Caller</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Timestamp</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Incident Type</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Severity</th>
                </tr>
              </thead>
              <tbody>
                {mockIncidents.map((incident) => (
                  <tr
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="p-4 text-white font-mono text-sm">{incident.caller}</td>
                    <td className="p-4 text-gray-300">{incident.timestamp}</td>
                    <td className="p-4 text-gray-200">{incident.incidentType}</td>
                    <td className="p-4">
                      <Badge className={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          Built for the Google Cloud Hackathon | VoltAI
        </div>
      </footer>
                
      {/* Transcript Modal */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="bg-[#001829] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Incident Transcript</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedIncident?.incidentType} - {selectedIncident?.timestamp}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedIncident?.transcript.ai.map((message, index) => (
              <div key={`transcript-${index}`}>
                <div className="flex gap-3 mb-4">
                  <div className="w-8 h-8 bg-[#00A651] rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-[#00A651] font-medium mb-1">VoltAI</div>
                    <div className="bg-white/5 rounded-lg p-3 text-gray-200">{message}</div>
                  </div>
                </div>
                {selectedIncident.transcript.caller[index] && (
                  <div className="flex gap-3 mb-4">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 font-medium mb-1">Caller</div>
                      <div className="bg-white/5 rounded-lg p-3 text-gray-200">
                        {selectedIncident.transcript.caller[index]}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Call Simulation Modal */}
      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent className="bg-[#001829] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">VoltAI Call</DialogTitle>
            <DialogDescription className="text-gray-400">
              Please wait until the assistant finishes speaking. Then give your answer and click “Stop Talking.”
            </DialogDescription>
            <ConnectionIndicator status={connectionStatus} />

          </DialogHeader>
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-[#00A651] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Phone className="w-8 h-8 text-white" />
            </div>
            
            

            <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Speak naturally. VoltAI will log and respond to the incident.
        </p>

         <div className="p-6 space-y-4">
      <Button onClick={handleStartRecording} disabled={true}>
        {loading ? "Listening..." : "Start Talking"}
      </Button>
      <Button onClick={handleStopRecording} disabled={!loading}>
        Stop Talking
      </Button>
      {result && (
        <div className="rounded border p-4">
          <p><strong>Transcript:</strong> {result.transcript.text}</p>
          
        </div>
      )}
    </div>
    </div>
        <Button
              onClick={() => setIsCallModalOpen(false)}
              variant="outline"
              className="bg-black-100 border-white/20 text-white hover:bg-white/10 mt-10"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>


       {/* VisionPortal modal */}
    {showVisionPortal && (
      <VisionPortal
        imageSrc="/downed-line-demo.jpg"
        onClose={() => setShowVisionPortal(false)}
        onAnalyzeComplete={async (result) => {
          // Update incident draft with vision result
          setIncidentDraft(prev => ({
            ...prev,
            lineType: "12kV distribution",
            severity:"critical",
            priority: "Priority 1 Emergency",
            crew: "Winnipeg",
          }))
          await speakText(result);
          await speakText("Can you confirm the exact location of the line?");
          setStepIndex(INCIDENT_STEPS.findIndex(step => step.key === "location"));

          setShowVisionPortal(false);
          setPausedForHazard(false);
          setIsCallModalOpen(true)
        }}
      />
    )}
    </div>

    
  )
  
}
