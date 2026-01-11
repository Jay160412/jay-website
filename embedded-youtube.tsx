interface EmbeddedYoutubeProps {
  videoId: string
  title?: string
}

export function EmbeddedYoutube({ videoId, title = "YouTube video player" }: EmbeddedYoutubeProps) {
  return (
    <div className="aspect-video w-full">
      <iframe
        className="w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  )
}
