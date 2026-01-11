import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TikTokVideo } from "@/components/tiktok-video"
import { fetchTikTokVideos } from "@/lib/tiktok"
import Link from "next/link"

export default async function LatestTikToks() {
  const videos = await fetchTikTokVideos(3) // Nur die neuesten 3 Videos

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neueste TikToks</CardTitle>
        <CardDescription>Meine aktuellsten TikTok Videos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {videos.map((video) => (
          <TikTokVideo key={video.id} video={video} />
        ))}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full bg-transparent">
          <Link href="/tiktok">Alle TikToks ansehen</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export { LatestTikToks }
