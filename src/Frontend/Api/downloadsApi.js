export async function getDownloads() {
  const response = await fetch("/api/downloads");
  if (!response.ok) return [];
  const body = await response.json();
  return Array.isArray(body.rows) ? body.rows : [];
}
