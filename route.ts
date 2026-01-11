import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

// Importiere die Funktion, um den Cache zu leeren
import { clearYoutubeCache } from "@/lib/youtube"

export async function GET() {
  try {
    // Lösche den Cache für die YouTube-Daten
    clearYoutubeCache()

    // Revalidiere die Pfade, die YouTube-Daten verwenden
    revalidatePath("/youtube")
    revalidatePath("/")
    revalidatePath("/youtube/[videoId]", "page")

    return NextResponse.json({
      revalidated: true,
      message: "YouTube-Daten wurden aktualisiert",
    })
  } catch (error) {
    return NextResponse.json(
      {
        revalidated: false,
        message: "Fehler beim Aktualisieren der YouTube-Daten",
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
