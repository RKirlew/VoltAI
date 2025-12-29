import { summarizeIncident } from "@/lib/ai/summarizeIncident";
import { db } from "@/lib/firebase/admin";
import { collection, addDoc } from "firebase/firestore";
import { NextResponse } from "next/server"
export async function POST(req: Request) {
  const incident = await req.json();

  // Remove undefined fields
  Object.keys(incident).forEach(
    (key) =>
      incident[key as keyof typeof incident] === undefined &&
      delete incident[key as keyof typeof incident]
  );

  try {
    const summary = await summarizeIncident(incident.transcript);

    const incidentWithSummary = {
      ...incident,
      summary, 
    };

    const docRef = await db.collection("incidents").add(incidentWithSummary);

    return new Response(JSON.stringify({ id: docRef.id }), { status: 200 });
  } catch (err) {
    console.error("Firestore write error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to save incident" }),
      { status: 500 }
    );
  }
}

export async function GET() {
  const snapshot = await db
    .collection("incidents")
    .orderBy("createdAt", "desc")
    .get()

  const incidents = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))

  return NextResponse.json(incidents)
}
