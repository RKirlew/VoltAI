import { IncidentDraft } from "@/types/incident";

export const INCIDENT_STEPS: {
  key: keyof IncidentDraft;
  prompt: string;
}[] = [
  {
    key: "type",
    prompt: "What type of incident is this?",
  },
  {
    key: "details",
    prompt: "Please describe the incident in detail.",
  },
  {
    key: "severity",
    prompt:
      "How severe is the incident? Say minor, moderate, or critical.",
  },
  {
    key: "location",
    prompt: "Where did this incident occur?",
  },
  {
    key: "injuries",
    prompt: "Were there any injuries? Please say yes or no.",
  },
  { key: "confirmation", prompt: "" }
  
];
