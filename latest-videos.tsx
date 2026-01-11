import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { fetchYoutubeVideos } from "@/lib/youtube"
import { Play } from "lucide-react"

export async function LatestVideos() {
  const videos = await fetchYoutubeVideos(3) // Nur die neuesten 3 Videos

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neueste YouTube Videos</CardTitle>
        <CardDescription>Meine aktuellsten Uploads auf YouTube</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {videos.map((video) => (
          <Link key={video.id} href={`/youtube/${video.id}`} className="block group">
            <div className="flex gap-4">
              <div className="relative w-32 h-20 flex-shrink-0">
                <Image
                  src={video.thumbnail || "/placeholder.svg?height=180&width=320"}
                  alt={video.title}
                  fill
                  className="object-cover rounded-md"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                  <Play className="text-white h-8 w-8 fill-white" />
                </div>
              </div>
              <div>
                <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors text-sm">
                  {video.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(video.publishedAt)}</p>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full bg-transparent">
          <Link href="/youtube">Alle Videos ansehen</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default LatestVideos
