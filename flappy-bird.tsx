"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Palette } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateCoins, getUser } from "@/lib/auth"

const CANVAS_WIDTH = 320
const CANVAS_HEIGHT = 480
const BIRD_SIZE = 25
const PIPE_WIDTH = 50
const PIPE_GAP = 180
const GRAVITY = 0.25
const JUMP_FORCE = -6
const PIPE_SPEED = 2
const FIRST_PIPE_DISTANCE = 250

interface Pipe {
  x: number
  topHeight: number
  bottomY: number
  passed: boolean
}

interface Bird {
  x: number
  y: number
  velocity: number
}

interface Coin {
  x: number
  y: number
  collected: boolean
  rotation: number
}

interface FlappyBirdProps {
  username?: string
  onGameEnd?: (score: number) => void
}

const BIRD_SKINS = [
  { id: "classic", name: "Classic Bird", color: "#FFD700", cost: 0, unlocked: true },
  { id: "red", name: "Red Phoenix", color: "#FF4444", cost: 50, unlocked: false },
  { id: "blue", name: "Blue Jay", color: "#4444FF", cost: 100, unlocked: false },
  { id: "green", name: "Green Parrot", color: "#44FF44", cost: 150, unlocked: false },
  { id: "purple", name: "Purple Eagle", color: "#AA44FF", cost: 200, unlocked: false },
  { id: "rainbow", name: "Rainbow Bird", color: "rainbow", cost: 500, unlocked: false },
]

