// Beispiel-Implementierung für die TikTok API Integration
// In einer echten Anwendung würde hier die TikTok API verwendet werden

export interface TikTokVideo {
  id: string
  title: string
  thumbnail: string
  publishedAt: string
  url: string
}

// Beispieldaten für die Entwicklung
const MOCK_VIDEOS: TikTokVideo[] = [
  {
    id: "1",
    title: "Zeichnen in 15 Sekunden #art #drawing",
    thumbnail: "/placeholder.svg?height=320&width=180",
    publishedAt: "2023-04-18T10:30:00Z",
    url: "https://www.tiktok.com/@jay__tiktok",
  },
  {
    id: "2",
    title: "POV: Du spielst Minecraft zum ersten Mal #gaming #minecraft",
    thumbnail: "/placeholder.svg?height=320&width=180",
    publishedAt: "2023-04-16T14:20:00Z",
    url: "https://www.tiktok.com/@jay__tiktok",
  },
  {
    id: "3",
    title: "Wie man in 10 Sekunden zeichnet #tutorial #art",
    thumbnail: "/placeholder.svg?height=320&width=180",
    publishedAt: "2023-04-12T18:45:00Z",
    url: "https://www.tiktok.com/@jay__tiktok",
  },
  {
    id: "4",
    title: "Mein Zeichenprozess Timelapse #drawing #timelapse",
    thumbnail: "/placeholder.svg?height=320&width=180",
    publishedAt: "2023-04-08T09:15:00Z",
    url: "https://www.tiktok.com/@jay__tiktok",
  },
  {
    id: "5",
    title: "Gaming Fails Compilation #gaming #fails",
    thumbnail: "/placeholder.svg?height=320&width=180",
    publishedAt: "2023-04-05T16:30:00Z",
    url: "https://www.tiktok.com/@jay__tiktok",
  },
  {
    id: "6",
    title: "Zeichnen vs. Realität #art #expectationvsreality",
    thumbnail: "/placeholder.svg?height=320&width=180",
    publishedAt: "2023-04-01T12:10:00Z",
    url: "https://www.tiktok.com/@jay__tiktok",
  },
]

export async function fetchTikTokVideos(limit?: number): Promise<TikTokVideo[]> {
  // In einer echten Anwendung würde hier die TikTok API aufgerufen werden
  // Die TikTok API ist jedoch eingeschränkter als die YouTube API

  // Für die Entwicklung verwenden wir Mock-Daten
  await new Promise((resolve) => setTimeout(resolve, 500)) // Simuliere API-Latenz

  const videos = MOCK_VIDEOS

  if (limit) {
    return videos.slice(0, limit)
  }

  return videos
}
