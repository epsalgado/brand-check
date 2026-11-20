export async function ask(question, reports) {
  const response = await fetch("/api/genie", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, reports })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Genie request failed");
  }
  return response.json();
}
