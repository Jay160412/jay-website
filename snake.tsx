"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Zap,
  Star,
  ShoppingBag,
} from "lucide-react"
import { saveHighscore, updateMissionProgress, getUserData, updateCoins } from "@/lib/auth"

const MOBILE_CANVAS_SIZE = 280
const MOBILE_GRID_SIZE = 14

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

interface SnakeProps {
  username?: string
  difficulty?: number
}

// Skin definitions
const SNAKE_SKINS = [
  { id: "classic", name: "Classic", color: "#22c55e", headColor: "#16a34a", price: 0 },
  { id: "neon", name: "Neon", color: "#00ffff", headColor: "#00cccc", price: 100 },
  { id: "fire", name: "Fire", color: "#ff4500", headColor: "#ff6600", price: 150 },
  { id: "ice", name: "Ice", color: "#87ceeb", headColor: "#4169e1", price: 150 },
  { id: "rainbow", name: "Rainbow", color: "#ff69b4", headColor: "#9400d3", price: 200 },
]

export default function Snake({ username, difficulty = 1 }: SnakeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [showSkinShop, setShowSkinShop] = useState(false)
  const [currentSkin, setCurrentSkin] = useState(SNAKE_SKINS[0])
  const [ownedSkins, setOwnedSkins] = useState<string[]>(["classic"])
  const [userCoins, setUserCoins] = useState(0)

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)

  const gameState = useRef({
    snake: [{ x: 7, y: 7 }],
    foods: [] as { x: number; y: number; type: string; points: number; color: string }[],
    direction: "RIGHT" as Direction,
    nextDirection: "RIGHT" as Direction,
    speed: 200 - difficulty * 20,
    baseSpeed: 200 - difficulty * 20,
    gridSize: MOBILE_GRID_SIZE,
    canvasSize: MOBILE_CANVAS_SIZE,
    lastFoodTime: 0,
    bonusFoodChance: 0.1,
    powerUpActive: false,
    powerUpType: null as string | null,
    powerUpEndTime: 0,
    growAmount: 1,
    particles: [] as { x: number; y: number; color: string; size: number; vx: number; vy: number; life: number }[],
  })

  // Load user data
  useEffect(() => {
    if (username) {
      const userData = getUserData(username)
      if (userData) {
        setUserCoins(userData.coins || 0)
        setOwnedSkins(userData.ownedSkins?.snake || ["classic"])
        const activeSkin = userData.activeSkins?.snake || "classic"
        const skin = SNAKE_SKINS.find((s) => s.id === activeSkin) || SNAKE_SKINS[0]
        setCurrentSkin(skin)
      }
    }
  }, [username])

  const startGame = useCallback(() => {
    gameState.current = {
      snake: [{ x: 7, y: 7 }],
      foods: [],
      direction: "RIGHT" as Direction,
      nextDirection: "RIGHT" as Direction,
      speed: 200 - difficulty * 20,
      baseSpeed: 200 - difficulty * 20,
      gridSize: MOBILE_GRID_SIZE,
      canvasSize: MOBILE_CANVAS_SIZE,
      lastFoodTime: Date.now(),
      bonusFoodChance: 0.1,
      powerUpActive: false,
      powerUpType: null,
      powerUpEndTime: 0,
      growAmount: 1,
      particles: [],
    }

    spawnFood()
    setScore(0)
    setIsPlaying(true)
    setIsPaused(false)
    setGameOver(false)
  }, [difficulty])

  const spawnFood = useCallback(() => {
    const { snake, foods, gridSize } = gameState.current
    let x, y
    do {
      x = Math.floor(Math.random() * gridSize)
      y = Math.floor(Math.random() * gridSize)
    } while (
      snake.some((segment) => segment.x === x && segment.y === y) ||
      foods.some((food) => food.x === x && food.y === y)
    )

    const foodTypes = [
      { type: "normal", points: 10, color: "#ef4444", chance: 0.7 },
      { type: "bonus", points: 25, color: "#fbbf24", chance: 0.2 },
      { type: "super", points: 50, color: "#a855f7", chance: 0.1 },
    ]

    const rand = Math.random()
    let cumulative = 0
    let selectedFood = foodTypes[0]

    for (const food of foodTypes) {
      cumulative += food.chance
      if (rand < cumulative) {
        selectedFood = food
        break
      }
    }

    gameState.current.foods.push({
      x,
      y,
      type: selectedFood.type,
      points: selectedFood.points,
      color: selectedFood.color,
    })
  }, [])

  const gameLoop = useCallback(() => {
    if (!isPlaying || isPaused || gameOver) return

    const state = gameState.current
    state.direction = state.nextDirection

    const head = { ...state.snake[0] }
    switch (state.direction) {
      case "UP":
        head.y -= 1
        break
      case "DOWN":
        head.y += 1
        break
      case "LEFT":
        head.x -= 1
        break
      case "RIGHT":
        head.x += 1
        break
    }

    // Wall collision
    if (head.x < 0 || head.x >= state.gridSize || head.y < 0 || head.y >= state.gridSize) {
      endGame()
      return
    }

    // Self collision
    if (state.snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
      endGame()
      return
    }

    state.snake.unshift(head)

    // Check food collision
    const foodIndex = state.foods.findIndex((food) => food.x === head.x && food.y === head.y)
    if (foodIndex !== -1) {
      const food = state.foods[foodIndex]
      setScore((prev) => prev + food.points)
      state.foods.splice(foodIndex, 1)

      // Add particles
      for (let i = 0; i < 8; i++) {
        state.particles.push({
          x: head.x * (state.canvasSize / state.gridSize) + state.canvasSize / state.gridSize / 2,
          y: head.y * (state.canvasSize / state.gridSize) + state.canvasSize / state.gridSize / 2,
          color: food.color,
          size: Math.random() * 4 + 2,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 30,
        })
      }

      if (state.foods.length === 0) {
        spawnFood()
      }

      // Spawn bonus food occasionally
      if (Math.random() < state.bonusFoodChance) {
        spawnFood()
      }
    } else {
      state.snake.pop()
    }

    draw()
  }, [isPlaying, isPaused, gameOver, spawnFood])

  const endGame = useCallback(() => {
    setIsPlaying(false)
    setGameOver(true)

    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current)
      gameLoopRef.current = null
    }

    if (username && score > 0) {
      if (score > highScore) {
        setHighScore(score)
        saveHighscore("snake", username, score)
      }
      updateMissionProgress(username, "snake", score)

      // Award coins
      const coinsEarned = Math.floor(score / 10)
      if (coinsEarned > 0) {
        updateCoins(username, coinsEarned)
        setUserCoins((prev) => prev + coinsEarned)
      }
    }
  }, [username, score, highScore])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const state = gameState.current
    const cellSize = state.canvasSize / state.gridSize

    // Clear canvas
    ctx.fillStyle = "#1a1a2e"
    ctx.fillRect(0, 0, state.canvasSize, state.canvasSize)

    // Draw grid
    ctx.strokeStyle = "#2a2a4e"
    ctx.lineWidth = 0.5
    for (let i = 0; i <= state.gridSize; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cellSize, 0)
      ctx.lineTo(i * cellSize, state.canvasSize)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * cellSize)
      ctx.lineTo(state.canvasSize, i * cellSize)
      ctx.stroke()
    }

    // Draw foods
    state.foods.forEach((food) => {
      ctx.fillStyle = food.color
      ctx.shadowColor = food.color
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2, cellSize / 2 - 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    })

    // Draw snake
    state.snake.forEach((segment, index) => {
      const isHead = index === 0
      ctx.fillStyle = isHead ? currentSkin.headColor : currentSkin.color
      ctx.shadowColor = currentSkin.color
      ctx.shadowBlur = isHead ? 15 : 5

      const padding = 1
      ctx.fillRect(
        segment.x * cellSize + padding,
        segment.y * cellSize + padding,
        cellSize - padding * 2,
        cellSize - padding * 2,
      )
      ctx.shadowBlur = 0
    })

    // Draw particles
    state.particles = state.particles.filter((p) => {
      p.x += p.vx
      p.y += p.vy
      p.life--
      p.size *= 0.95

      if (p.life > 0) {
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.life / 30
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
        return true
      }
      return false
    })
  }, [currentSkin])

  // Game loop
  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      gameLoopRef.current = setInterval(gameLoop, gameState.current.speed)
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = null
      }
    }
  }, [isPlaying, isPaused, gameOver, gameLoop])

  // Initial draw
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#1a1a2e"
        ctx.fillRect(0, 0, MOBILE_CANVAS_SIZE, MOBILE_CANVAS_SIZE)
      }
    }
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused) return

      const state = gameState.current
      switch (e.key) {
        case "ArrowUp":
          if (state.direction !== "DOWN") state.nextDirection = "UP"
          e.preventDefault()
          break
        case "ArrowDown":
          if (state.direction !== "UP") state.nextDirection = "DOWN"
          e.preventDefault()
          break
        case "ArrowLeft":
          if (state.direction !== "RIGHT") state.nextDirection = "LEFT"
          e.preventDefault()
          break
        case "ArrowRight":
          if (state.direction !== "LEFT") state.nextDirection = "RIGHT"
          e.preventDefault()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPlaying, isPaused])

  const handleTouchControl = (direction: Direction) => {
    if (!isPlaying || isPaused) return

    const state = gameState.current
    if (
      (direction === "UP" && state.direction !== "DOWN") ||
      (direction === "DOWN" && state.direction !== "UP") ||
      (direction === "LEFT" && state.direction !== "RIGHT") ||
      (direction === "RIGHT" && state.direction !== "LEFT")
    ) {
      state.nextDirection = direction
    }
  }

  const buySkin = (skin: (typeof SNAKE_SKINS)[0]) => {
    if (!username) return
    if (ownedSkins.includes(skin.id)) {
      setCurrentSkin(skin)
      const userData = getUserData(username)
      if (userData) {
        const extendedData = {
          ownedSkins: userData.ownedSkins,
          activeSkins: { ...userData.activeSkins, snake: skin.id },
        }
        localStorage.setItem(`user_${username}`, JSON.stringify(extendedData))
      }
      return
    }

    if (userCoins >= skin.price) {
      updateCoins(username, -skin.price)
      setUserCoins((prev) => prev - skin.price)
      const newOwned = [...ownedSkins, skin.id]
      setOwnedSkins(newOwned)
      setCurrentSkin(skin)

      const userData = getUserData(username)
      if (userData) {
        const extendedData = {
          ownedSkins: { ...userData.ownedSkins, snake: newOwned },
          activeSkins: { ...userData.activeSkins, snake: skin.id },
        }
        localStorage.setItem(`user_${username}`, JSON.stringify(extendedData))
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 p-2 w-full max-w-sm mx-auto">
      {/* Score bar - compact */}
      <div className="flex justify-between items-center w-full text-sm">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-400" />
          <span className="font-bold">{score}</span>
        </div>
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-purple-400" />
          <span>{highScore}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-4 w-4 text-yellow-400" />
          <span>{userCoins}</span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setShowSkinShop(!showSkinShop)}>
          <ShoppingBag className="h-4 w-4" />
        </Button>
      </div>

      {/* Skin Shop - compact */}
      {showSkinShop && (
        <Card className="w-full p-2 gaming-border">
          <div className="grid grid-cols-5 gap-1">
            {SNAKE_SKINS.map((skin) => (
              <button
                key={skin.id}
                onClick={() => buySkin(skin)}
                className={`p-1 rounded border-2 transition-all ${
                  currentSkin.id === skin.id
                    ? "border-yellow-400"
                    : ownedSkins.includes(skin.id)
                      ? "border-green-500/50"
                      : "border-gray-600"
                }`}
              >
                <div className="w-6 h-6 rounded mx-auto" style={{ backgroundColor: skin.color }} />
                <p className="text-[8px] mt-0.5 truncate">{skin.name}</p>
                {!ownedSkins.includes(skin.id) && <p className="text-[8px] text-yellow-400">{skin.price}</p>}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Game Canvas */}
      <Card className="p-2 gaming-border">
        <canvas
          ref={canvasRef}
          className="border border-purple-700/50 bg-gray-900 touch-none rounded"
          width={MOBILE_CANVAS_SIZE}
          height={MOBILE_CANVAS_SIZE}
        />
      </Card>

      {/* Game Over / Start */}
      {gameOver && (
        <div className="text-center py-2">
          <p className="text-lg font-bold text-red-400 mb-1">Game Over!</p>
          <p className="text-sm mb-2">Score: {score}</p>
        </div>
      )}

      {/* Controls */}
      {!isPlaying ? (
        <Button onClick={startGame} className="w-full h-10 game-button-3d">
          <Play className="h-4 w-4 mr-2" />
          {gameOver ? "Nochmal" : "Start"}
        </Button>
      ) : (
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1 h-10 bg-transparent" onClick={() => setIsPaused(!isPaused)}>
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button variant="outline" className="flex-1 h-10 bg-transparent" onClick={startGame}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Mobile Touch Controls - compact */}
      <div className="grid grid-cols-3 gap-1 w-full max-w-[160px]">
        <div className="col-start-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-10 game-button-3d bg-transparent"
            onClick={() => handleTouchControl("UP")}
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        </div>
        <div className="col-start-1 row-start-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-10 game-button-3d bg-transparent"
            onClick={() => handleTouchControl("LEFT")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="col-start-3 row-start-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-10 game-button-3d bg-transparent"
            onClick={() => handleTouchControl("RIGHT")}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="col-start-2 row-start-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-10 game-button-3d bg-transparent"
            onClick={() => handleTouchControl("DOWN")}
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Instructions - very compact */}
      <p className="text-[10px] text-muted-foreground text-center">Pfeiltasten oder Buttons zum Steuern</p>
    </div>
  )
}
