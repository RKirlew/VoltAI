export interface Incident {
  id?: string
  type: string
  details: string
  severity: "minor" | "moderate" | "critical"
  location: string
  transcript: string
  createdAt: number
  summary?: string
  lat?: number
  lng?: number
}

export interface IncidentDraft {
  type?: string;
  severity?: "minor" | "moderate" | "critical";
  location?: string;
  details?: string;
  injuries?: "yes" | "no" | null;
  confirmation?: "yes" | "no" | null;

}
