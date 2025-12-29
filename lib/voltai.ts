export async function simulateCall(input: string) {
  const res = await fetch("/api/simulate-call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });

  if (!res.ok) {
    throw new Error("AI call failed");
  }

  return res.json();
}
