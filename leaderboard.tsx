"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getTopHighscores, getUser } from "@/lib/auth"
import { Trophy } from "lucide-react"

interface LeaderboardProps {
  gameId: string
  currentUsername?: string
}

// Kosmetische Stile für Benutzernamen
const COSMETIC_STYLES: Record<string, React.CSSProperties> = {
  gold_name: { color: "#FFD700" },
  rainbow_name: {
    background: "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  blue_name: { color: "#3b82f6" },
  green_name: { color: "#10b981" },
  purple_name: { color: "#8b5cf6" },
}

export function Leaderboard({ gameId, currentUsername }: LeaderboardProps) {
  const [highscores, setHighscores] = useState<Array<{ username: string; score: number; style?: React.CSSProperties }>>(
    [],
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Lade Highscores
    const scores = getTopHighscores(gameId)

    // Füge Stile basierend auf aktiven Kosmetika hinzu
    const scoresWithStyles = scores.map((score) => {
      const user = getUser(score.username)
      let style = undefined

      if (user && user.activeCosmetic) {
        style = COSMETIC_STYLES[user.activeCosmetic]
      }

      return {
        ...score,
        style,
      }
    })

    setHighscores(scoresWithStyles)
    setLoading(false)
  }, [gameId])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (highscores.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-12 w-12 mx-auto text-purple-500 mb-4" />
        <h3 className="text-xl font-bold mb-2">Noch keine Highscores</h3>
        <p className="text-muted-foreground">Sei der Erste, der einen Highscore in diesem Spiel erzielt!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-4 mb-6">
        <Trophy className="h-8 w-8 text-yellow-500" />
        <h2 className="text-2xl font-bold">Bestenliste</h2>
      </div>

      <div className="space-y-4">
        {highscores.map((score, index) => {
          const isCurrentUser = currentUsername && score.username === currentUsername

          return (
            <div
              key={index}
              className={`flex items-center p-4 rounded-lg ${
                isCurrentUser ? "bg-purple-900/30 border border-purple-500/50" : "bg-gray-800/50"
              }`}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 mr-4">
                <span className="font-bold">{index + 1}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium" style={score.style}>
                  {score.username}
                </p>
                <p className="text-sm text-muted-foreground">
                  {gameId === "snake" || gameId === "runner" ? `${score.score} Punkte` : `${score.score} Punkte`}
                </p>
              </div>
              {index === 0 && (
                <div className="ml-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                </div>
              )}
              {index === 1 && (
                <div className="ml-2">
                  <Trophy className="h-5 w-5 text-gray-300" />
                </div>
              )}
              {index === 2 && (
                <div className="ml-2">
                  <Trophy className="h-5 w-5 text-amber-700" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
