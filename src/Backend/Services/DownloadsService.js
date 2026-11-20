import { getAllDownloads } from "@/Backend/Repositories/DownloadsRepository";

export async function loadDownloads() {
  return getAllDownloads();
}