export default function FlappyBird({ username, onGameEnd }: FlappyBirdProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [showSkinShop, setShowSkinShop] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [totalCoins, setTotalCoins] = useState(0)
  const [currentSkin, setCurrentSkin] = useState("classic")
  const [unlockedSkins, setUnlockedSkins] = useState(["classic"])

  const [bird, setBird] = useState<Bird>({
    x: 80,
    y: CANVAS_HEIGHT / 2,
    velocity: 0,
  })

  const [pipes, setPipes] = useState<Pipe[]>([])
  const [gameCoins, setGameCoins] = useState<Coin[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const savedHighScore = localStorage.getItem("flappybird-highscore")
    const savedCurrentSkin = localStorage.getItem(`${username}_flappybird_skin`)

    if (savedHighScore) setHighScore(Number.parseInt(savedHighScore))
    if (savedCurrentSkin) setCurrentSkin(savedCurrentSkin)

    if (username) {
      const user = getUser(username)
      if (user) {
        setTotalCoins(user.coins)
      }

      const savedSkins = localStorage.getItem(`${username}_flappybird_skins`)
      if (savedSkins) {
        setUnlockedSkins(JSON.parse(savedSkins))
      }
    }
  }, [username])

  const createPipe = useCallback((x: number): { pipe: Pipe; coin: Coin } => {
    const topHeight = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 150) + 75
    const pipe: Pipe = {
      x,
      topHeight,
      bottomY: topHeight + PIPE_GAP,
      passed: false,
    }

    const coin: Coin = {
      x: x + PIPE_WIDTH / 2,
      y: topHeight + PIPE_GAP / 2,
      collected: false,
      rotation: 0,
    }

    return { pipe, coin }
  }, [])

  const jump = useCallback(() => {
    if (!isPlaying || isPaused || gameOver || countdown > 0) return
    setBird((prev) => ({ ...prev, velocity: JUMP_FORCE }))
  }, [isPlaying, isPaused, gameOver, countdown])

  const checkCollision = useCallback((birdPos: Bird, pipeList: Pipe[]): boolean => {
    if (birdPos.y <= 0 || birdPos.y >= CANVAS_HEIGHT - BIRD_SIZE) {
      return true
    }

    for (const pipe of pipeList) {
      const birdLeft = birdPos.x + 6
      const birdRight = birdPos.x + BIRD_SIZE - 6
      const birdTop = birdPos.y + 6
      const birdBottom = birdPos.y + BIRD_SIZE - 6

      if (
        birdRight > pipe.x &&
        birdLeft < pipe.x + PIPE_WIDTH &&
        (birdTop < pipe.topHeight || birdBottom > pipe.bottomY)
      ) {
        return true
      }
    }

    return false
  }, [])

  const startGame = useCallback(() => {
    setBird({
      x: 80,
      y: CANVAS_HEIGHT / 2,
      velocity: 0,
    })

    const { pipe, coin } = createPipe(CANVAS_WIDTH + FIRST_PIPE_DISTANCE)
    setPipes([pipe])
    setGameCoins([coin])
    setScore(0)
    setGameOver(false)
    setIsPaused(false)

    setCountdown(3)
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setIsPlaying(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [createPipe])

  const togglePause = useCallback(() => {
    if (isPlaying && !gameOver && countdown === 0) {
      setIsPaused((prev) => !prev)
    }
  }, [isPlaying, gameOver, countdown])

  const buySkin = useCallback(
    (skinId: string) => {
      const skin = BIRD_SKINS.find((s) => s.id === skinId)
      if (!skin || unlockedSkins.includes(skinId) || totalCoins < skin.cost || !username) return

      updateCoins(username, -skin.cost)
      setTotalCoins((prev) => prev - skin.cost)

      const newUnlockedSkins = [...unlockedSkins, skinId]
      setUnlockedSkins(newUnlockedSkins)
      setCurrentSkin(skinId)

      localStorage.setItem(`${username}_flappybird_skins`, JSON.stringify(newUnlockedSkins))
      localStorage.setItem(`${username}_flappybird_skin`, skinId)

      toast({
        title: "Skin gekauft!",
        description: `${skin.name} wurde freigeschaltet!`,
        variant: "default",
      })
    },
    [totalCoins, unlockedSkins, username, toast],
  )

  const gameLoop = useCallback(() => {
    if (!isPlaying || isPaused || gameOver || countdown > 0) return

    setBird((prev) => {
      const newBird = {
        ...prev,
        y: prev.y + prev.velocity,
        velocity: Math.min(prev.velocity + GRAVITY, 8),
      }
      return newBird
    })

    setPipes((prev) => {
      let newPipes = prev.map((pipe) => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
      newPipes = newPipes.filter((pipe) => pipe.x > -PIPE_WIDTH)

      if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < CANVAS_WIDTH - 200) {
        const { pipe } = createPipe(CANVAS_WIDTH)
        newPipes.push(pipe)
      }

      return newPipes
    })

    setGameCoins((prev) => {
      let newCoins = prev.map((coin) => ({
        ...coin,
        x: coin.x - PIPE_SPEED,
        rotation: coin.rotation + 5,
      }))
      newCoins = newCoins.filter((coin) => coin.x > -20)

      if (pipes.length > gameCoins.length) {
        const lastPipe = pipes[pipes.length - 1]
        if (lastPipe) {
          const { coin } = createPipe(lastPipe.x)
          newCoins.push(coin)
        }
      }

      return newCoins
    })

    setPipes((prev) => {
      return prev.map((pipe) => {
        if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
          setScore((s) => s + 1)
          return { ...pipe, passed: true }
        }
        return pipe
      })
    })

    setGameCoins((prev) => {
      return prev.map((coin) => {
        if (
          !coin.collected &&
          Math.abs(coin.x - (bird.x + BIRD_SIZE / 2)) < 20 &&
          Math.abs(coin.y - (bird.y + BIRD_SIZE / 2)) < 20
        ) {
          if (username) {
            updateCoins(username, 1)
            setTotalCoins((c) => c + 1)
          }
          return { ...coin, collected: true }
        }
        return coin
      })
    })

    if (checkCollision(bird, pipes)) {
      setGameOver(true)
      setIsPlaying(false)

      if (score > highScore) {
        setHighScore(score)
        localStorage.setItem("flappybird-highscore", score.toString())
        toast({
          title: "Neuer Rekord!",
          description: `Neuer Highscore: ${score}`,
          variant: "default",
        })
      }

      if (onGameEnd) {
        onGameEnd(score)
      }
    }
  }, [
    isPlaying,
    isPaused,
    gameOver,
    countdown,
    bird,
    pipes,
    gameCoins,
    score,
    highScore,
    checkCollision,
    createPipe,
    onGameEnd,
    toast,
    username,
  ])

  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver && countdown === 0) {
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
  }, [isPlaying, isPaused, gameOver, countdown, gameLoop])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
    gradient.addColorStop(0, "#87CEEB")
    gradient.addColorStop(1, "#98FB98")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.fillStyle = "#228B22"
    pipes.forEach((pipe) => {
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight)
      ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, CANVAS_HEIGHT - pipe.bottomY)

      ctx.strokeStyle = "#006400"
      ctx.lineWidth = 2
      ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight)
      ctx.strokeRect(pipe.x, pipe.bottomY, PIPE_WIDTH, CANVAS_HEIGHT - pipe.bottomY)
    })

    gameCoins.forEach((coin) => {
      if (!coin.collected) {
        ctx.save()
        ctx.translate(coin.x, coin.y)
        ctx.rotate((coin.rotation * Math.PI) / 180)

        ctx.fillStyle = "#FFD700"
        ctx.fillRect(-8, -8, 16, 16)

        ctx.strokeStyle = "#FFA500"
        ctx.lineWidth = 2
        ctx.strokeRect(-8, -8, 16, 16)

        ctx.fillStyle = "#FFF"
        ctx.font = "10px Arial"
        ctx.textAlign = "center"
        ctx.fillText("$", 0, 3)

        ctx.restore()
      }
    })

    const currentSkinData = BIRD_SKINS.find((s) => s.id === currentSkin)
    if (currentSkinData?.color === "rainbow") {
      const rainbowGradient = ctx.createLinearGradient(bird.x, bird.y, bird.x + BIRD_SIZE, bird.y + BIRD_SIZE)
      rainbowGradient.addColorStop(0, "#FF0000")
      rainbowGradient.addColorStop(0.16, "#FF8000")
      rainbowGradient.addColorStop(0.33, "#FFFF00")
      rainbowGradient.addColorStop(0.5, "#00FF00")
      rainbowGradient.addColorStop(0.66, "#0080FF")
      rainbowGradient.addColorStop(0.83, "#8000FF")
      rainbowGradient.addColorStop(1, "#FF0080")
      ctx.fillStyle = rainbowGradient
    } else {
      ctx.fillStyle = currentSkinData?.color || "#FFD700"
    }

    ctx.fillRect(bird.x, bird.y, BIRD_SIZE, BIRD_SIZE)

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
    ctx.fillRect(bird.x + 4, bird.y + 4, BIRD_SIZE - 8, BIRD_SIZE - 8)

    ctx.fillStyle = "#000"
    ctx.fillRect(bird.x + 16, bird.y + 6, 4, 4)

    ctx.fillStyle = "#FF4500"
    ctx.fillRect(bird.x + BIRD_SIZE, bird.y + 10, 6, 5)

    ctx.fillStyle = "#000"
    ctx.font = "bold 16px Arial"
    ctx.textAlign = "left"
    ctx.fillText(`${score}`, 10, 25)
    ctx.fillText(`${totalCoins}`, 10, 45)

    if (!isPlaying && !gameOver && countdown === 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(CANVAS_WIDTH / 2 - 60, CANVAS_HEIGHT / 2 - 25, 120, 50)

      ctx.strokeStyle = "#00FF00"
      ctx.lineWidth = 2
      ctx.strokeRect(CANVAS_WIDTH / 2 - 60, CANVAS_HEIGHT / 2 - 25, 120, 50)

      ctx.fillStyle = "#00FF00"
      ctx.font = "bold 16px Arial"
      ctx.textAlign = "center"
      ctx.fillText("START", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5)
    }

    if (countdown > 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = "#FFD700"
      ctx.font = "bold 60px Arial"
      ctx.textAlign = "center"
      ctx.fillText(countdown.toString(), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15)

      ctx.fillStyle = "#FFF"
      ctx.font = "bold 16px Arial"
      ctx.fillText("Bereit?", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)
    }

    if (gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = "#FF0000"
      ctx.font = "bold 28px Arial"
      ctx.textAlign = "center"
      ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15)

      ctx.fillStyle = "#FFF"
      ctx.font = "bold 16px Arial"
      ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15)
    }

    if (isPaused && isPlaying) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = "#FFF"
      ctx.font = "bold 28px Arial"
      ctx.textAlign = "center"
      ctx.fillText("PAUSE", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    }
  }, [bird, pipes, gameCoins, score, highScore, totalCoins, gameOver, isPaused, isPlaying, countdown, currentSkin])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case " ":
        case "ArrowUp":
          event.preventDefault()
          jump()
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
  }, [jump, togglePause])

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const scaleX = CANVAS_WIDTH / rect.width
      const scaleY = CANVAS_HEIGHT / rect.height
      const clickX = x * scaleX
      const clickY = y * scaleY

      if (!isPlaying && !gameOver && countdown === 0) {
        if (
          clickX >= CANVAS_WIDTH / 2 - 60 &&
          clickX <= CANVAS_WIDTH / 2 + 60 &&
          clickY >= CANVAS_HEIGHT / 2 - 25 &&
          clickY <= CANVAS_HEIGHT / 2 + 25
        ) {
          startGame()
          return
        }
      }

      jump()
    },
    [isPlaying, gameOver, countdown, startGame, jump],
  )

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      <div className="flex justify-between w-full px-2 py-2 bg-black/30 rounded-t-lg text-sm">
        <div className="text-green-300">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
        <div className="text-green-300">
          Best: <span className="text-orange-400 font-bold">{highScore}</span>
        </div>
        <div className="text-green-300">
          Coins: <span className="text-yellow-400 font-bold">{totalCoins}</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-green-500/50 cursor-pointer bg-sky-200 w-full"
        onClick={handleCanvasClick}
        style={{ maxWidth: "100%", height: "auto", touchAction: "manipulation" }}
      />

      <div className="flex gap-2 flex-wrap justify-center mt-2 w-full px-2">
        {!isPlaying && !gameOver && countdown === 0 && (
          <Button onClick={startGame} size="sm" className="game-button text-xs">
            <Play className="h-3 w-3 mr-1" />
            Start
          </Button>
        )}

        {isPlaying && countdown === 0 && (
          <Button onClick={togglePause} size="sm" className="game-button text-xs">
            {isPaused ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
            {isPaused ? "Weiter" : "Pause"}
          </Button>
        )}

        {gameOver && (
          <Button
            onClick={startGame}
            size="sm"
            variant="outline"
            className="border-green-500 text-green-300 hover:bg-green-900/30 bg-transparent text-xs"
          >
            Nochmal
          </Button>
        )}

        {username && (
          <Button
            onClick={() => setShowSkinShop(!showSkinShop)}
            size="sm"
            variant="outline"
            className="border-purple-500 text-purple-300 hover:bg-purple-900/30 bg-transparent text-xs"
          >
            <Palette className="h-3 w-3 mr-1" />
            Skins
          </Button>
        )}
      </div>

      {showSkinShop && username && (
        <div className="w-full mt-2 p-2 bg-purple-900/30 border border-purple-700/50 rounded-lg">
          <h3 className="text-sm font-bold text-purple-300 mb-2 text-center">Skins</h3>
          <div className="grid grid-cols-3 gap-1">
            {BIRD_SKINS.map((skin) => (
              <div key={skin.id} className="p-1 bg-black/30 rounded border border-gray-600 text-center">
                <div
                  className="w-6 h-6 rounded mx-auto mb-1"
                  style={{
                    backgroundColor: skin.color === "rainbow" ? "#FF0000" : skin.color,
                    background:
                      skin.color === "rainbow"
                        ? "linear-gradient(45deg, #FF0000, #FF8000, #FFFF00, #00FF00, #0080FF, #8000FF)"
                        : skin.color,
                  }}
                />
                <span className="text-xs text-white block truncate">{skin.name.split(" ")[0]}</span>
                {unlockedSkins.includes(skin.id) ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setCurrentSkin(skin.id)
                      localStorage.setItem(`${username}_flappybird_skin`, skin.id)
                    }}
                    className={`w-full h-5 text-xs mt-1 ${currentSkin === skin.id ? "bg-green-600" : "bg-blue-600"}`}
                  >
                    {currentSkin === skin.id ? "✓" : "Wählen"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => buySkin(skin.id)}
                    disabled={totalCoins < skin.cost}
                    className="w-full h-5 text-xs mt-1 bg-yellow-600 hover:bg-yellow-700"
                  >
                    {skin.cost}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
