"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { saveHighscore, updateMissionProgress, updateCoins, getUser } from "@/lib/auth"
import { Coins, Palette } from "lucide-react"

interface RunnerProps {
  username?: string
}

// Verfügbare Skins
const SKINS = {
  default: {
    id: "default",
    name: "Cyber Cube",
    color: "#8b5cf6",
    trail: "#8b5cf6",
    cost: 0,
    unlocked: true,
  },
  neon: {
    id: "neon",
    name: "Neon Glow",
    color: "#00ff88",
    trail: "#00ff88",
    cost: 100,
    unlocked: false,
  },
  fire: {
    id: "fire",
    name: "Fire Dash",
    color: "#ff4444",
    trail: "#ff8800",
    cost: 200,
    unlocked: false,
  },
  ice: {
    id: "ice",
    name: "Ice Crystal",
    color: "#44aaff",
    trail: "#88ddff",
    cost: 300,
    unlocked: false,
  },
  rainbow: {
    id: "rainbow",
    name: "Rainbow Rush",
    color: "#ff00ff",
    trail: "rainbow",
    cost: 500,
    unlocked: false,
  },
}

export default function Runner({ username }: RunnerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>(0)
  const gameStateRef = useRef({
    isRunning: false,
    player: {
      x: 80,
      y: 225,
      width: 25,
      height: 25,
      velocityY: 0,
      isJumping: false,
      rotation: 0,
      targetRotation: 0,
      trail: [] as Array<{ x: number; y: number; alpha: number }>,
      onPlatform: false,
    },
    obstacles: [] as Array<{
      x: number
      y: number
      width: number
      height: number
      type: string
      moveY?: number
      moveSpeed?: number
      originalY?: number
    }>,
    platforms: [] as Array<{ x: number; y: number; width: number; height: number }>,
    coins: [] as Array<{ x: number; y: number; collected: boolean; rotation: number }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>,
    ground: 250,
    speed: 5,
    distance: 0,
    coinsCollected: 0,
    lastObstacleTime: 0,
    lastCoinTime: 0,
    backgroundOffset: 0,
    levelPattern: 0,
  })

  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [coinsCollected, setCoinsCollected] = useState(0)
  const [totalCoins, setTotalCoins] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSkin, setCurrentSkin] = useState("default")
  const [showSkinSelector, setShowSkinSelector] = useState(false)
  const [ownedSkins, setOwnedSkins] = useState<string[]>(["default"])

  // Load user data and high score on mount
  useEffect(() => {
    if (username && typeof window !== "undefined") {
      const scores = JSON.parse(localStorage.getItem("gameHighscores") || "{}")
      if (scores.runner) {
        const userScore = scores.runner.find((entry: any) => entry.username === username)
        if (userScore) {
          setHighScore(userScore.score)
        }
      }

      // Load user coins and skins
      const user = getUser(username)
      if (user) {
        setTotalCoins(user.coins)
        const savedSkins = localStorage.getItem(`${username}_ownedSkins`)
        if (savedSkins) {
          setOwnedSkins(JSON.parse(savedSkins))
        }
        const savedCurrentSkin = localStorage.getItem(`${username}_currentSkin`)
        if (savedCurrentSkin && savedSkins && JSON.parse(savedSkins).includes(savedCurrentSkin)) {
          setCurrentSkin(savedCurrentSkin)
        }
      }
    }
  }, [username])

  const createParticle = useCallback((x: number, y: number, color: string) => {
    const particles = gameStateRef.current.particles
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: x + Math.random() * 10 - 5,
        y: y + Math.random() * 10 - 5,
        vx: Math.random() * 6 - 3,
        vy: Math.random() * 6 - 3,
        life: 1,
        color: color,
      })
    }
  }, [])

  const generateLevelSection = useCallback(() => {
    const { obstacles, platforms, coins, ground, distance } = gameStateRef.current
    const startX = 450
    const pattern = Math.floor(distance / 200) % 7 // Reduziert auf 7 Patterns (ohne unmögliche Decke)

    // Münzen hinzufügen
    if (Math.random() < 0.7) {
      coins.push({
        x: startX + Math.random() * 100,
        y: ground - 60 - Math.random() * 80,
        collected: false,
        rotation: 0,
      })
    }

    switch (pattern) {
      case 0: // Einfache Spikes
        obstacles.push({
          x: startX,
          y: ground - 35,
          width: 25,
          height: 35,
          type: "spike",
        })
        break

      case 1: // Doppel-Spikes
        obstacles.push({
          x: startX,
          y: ground - 35,
          width: 25,
          height: 35,
          type: "spike",
        })
        obstacles.push({
          x: startX + 60,
          y: ground - 35,
          width: 25,
          height: 35,
          type: "spike",
        })
        break

      case 2: // Hohe Blöcke
        obstacles.push({
          x: startX,
          y: ground - 60,
          width: 30,
          height: 60,
          type: "block",
        })
        break

      case 3: // Bewegende Hindernisse
        obstacles.push({
          x: startX,
          y: ground - 40,
          width: 25,
          height: 40,
          type: "moving_spike",
          moveY: 0,
          moveSpeed: 2,
          originalY: ground - 40,
        })
        break

      case 4: // Plattform-Sprung
        platforms.push({
          x: startX,
          y: ground - 80,
          width: 60,
          height: 15,
        })
        obstacles.push({
          x: startX + 80,
          y: ground - 35,
          width: 25,
          height: 35,
          type: "spike",
        })
        break

      case 5: // Mehrere kleine Hindernisse
        for (let i = 0; i < 3; i++) {
          obstacles.push({
            x: startX + i * 50,
            y: ground - 25,
            width: 20,
            height: 25,
            type: "small_block",
          })
        }
        break

      case 6: // Komplexes Pattern mit Plattformen
        platforms.push({
          x: startX,
          y: ground - 60,
          width: 40,
          height: 15,
        })
        platforms.push({
          x: startX + 80,
          y: ground - 100,
          width: 40,
          height: 15,
        })
        obstacles.push({
          x: startX + 50,
          y: ground - 35,
          width: 25,
          height: 35,
          type: "spike",
        })
        obstacles.push({
          x: startX + 130,
          y: ground - 35,
          width: 25,
          height: 35,
          type: "spike",
        })
        break
    }
  }, [])

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { player, obstacles, platforms, coins, particles, ground, distance, backgroundOffset } = gameStateRef.current
    const skin = SKINS[currentSkin as keyof typeof SKINS]

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw animated background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "#0f0f23")
    gradient.addColorStop(0.5, "#1a1a3a")
    gradient.addColorStop(1, "#2d1b69")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw moving grid background
    ctx.strokeStyle = "#8b5cf6"
    ctx.lineWidth = 0.5
    ctx.globalAlpha = 0.2
    const gridSize = 40
    for (let x = (backgroundOffset % gridSize) - gridSize; x < canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Draw ground with glow effect
    const groundGradient = ctx.createLinearGradient(0, ground - 20, 0, canvas.height)
    groundGradient.addColorStop(0, "#8b5cf6")
    groundGradient.addColorStop(0.3, "#6d28d9")
    groundGradient.addColorStop(1, "#4c1d95")
    ctx.fillStyle = groundGradient
    ctx.fillRect(0, ground, canvas.width, canvas.height - ground)

    // Draw ground glow
    ctx.shadowColor = "#8b5cf6"
    ctx.shadowBlur = 15
    ctx.fillStyle = "#8b5cf6"
    ctx.fillRect(0, ground - 3, canvas.width, 3)
    ctx.shadowBlur = 0

    // Draw platforms
    platforms.forEach((platform) => {
      ctx.shadowColor = "#00ff88"
      ctx.shadowBlur = 10
      ctx.fillStyle = "#00ff88"
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height)

      // Platform glow top
      ctx.fillStyle = "#88ffaa"
      ctx.fillRect(platform.x, platform.y, platform.width, 3)
    })
    ctx.shadowBlur = 0

    // Draw player trail
    ctx.globalAlpha = 0.8
    for (let i = 0; i < player.trail.length; i++) {
      const trail = player.trail[i]
      ctx.globalAlpha = trail.alpha * 0.6
      ctx.fillStyle = skin.trail === "rainbow" ? `hsl(${(Date.now() / 10 + i * 10) % 360}, 100%, 50%)` : skin.trail
      ctx.fillRect(trail.x - 6, trail.y - 6, 12, 12)
    }
    ctx.globalAlpha = 1

    // Draw player with rotation and glow
    ctx.save()
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2)
    ctx.rotate(player.rotation)

    // Player glow
    ctx.shadowColor = skin.color
    ctx.shadowBlur = 20
    ctx.fillStyle = skin.color
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height)

    // Player inner glow
    ctx.shadowBlur = 8
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(-player.width / 2 + 4, -player.height / 2 + 4, player.width - 8, player.height - 8)

    ctx.restore()
    ctx.shadowBlur = 0

    // Draw obstacles with different types
    obstacles.forEach((obstacle) => {
      ctx.shadowColor = "#ff4444"
      ctx.shadowBlur = 12

      if (obstacle.type === "spike") {
        // Draw spike
        ctx.fillStyle = "#ff4444"
        ctx.beginPath()
        ctx.moveTo(obstacle.x, obstacle.y + obstacle.height)
        ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y)
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height)
        ctx.closePath()
        ctx.fill()

        // Spike highlight
        ctx.fillStyle = "#ff8888"
        ctx.beginPath()
        ctx.moveTo(obstacle.x + 3, obstacle.y + obstacle.height)
        ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y + 5)
        ctx.lineTo(obstacle.x + obstacle.width - 3, obstacle.y + obstacle.height)
        ctx.closePath()
        ctx.fill()
      } else if (obstacle.type === "moving_spike") {
        // Draw moving spike
        ctx.fillStyle = "#ff6666"
        ctx.beginPath()
        ctx.moveTo(obstacle.x, obstacle.y + obstacle.height)
        ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y)
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height)
        ctx.closePath()
        ctx.fill()
      } else {
        // Draw regular block
        ctx.fillStyle = "#ff4444"
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)

        // Block highlight
        ctx.fillStyle = "#ff8888"
        ctx.fillRect(obstacle.x + 2, obstacle.y + 2, obstacle.width - 4, obstacle.height - 4)
      }
    })
    ctx.shadowBlur = 0

    // Draw coins with rotation and glow
    coins.forEach((coin) => {
      if (!coin.collected) {
        ctx.save()
        ctx.translate(coin.x + 10, coin.y + 10)
        ctx.rotate(coin.rotation)

        ctx.shadowColor = "#ffd700"
        ctx.shadowBlur = 15
        ctx.fillStyle = "#ffd700"
        ctx.beginPath()
        ctx.arc(0, 0, 10, 0, Math.PI * 2)
        ctx.fill()

        // Inner shine
        ctx.fillStyle = "#ffff88"
        ctx.beginPath()
        ctx.arc(-3, -3, 4, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      }
    })
    ctx.shadowBlur = 0

    // Draw particles
    particles.forEach((particle) => {
      ctx.globalAlpha = particle.life
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1

    // Draw UI with glow effects
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 16px Arial"
    ctx.shadowColor = "#8b5cf6"
    ctx.shadowBlur = 8
    ctx.fillText(`Score: ${Math.floor(distance)}`, 10, 25)
    ctx.fillText(`Coins: ${gameStateRef.current.coinsCollected}`, 10, 50)
    ctx.shadowBlur = 0
  }, [currentSkin])

  const gameLoop = useCallback(() => {
    if (!gameStateRef.current.isRunning) return

    const { player, obstacles, platforms, coins, particles, ground, speed } = gameStateRef.current

    // Update background
    gameStateRef.current.backgroundOffset += speed

    // Check if player is on a platform
    let onPlatform = false
    let platformY = ground

    // Check platform collisions only when falling down
    if (player.velocityY >= 0) {
      platforms.forEach((platform) => {
        if (
          player.x + player.width > platform.x &&
          player.x < platform.x + platform.width &&
          player.y + player.height >= platform.y &&
          player.y + player.height <= platform.y + platform.height + 10 &&
          player.velocityY >= 0
        ) {
          onPlatform = true
          platformY = platform.y
        }
      })
    }

    // Update player physics
    if (player.isJumping || (!onPlatform && player.y + player.height < ground)) {
      player.velocityY += 0.8 // gravity
      player.y += player.velocityY

      // Smooth rotation towards target
      const rotDiff = player.targetRotation - player.rotation
      player.rotation += rotDiff * 0.15

      // Check if landed on ground
      if (player.y + player.height >= ground) {
        player.y = ground - player.height
        player.isJumping = false
        player.velocityY = 0
        player.targetRotation = 0
        player.onPlatform = false
      }
      // Check if landed on platform
      else if (onPlatform && player.velocityY >= 0) {
        player.y = platformY - player.height
        player.isJumping = false
        player.velocityY = 0
        player.targetRotation = 0
        player.onPlatform = true
      }
    } else {
      // Player is on ground or platform
      if (onPlatform) {
        player.y = platformY - player.height
        player.onPlatform = true
      } else {
        player.y = ground - player.height
        player.onPlatform = false
      }

      // Smooth rotation back to 0 when on ground/platform
      player.rotation += (0 - player.rotation) * 0.2
    }

    // If player moves off platform edge, start falling
    if (player.onPlatform && !onPlatform) {
      player.isJumping = true
      player.velocityY = 0
      player.onPlatform = false
    }

    // Update player trail
    player.trail.unshift({ x: player.x, y: player.y, alpha: 1 })
    if (player.trail.length > 10) {
      player.trail.pop()
    }
    player.trail.forEach((trail, index) => {
      trail.alpha = 1 - index / player.trail.length
    })

    // Update moving obstacles
    obstacles.forEach((obstacle) => {
      if (obstacle.type === "moving_spike" && obstacle.originalY !== undefined) {
        obstacle.moveY = (obstacle.moveY || 0) + (obstacle.moveSpeed || 2)
        obstacle.y = obstacle.originalY + Math.sin(obstacle.moveY * 0.05) * 30
      }
    })

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obstacle = obstacles[i]
      obstacle.x -= speed

      // Check collision
      if (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y < obstacle.y + obstacle.height &&
        player.y + player.height > obstacle.y
      ) {
        // Create explosion particles
        createParticle(player.x + player.width / 2, player.y + player.height / 2, "#ff4444")
        endGame()
        return
      }

      // Remove off-screen obstacles
      if (obstacle.x + obstacle.width < 0) {
        obstacles.splice(i, 1)
      }
    }

    // Update platforms
    for (let i = platforms.length - 1; i >= 0; i--) {
      const platform = platforms[i]
      platform.x -= speed

      // Remove off-screen platforms
      if (platform.x + platform.width < 0) {
        platforms.splice(i, 1)
      }
    }

    // Update coins
    for (let i = coins.length - 1; i >= 0; i--) {
      const coin = coins[i]
      coin.x -= speed
      coin.rotation += 0.15

      // Check coin collection
      if (
        !coin.collected &&
        player.x < coin.x + 20 &&
        player.x + player.width > coin.x &&
        player.y < coin.y + 20 &&
        player.y + player.height > coin.y
      ) {
        coin.collected = true
        gameStateRef.current.coinsCollected++
        setCoinsCollected(gameStateRef.current.coinsCollected)

        // Create coin particles
        createParticle(coin.x + 10, coin.y + 10, "#ffd700")
      }

      // Remove off-screen coins
      if (coin.x + 20 < 0) {
        coins.splice(i, 1)
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i]
      particle.x += particle.vx
      particle.y += particle.vy
      particle.life -= 0.025
      particle.vy += 0.15 // gravity

      if (particle.life <= 0) {
        particles.splice(i, 1)
      }
    }

    // Generate new level sections
    const now = Date.now()
    if (now - gameStateRef.current.lastObstacleTime > 800 + Math.random() * 600) {
      generateLevelSection()
      gameStateRef.current.lastObstacleTime = now
    }

    // Update distance and speed
    gameStateRef.current.distance += speed * 0.15
    gameStateRef.current.speed = Math.min(5 + gameStateRef.current.distance * 0.002, 9)
    setScore(Math.floor(gameStateRef.current.distance))

    // Draw everything
    drawGame()

    // Continue loop
    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [drawGame, createParticle, generateLevelSection])

  const startGame = useCallback(() => {
    // Reset game state
    gameStateRef.current = {
      isRunning: true,
      player: {
        x: 80,
        y: 225,
        width: 25,
        height: 25,
        velocityY: 0,
        isJumping: false,
        rotation: 0,
        targetRotation: 0,
        trail: [],
        onPlatform: false,
      },
      obstacles: [],
      platforms: [],
      coins: [],
      particles: [],
      ground: 250,
      speed: 5,
      distance: 0,
      coinsCollected: 0,
      lastObstacleTime: Date.now(),
      lastCoinTime: Date.now(),
      backgroundOffset: 0,
      levelPattern: 0,
    }

    setScore(0)
    setCoinsCollected(0)
    setIsGameOver(false)
    setIsPlaying(true)

    // Start game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [gameLoop])

  const endGame = useCallback(() => {
    gameStateRef.current.isRunning = false
    setIsPlaying(false)
    setIsGameOver(true)

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Save high score and coins
    if (username) {
      const finalScore = Math.floor(gameStateRef.current.distance)
      const coinsEarned = gameStateRef.current.coinsCollected

      if (finalScore > highScore) {
        setHighScore(finalScore)
        saveHighscore("runner", username, finalScore)
      }

      // Add coins to user account
      if (coinsEarned > 0) {
        updateCoins(username, coinsEarned)
        setTotalCoins((prev) => prev + coinsEarned)
      }

      updateMissionProgress(username, "runner", finalScore)
    }
  }, [username, highScore])

  const jump = useCallback(() => {
    const { player, ground } = gameStateRef.current

    // Check if player can jump (on ground or platform)
    const canJump =
      !player.isJumping &&
      (player.y + player.height >= ground - 5 || // On ground
        player.onPlatform) // On platform

    if (canJump) {
      player.velocityY = -16
      player.isJumping = true
      player.onPlatform = false
      player.targetRotation = Math.PI / 2 // 90 Grad Rotation beim Sprung
    }
  }, [])

  const buySkin = useCallback(
    (skinId: string) => {
      const skin = SKINS[skinId as keyof typeof SKINS]
      if (username && totalCoins >= skin.cost && !ownedSkins.includes(skinId)) {
        updateCoins(username, -skin.cost)
        setTotalCoins((prev) => prev - skin.cost)

        const newOwnedSkins = [...ownedSkins, skinId]
        setOwnedSkins(newOwnedSkins)
        localStorage.setItem(`${username}_ownedSkins`, JSON.stringify(newOwnedSkins))

        setCurrentSkin(skinId)
        localStorage.setItem(`${username}_currentSkin`, skinId)
      }
    },
    [username, totalCoins, ownedSkins],
  )

  const selectSkin = useCallback(
    (skinId: string) => {
      if (ownedSkins.includes(skinId)) {
        setCurrentSkin(skinId)
        if (username) {
          localStorage.setItem(`${username}_currentSkin`, skinId)
        }
      }
    },
    [ownedSkins, username],
  )

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "ArrowUp") {
        e.preventDefault()
        if (isPlaying) {
          jump()
        } else if (!isPlaying && !isGameOver) {
          startGame()
        } else if (isGameOver) {
          startGame()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPlaying, isGameOver, jump, startGame])

  // Initial draw
  useEffect(() => {
    drawGame()
  }, [drawGame])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex justify-between items-center w-full max-w-md">
        <div>
          <p className="text-sm text-muted-foreground">Punkte</p>
          <p className="text-2xl font-bold">{score}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Highscore</p>
          <p className="text-2xl font-bold">{highScore}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Münzen</p>
          <p className="text-2xl font-bold text-yellow-500">{totalCoins}</p>
        </div>
      </div>

      {username && (
        <div className="flex gap-2">
          <Button
            onClick={() => setShowSkinSelector(!showSkinSelector)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Palette className="h-4 w-4" />
            Skins
          </Button>
        </div>
      )}

      {showSkinSelector && (
        <div className="bg-gray-800 rounded-lg p-4 w-full max-w-md">
          <h3 className="text-lg font-bold mb-4 text-center">Skins auswählen</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(SKINS).map((skin) => {
              const owned = ownedSkins.includes(skin.id)
              const selected = currentSkin === skin.id
              const canAfford = totalCoins >= skin.cost

              return (
                <div
                  key={skin.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    selected ? "border-purple-500 bg-purple-900/30" : "border-gray-600"
                  }`}
                  onClick={() => (owned ? selectSkin(skin.id) : canAfford ? buySkin(skin.id) : null)}
                >
                  <div
                    className="w-8 h-8 mx-auto mb-2 rounded"
                    style={{
                      backgroundColor: skin.color,
                      boxShadow: `0 0 10px ${skin.color}`,
                    }}
                  />
                  <p className="text-sm font-medium text-center">{skin.name}</p>
                  {!owned && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Coins className="h-3 w-3 text-yellow-500" />
                      <span className={`text-xs ${canAfford ? "text-yellow-500" : "text-red-500"}`}>{skin.cost}</span>
                    </div>
                  )}
                  {selected && <p className="text-xs text-purple-400 text-center mt-1">Aktiv</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="border border-purple-700/50 rounded-lg bg-gray-900 cursor-pointer"
          onClick={isPlaying ? jump : startGame}
        />

        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-white">Cyber Runner</h3>
            <Button onClick={startGame} className="mb-2">
              Spiel starten
            </Button>
            <p className="text-sm text-gray-300 text-center">Springe über Hindernisse und sammle Münzen!</p>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
            <h3 className="text-xl font-bold mb-2 text-white">Game Over</h3>
            <p className="text-lg mb-2 text-white">Score: {score}</p>
            <p className="text-md mb-4 text-yellow-500">Münzen: +{coinsCollected}</p>
            <Button onClick={startGame}>Erneut spielen</Button>
          </div>
        )}
      </div>

      {isPlaying && (
        <Button onClick={jump} className="w-full max-w-md">
          Springen
        </Button>
      )}

      <div className="text-sm text-muted-foreground text-center">
        <p>Springe über Hindernisse und sammle Münzen!</p>
        <p>Verwende die Leertaste, Klick oder den Button zum Springen.</p>
        <p>Nutze Plattformen um höhere Bereiche zu erreichen!</p>
      </div>
    </div>
  )
}
