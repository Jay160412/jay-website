import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { ExternalLink } from "lucide-react"

interface TikTokVideoProps {
  video: {
    id: string
    title: string
    thumbnail: string
    publishedAt: string
    url: string
  }
}

export function TikTokVideo({ video }: TikTokVideoProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Link href={video.url} target="_blank" className="group block">
          <div className="relative aspect-[9/16]">
            <Image
              src={video.thumbnail || "/placeholder.svg?height=320&width=180"}
              alt={video.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ExternalLink className="text-white h-8 w-8" />
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">{video.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{formatDate(video.publishedAt)}</p>
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}
