"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause, ArrowLeft, ArrowRight, Trophy, Star, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const CANVAS_WIDTH = 320
const CANVAS_HEIGHT = 400
const PADDLE_WIDTH = 60
const PADDLE_HEIGHT = 10
const BALL_SIZE = 8
const BRICK_WIDTH = 36
const BRICK_HEIGHT = 14
const BRICK_ROWS = 6
const BRICK_COLS = 8
const BRICK_PADDING = 3

interface Ball {
  x: number
  y: number
  dx: number
  dy: number
}

interface Paddle {
  x: number
  y: number
}

interface Brick {
  x: number
  y: number
  visible: boolean
  color: string
  points: number
}

interface BreakoutProps {
  username?: string
  onGameEnd?: (score: number) => void
}

export default function Breakout({ username, onGameEnd }: BreakoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [level, setLevel] = useState(1)

  const [ball, setBall] = useState<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 50,
    dx: 3,
    dy: -3,
  })

  const [paddle, setPaddle] = useState<Paddle>({
    x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: CANVAS_HEIGHT - 25,
  })

  const [bricks, setBricks] = useState<Brick[]>([])
  const { toast } = useToast()

  const createBricks = useCallback(() => {
    const newBricks: Brick[] = []
    const colors = ["#FF0000", "#FF4500", "#FFA500", "#FFFF00", "#00FF00", "#00CED1"]

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          x: col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_PADDING + 5,
          y: row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_PADDING + 40,
          visible: true,
          color: colors[row],
          points: (BRICK_ROWS - row) * 10,
        })
      }
    }
    return newBricks
  }, [])

  const ballRectCollision = useCallback((ball: Ball, rect: { x: number; y: number; width: number; height: number }) => {
    return (
      ball.x < rect.x + rect.width &&
      ball.x + BALL_SIZE > rect.x &&
      ball.y < rect.y + rect.height &&
      ball.y + BALL_SIZE > rect.y
    )
  }, [])

  const startGame = useCallback(() => {
    setBall({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 50,
      dx: 3 * level,
      dy: -3 * level,
    })
    setPaddle({
      x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
      y: CANVAS_HEIGHT - 25,
    })
    setBricks(createBricks())
    setScore(0)
    setLives(3)
    setLevel(1)
    setGameOver(false)
    setGameWon(false)
    setIsPlaying(true)
    setIsPaused(false)
  }, [createBricks, level])

  const togglePause = useCallback(() => {
    if (isPlaying && !gameOver && !gameWon) {
      setIsPaused((prev) => !prev)
    }
  }, [isPlaying, gameOver, gameWon])

  const movePaddle = useCallback((direction: "left" | "right") => {
    setPaddle((prev) => {
      let newX = prev.x
      if (direction === "left") {
        newX = Math.max(0, prev.x - 25)
      } else {
        newX = Math.min(CANVAS_WIDTH - PADDLE_WIDTH, prev.x + 25)
      }
      return { ...prev, x: newX }
    })
  }, [])

  const gameLoop = useCallback(() => {
    if (!isPlaying || isPaused || gameOver || gameWon) return

    setBall((prev) => {
      let newBall = { ...prev }

      newBall.x += newBall.dx
      newBall.y += newBall.dy

      if (newBall.x <= 0 || newBall.x >= CANVAS_WIDTH - BALL_SIZE) {
        newBall.dx = -newBall.dx
      }
      if (newBall.y <= 0) {
        newBall.dy = -newBall.dy
      }

      if (newBall.y >= CANVAS_HEIGHT) {
        setLives((prev) => {
          const newLives = prev - 1
          if (newLives <= 0) {
            setGameOver(true)
            setIsPlaying(false)
            if (onGameEnd) onGameEnd(score)
          }
          return newLives
        })

        newBall = {
          x: CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT - 50,
          dx: 3 * level,
          dy: -3 * level,
        }
      }

      if (ballRectCollision(newBall, { x: paddle.x, y: paddle.y, width: PADDLE_WIDTH, height: PADDLE_HEIGHT })) {
        newBall.dy = -Math.abs(newBall.dy)
        const hitPos = (newBall.x - paddle.x) / PADDLE_WIDTH
        newBall.dx = (hitPos - 0.5) * 6
      }

      return newBall
    })

    setBricks((prev) => {
      const newBricks = [...prev]
      let scoreIncrease = 0

      for (let i = 0; i < newBricks.length; i++) {
        const brick = newBricks[i]
        if (
          brick.visible &&
          ballRectCollision(ball, { x: brick.x, y: brick.y, width: BRICK_WIDTH, height: BRICK_HEIGHT })
        ) {
          brick.visible = false
          scoreIncrease += brick.points
          setBall((prev) => ({ ...prev, dy: -prev.dy }))
          break
        }
      }

      if (scoreIncrease > 0) {
        setScore((prev) => prev + scoreIncrease)
      }

      const visibleBricks = newBricks.filter((brick) => brick.visible)
      if (visibleBricks.length === 0) {
        setGameWon(true)
        setIsPlaying(false)
        const finalScore = score + scoreIncrease + lives * 100
        setScore(finalScore)
        if (onGameEnd) onGameEnd(finalScore)
      }

      return newBricks
    })
  }, [isPlaying, isPaused, gameOver, gameWon, ball, paddle, ballRectCollision, level, lives, score, onGameEnd])

  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver && !gameWon) {
      const animate = () => {
        gameLoop()
        animationRef.current = requestAnimationFrame(animate)
      }
      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, isPaused, gameOver, gameWon, gameLoop])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
    gradient.addColorStop(0, "#000428")
    gradient.addColorStop(1, "#004e92")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    bricks.forEach((brick) => {
      if (brick.visible) {
        ctx.fillStyle = brick.color
        ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT)
        ctx.strokeStyle = "#FFF"
        ctx.lineWidth = 0.5
        ctx.strokeRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT)
      }
    })

    ctx.fillStyle = "#FFF"
    ctx.fillRect(paddle.x, paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT)

    ctx.fillStyle = "#FFF"
    ctx.beginPath()
    ctx.arc(ball.x + BALL_SIZE / 2, ball.y + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()

    if (gameOver || gameWon) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = gameWon ? "#00FF00" : "#FF0000"
      ctx.font = "bold 24px Arial"
      ctx.textAlign = "center"
      ctx.fillText(gameWon ? "GEWONNEN!" : "GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)

      ctx.fillStyle = "#FFF"
      ctx.font = "bold 16px Arial"
      ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10)
    }

    if (isPaused && isPlaying) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = "#FFF"
      ctx.font = "bold 24px Arial"
      ctx.textAlign = "center"
      ctx.fillText("PAUSE", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    }
  }, [ball, paddle, bricks, score, lives, level, gameOver, gameWon, isPaused, isPlaying])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault()
          movePaddle("left")
          break
        case "ArrowRight":
          event.preventDefault()
          movePaddle("right")
          break
        case "p":
        case "P":
          event.preventDefault()
          togglePause()
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [movePaddle, togglePause])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (event: MouseEvent) => {
      if (!isPlaying || isPaused || gameOver || gameWon) return

      const rect = canvas.getBoundingClientRect()
      const scaleX = CANVAS_WIDTH / rect.width
      const mouseX = (event.clientX - rect.left) * scaleX

      setPaddle((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, mouseX - PADDLE_WIDTH / 2)),
      }))
    }

    canvas.addEventListener("mousemove", handleMouseMove)
    return () => canvas.removeEventListener("mousemove", handleMouseMove)
  }, [isPlaying, isPaused, gameOver, gameWon])

  useEffect(() => {
    setBricks(createBricks())
  }, [createBricks])

  return (
    <div className="flex flex-col items-center gap-2 p-2 w-full max-w-sm mx-auto">
      {/* Score bar - compact */}
      <div className="flex justify-between items-center w-full text-sm">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-400" />
          <span className="font-bold">{score}</span>
        </div>
        <div className="flex items-center gap-1">
          <Heart className="h-4 w-4 text-red-400" />
          <span>{lives}</span>
        </div>
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-purple-400" />
          <span>Lv.{level}</span>
        </div>
      </div>

      {/* Game Canvas */}
      <Card className="p-2 gaming-border">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-blue-500/50 rounded cursor-crosshair touch-none"
        />
      </Card>

      {/* Controls */}
      <div className="flex gap-2 w-full">
        {!isPlaying ? (
          <Button onClick={startGame} className="flex-1 h-10 game-button-3d">
            <Play className="h-4 w-4 mr-2" />
            {gameOver || gameWon ? "Nochmal" : "Start"}
          </Button>
        ) : (
          <Button onClick={togglePause} className="flex-1 h-10 game-button-3d">
            {isPaused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
            {isPaused ? "Weiter" : "Pause"}
          </Button>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex gap-2 w-full">
        <Button
          variant="outline"
          className="flex-1 h-12 bg-transparent"
          onMouseDown={() => movePaddle("left")}
          onTouchStart={() => movePaddle("left")}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Links
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-12 bg-transparent"
          onMouseDown={() => movePaddle("right")}
          onTouchStart={() => movePaddle("right")}
        >
          Rechts
          <ArrowRight className="h-5 w-5 ml-1" />
        </Button>
      </div>

      {/* Instructions */}
      <p className="text-[10px] text-muted-foreground text-center">Pfeiltasten, Maus oder Buttons zum Steuern</p>
    </div>
  )
}
