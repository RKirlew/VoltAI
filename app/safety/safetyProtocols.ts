import { SafetyHazard } from "../../types/safetyhazard";

export function getSafetyAnnouncement() {
  return "This may be dangerous. We are now switching to safety mode.";
}

export function getSafetyInstructions(hazard: SafetyHazard): string {
  switch (hazard) {
    case "gas":
      return (
        "If you smell gas or hear hissing, leave the area immediately. " +
        "Do not use switches, phones, or open flames. " +
        "Move to a safe distance."
      );

    case "fire":
    case "sparks":
      return (
        "If there is fire or sparking, keep your distance. " +
        "Do not attempt repairs. " +
        "Move people away from the area."
      );

    case "smoke":
      return "If there is smoke, move away from the area immediately.";
    case "downed_line":
      return (
        "Please stay at least 10 meters back from the downed line. " +
        "I've opened a secure portal on your screen. " +
        "If you can safely do so, show me the line using your camera, so I can identify if it is a high-voltage hazard."
      );


    default:
      return "Please move to a safe location away from the hazard.";
  }
}
