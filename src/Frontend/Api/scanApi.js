export async function getScan() {
  const response = await fetch("/api/scan");
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Could not load scan");
  }
  return response.json();
}
