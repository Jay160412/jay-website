"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { saveHighscore, updateMissionProgress } from "@/lib/auth"
import { Trophy, RotateCcw } from "lucide-react"

interface MemoryProps {
  username?: string
}

interface MemoryCard {
  id: number
  emoji: string
  isFlipped: boolean
  isMatched: boolean
}

export default function Memory({ username }: MemoryProps) {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [bestScore, setBestScore] = useState<number | null>(null)
  const [isStarted, setIsStarted] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [timer, setTimer] = useState<number | null>(null)

  const cardsRef = useRef(cards)
  cardsRef.current = cards

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null)

  const emojis = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"]

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
    }
  }, [])

  const initializeGame = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current)

    const shuffledEmojis = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }))

    setCards(shuffledEmojis)
    setFlippedCards([])
    setMoves(0)
    setGameOver(false)
    setIsStarted(true)
    setTimer(null)
    setIsLocked(false)
  }

  const flipCard = (id: number) => {
    if (isLocked || flippedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched || timer !== null) {
      return
    }

    const newCards = [...cards]
    newCards[id].isFlipped = true
    setCards(newCards)
    setFlippedCards((prev) => [...prev, id])
  }

  useEffect(() => {
    if (flippedCards.length !== 2) return

    setIsLocked(true)

    const currentCards = cardsRef.current
    const [first, second] = flippedCards

    setMoves((prev) => prev + 1)

    if (currentCards[first].emoji === currentCards[second].emoji) {
      const newCards = [...currentCards]
      newCards[first].isMatched = true
      newCards[second].isMatched = true
      setCards(newCards)
      setFlippedCards([])
      setTimer(3)
      startCountdown()

      if (newCards.every((card) => card.isMatched)) {
        setGameOver(true)

        if (username) {
          const score = Math.max(100 - (moves + 1), 1) * 10

          if (bestScore === null || score > bestScore) {
            setBestScore(score)
            saveHighscore("memory", username, score)
          }

          updateMissionProgress(username, "memory", moves + 1)
        }
      }
    } else {
      timerRef.current = setTimeout(() => {
        const newCards = [...currentCards]
        newCards[first].isFlipped = false
        newCards[second].isFlipped = false
        setCards(newCards)
        setFlippedCards([])
        setTimer(3)
        startCountdown()
      }, 1000)
    }
  }, [flippedCards])

  const startCountdown = () => {
    let count = 3

    const countDown = () => {
      if (count > 0) {
        count--
        setTimer(count)
        lockTimerRef.current = setTimeout(countDown, 1000)
      } else {
        setTimer(null)
        setIsLocked(false)
      }
    }

    lockTimerRef.current = setTimeout(countDown, 1000)
  }

  return (
    <div className="flex flex-col items-center gap-2 p-2 w-full max-w-sm mx-auto">
      {/* Score bar - compact */}
      <div className="flex justify-between items-center w-full text-sm">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Züge</p>
          <p className="text-lg font-bold">{moves}</p>
        </div>
        {bestScore !== null && (
          <div className="text-center flex items-center gap-1">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <p className="text-lg font-bold">{bestScore}</p>
          </div>
        )}
      </div>

      {!isStarted ? (
        <div className="text-center space-y-3 py-4">
          <p className="text-sm">Finde alle Paare mit so wenig Zügen wie möglich!</p>
          <Button onClick={initializeGame} className="w-full h-10 game-button-3d">
            Spiel starten
          </Button>
        </div>
      ) : (
        <>
          <Card className="p-2 gaming-border relative w-full">
            {timer !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10 rounded-md">
                <div className="text-4xl font-bold text-white">{timer}</div>
              </div>
            )}
            <div className="grid grid-cols-4 gap-2">
              {cards.map((card) => (
                <button
                  key={card.id}
                  className={`
                    aspect-square flex items-center justify-center 
                    text-2xl rounded-lg cursor-pointer transition-all duration-300
                    touch-manipulation active:scale-95 min-h-[60px]
                    ${card.isFlipped || card.isMatched ? "bg-purple-700 text-white" : "bg-gray-700 text-transparent"}
                    ${card.isMatched ? "opacity-50" : ""}
                    ${!card.isFlipped && !card.isMatched ? "hover:bg-gray-600" : ""}
                  `}
                  onClick={() => flipCard(card.id)}
                  disabled={isLocked || card.isFlipped || card.isMatched || timer !== null}
                >
                  {card.isFlipped || card.isMatched ? card.emoji : "?"}
                </button>
              ))}
            </div>
          </Card>

          {gameOver ? (
            <div className="text-center space-y-2">
              <p className="text-sm">Geschafft in {moves} Zügen!</p>
              <Button onClick={initializeGame} className="w-full h-10 game-button-3d">
                <RotateCcw className="h-4 w-4 mr-2" />
                Nochmal
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={initializeGame} className="w-full h-10 bg-transparent">
              <RotateCcw className="h-4 w-4 mr-2" />
              Neu starten
            </Button>
          )}
        </>
      )}

      <p className="text-[10px] text-muted-foreground text-center">Tippe auf Karten um Paare zu finden</p>
    </div>
  )
}
