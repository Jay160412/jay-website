// Verbesserte Implementierung für die YouTube API Integration
// Lädt mehr Videos mit Pagination und verbessert das Caching

export interface YoutubeVideo {
  id: string
  title: string
  thumbnail: string
  publishedAt: string
  url: string
}

// Cache für YouTube-Videos - kompatibel mit Browser und Server
let youtubeCache: {
  videos: YoutubeVideo[]
  timestamp: number
} | null = null

// Funktion zum Leeren des Caches
export function clearYoutubeCache() {
  youtubeCache = null
}

export async function fetchYoutubeVideos(limit?: number): Promise<YoutubeVideo[]> {
  try {
    // Prüfe, ob wir einen gültigen Cache haben (nicht älter als 1 Stunde)
    const now = Date.now()
    const cacheExpiry = 60 * 60 * 1000 // 1 Stunde in Millisekunden

    if (youtubeCache && now - youtubeCache.timestamp < cacheExpiry) {
      const cachedVideos = youtubeCache.videos
      if (limit) {
        return cachedVideos.slice(0, limit)
      }
      return cachedVideos
    }

    // Maximale Anzahl von Videos, die pro Anfrage geladen werden können
    const maxResultsPerRequest = 50
    const maxToFetch = limit || 50 // Standardmäßig bis zu 50 Videos laden

    let allVideos: YoutubeVideo[] = []
    let nextPageToken: string | undefined = undefined

    try {
      // Mehrere Anfragen senden, bis wir genug Videos haben oder keine weiteren verfügbar sind
      while (allVideos.length < maxToFetch) {
        const pageSize = Math.min(maxResultsPerRequest, maxToFetch - allVideos.length)

        const url = new URL("https://www.googleapis.com/youtube/v3/search")
        url.searchParams.append("key", process.env.YOUTUBE_API_KEY || "")
        url.searchParams.append("channelId", process.env.YOUTUBE_CHANNEL_ID || "")
        url.searchParams.append("part", "snippet,id")
        url.searchParams.append("order", "date")
        url.searchParams.append("maxResults", pageSize.toString())
        url.searchParams.append("type", "video")

        if (nextPageToken) {
          url.searchParams.append("pageToken", nextPageToken)
        }

        const response = await fetch(url.toString(), {
          cache: "no-store",
          next: { revalidate: 3600 }, // Revalidiere alle 60 Minuten
        })

        if (!response.ok) {
          throw new Error(`YouTube API responded with status: ${response.status}`)
        }

        const data = await response.json()

        // Transformiere die API-Antwort in unser YoutubeVideo-Format
        const videos: YoutubeVideo[] = data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail:
            item.snippet.thumbnails.high?.url ||
            item.snippet.thumbnails.medium?.url ||
            item.snippet.thumbnails.default?.url,
          publishedAt: item.snippet.publishedAt,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        }))

        allVideos = [...allVideos, ...videos]

        // Prüfen, ob es weitere Seiten gibt
        nextPageToken = data.nextPageToken

        // Wenn es keinen nextPageToken gibt, haben wir alle Videos geladen
        if (!nextPageToken) {
          break
        }
      }

      // Speichere die Videos im Cache
      youtubeCache = {
        videos: allVideos,
        timestamp: now,
      }

      // Begrenze die Anzahl der zurückgegebenen Videos, falls ein Limit angegeben wurde
      if (limit && allVideos.length > limit) {
        return allVideos.slice(0, limit)
      }

      return allVideos
    } catch (error) {
      console.error("Error fetching YouTube videos:", error)

      // Fallback zu Mock-Daten im Fehlerfall
      return [
        {
          id: "1",
          title: "Mein neuestes Gaming Video - Minecraft Survival",
          thumbnail: "/placeholder.svg?height=180&width=320",
          publishedAt: "2023-04-15T14:30:00Z",
          url: "https://youtube.com/@jay_yt_real",
        },
        {
          id: "2",
          title: "Let's Play: Fortnite Season 5",
          thumbnail: "/placeholder.svg?height=180&width=320",
          publishedAt: "2023-04-10T10:15:00Z",
          url: "https://youtube.com/@jay_yt_real",
        },
        {
          id: "3",
          title: "Tutorial: Wie man in Minecraft baut",
          thumbnail: "/placeholder.svg?height=180&width=320",
          publishedAt: "2023-04-05T16:45:00Z",
          url: "https://youtube.com/@jay_yt_real",
        },
      ].slice(0, limit || 10)
    }
  } catch (error) {
    console.error("Error in fetchYoutubeVideos:", error)
    return []
  }
}
