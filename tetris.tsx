"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCw, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Tetris-Konstanten
const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const EMPTY_CELL = 0

const CELL_SIZE_MOBILE = 16
const CELL_SIZE_DESKTOP = 24

// Tetris-Teile (Tetrominoes)
const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "#00f5ff",
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#ffff00",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#800080",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: "#00ff00",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: "#ff0000",
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#0000ff",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#ffa500",
  },
}

const TETROMINO_KEYS = Object.keys(TETROMINOES) as Array<keyof typeof TETROMINOES>

interface TetrisProps {
  username?: string
  onGameEnd?: (score: number) => void
}

export default function Tetris({ username, onGameEnd }: TetrisProps) {
  const [board, setBoard] = useState<number[][]>(() =>
    Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(EMPTY_CELL)),
  )
  const [currentPiece, setCurrentPiece] = useState<any>(null)
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 })
  const [nextPiece, setNextPiece] = useState<any>(null)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [dropTime, setDropTime] = useState(1000)

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  const createRandomPiece = useCallback(() => {
    const randomKey = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)]
    return {
      shape: TETROMINOES[randomKey].shape,
      color: TETROMINOES[randomKey].color,
      type: randomKey,
    }
  }, [])

  const rotatePiece = useCallback((piece: any) => {
    const rotated = piece.shape[0].map((_: any, index: number) => piece.shape.map((row: any) => row[index]).reverse())
    return { ...piece, shape: rotated }
  }, [])

  const isValidPosition = useCallback(
    (piece: any, position: { x: number; y: number }, testBoard?: number[][]) => {
      const boardToTest = testBoard || board

      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x] !== 0) {
            const newX = position.x + x
            const newY = position.y + y

            if (
              newX < 0 ||
              newX >= BOARD_WIDTH ||
              newY >= BOARD_HEIGHT ||
              (newY >= 0 && boardToTest[newY][newX] !== EMPTY_CELL)
            ) {
              return false
            }
          }
        }
      }
      return true
    },
    [board],
  )

  const placePiece = useCallback((piece: any, position: { x: number; y: number }, targetBoard: number[][]) => {
    const newBoard = targetBoard.map((row) => [...row])

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] !== 0) {
          const boardY = position.y + y
          const boardX = position.x + x
          if (boardY >= 0) {
            newBoard[boardY][boardX] = piece.color
          }
        }
      }
    }
    return newBoard
  }, [])

  const clearLines = useCallback((boardToClear: number[][]) => {
    const newBoard = boardToClear.filter((row) => row.some((cell) => cell === EMPTY_CELL))
    const linesCleared = BOARD_HEIGHT - newBoard.length

    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(EMPTY_CELL))
    }

    return { newBoard, linesCleared }
  }, [])

  const calculateScore = useCallback((linesCleared: number, currentLevel: number) => {
    const basePoints = [0, 40, 100, 300, 1200]
    return basePoints[linesCleared] * currentLevel
  }, [])

  const spawnNewPiece = useCallback(() => {
    const piece = nextPiece || createRandomPiece()
    const startPosition = { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 }

    if (!isValidPosition(piece, startPosition)) {
      setGameOver(true)
      setIsPlaying(false)
      if (onGameEnd) {
        onGameEnd(score)
      }
      toast({
        title: "Game Over!",
        description: `Endpunktzahl: ${score}`,
        variant: "destructive",
      })
      return
    }

    setCurrentPiece(piece)
    setCurrentPosition(startPosition)
    setNextPiece(createRandomPiece())
  }, [nextPiece, createRandomPiece, isValidPosition, onGameEnd, score, toast])

  const dropPiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return

    const newPosition = { ...currentPosition, y: currentPosition.y + 1 }

    if (isValidPosition(currentPiece, newPosition)) {
      setCurrentPosition(newPosition)
    } else {
      const newBoard = placePiece(currentPiece, currentPosition, board)
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard)

      setBoard(clearedBoard)
      setLines((prev) => prev + linesCleared)
      setScore((prev) => prev + calculateScore(linesCleared, level))

      const newLevel = Math.floor((lines + linesCleared) / 10) + 1
      if (newLevel > level) {
        setLevel(newLevel)
        setDropTime(Math.max(100, 1000 - (newLevel - 1) * 100))
      }

      spawnNewPiece()
    }
  }, [
    currentPiece,
    currentPosition,
    gameOver,
    isPaused,
    isValidPosition,
    placePiece,
    board,
    clearLines,
    lines,
    calculateScore,
    level,
    spawnNewPiece,
  ])

  const movePiece = useCallback(
    (direction: "left" | "right") => {
      if (!currentPiece || gameOver || isPaused) return

      const newPosition = {
        ...currentPosition,
        x: currentPosition.x + (direction === "left" ? -1 : 1),
      }

      if (isValidPosition(currentPiece, newPosition)) {
        setCurrentPosition(newPosition)
      }
    },
    [currentPiece, currentPosition, gameOver, isPaused, isValidPosition],
  )

  const rotatePieceAction = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return

    const rotatedPiece = rotatePiece(currentPiece)

    if (isValidPosition(rotatedPiece, currentPosition)) {
      setCurrentPiece(rotatedPiece)
    }
  }, [currentPiece, currentPosition, gameOver, isPaused, rotatePiece, isValidPosition])

  const startGame = useCallback(() => {
    setBoard(
      Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(EMPTY_CELL)),
    )
    setScore(0)
    setLevel(1)
    setLines(0)
    setDropTime(1000)
    setGameOver(false)
    setIsPlaying(true)
    setIsPaused(false)
    setNextPiece(createRandomPiece())
    spawnNewPiece()
  }, [createRandomPiece, spawnNewPiece])

  const togglePause = useCallback(() => {
    if (isPlaying && !gameOver) {
      setIsPaused((prev) => !prev)
    }
  }, [isPlaying, gameOver])

  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      gameLoopRef.current = setInterval(dropPiece, dropTime)
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [isPlaying, isPaused, gameOver, dropPiece, dropTime])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver) return

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault()
          movePiece("left")
          break
        case "ArrowRight":
          event.preventDefault()
          movePiece("right")
          break
        case "ArrowDown":
          event.preventDefault()
          dropPiece()
          break
        case "ArrowUp":
        case " ":
          event.preventDefault()
          rotatePieceAction()
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
  }, [isPlaying, isPaused, gameOver, movePiece, dropPiece, rotatePieceAction, togglePause])

  const displayBoard = useCallback(() => {
    let boardWithPiece = board.map((row) => [...row])

    if (currentPiece && !gameOver) {
      boardWithPiece = placePiece(currentPiece, currentPosition, boardWithPiece)
    }

    return boardWithPiece
  }, [board, currentPiece, currentPosition, gameOver, placePiece])

  return (
    <div className="flex flex-col items-center w-full max-w-xs sm:max-w-md mx-auto">
      <div className="flex justify-between w-full px-2 py-2 bg-purple-900/50 rounded-t-lg text-xs sm:text-sm">
        <div className="text-purple-300">
          Score: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
        <div className="text-purple-300">
          Lvl: <span className="text-green-400 font-bold">{level}</span>
        </div>
        <div className="text-purple-300">
          Lines: <span className="text-blue-400 font-bold">{lines}</span>
        </div>
      </div>

      <div
        className="grid gap-px p-2 bg-black/50 border-2 border-purple-500/50"
        style={{
          gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
        }}
      >
        {displayBoard().map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${y}-${x}`}
              className="w-4 h-4 sm:w-5 sm:h-5 border border-gray-700/30 rounded-sm"
              style={{
                backgroundColor: cell === EMPTY_CELL ? "transparent" : cell,
                boxShadow: cell !== EMPTY_CELL ? `0 0 8px ${cell}` : "none",
              }}
            />
          )),
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 w-full mt-2 px-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => movePiece("left")}
          disabled={!isPlaying || isPaused || gameOver}
          className="border-purple-500 text-purple-300 hover:bg-purple-900/30 bg-transparent h-12"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={rotatePieceAction}
          disabled={!isPlaying || isPaused || gameOver}
          className="border-purple-500 text-purple-300 hover:bg-purple-900/30 bg-transparent h-12"
        >
          <RotateCw className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => movePiece("right")}
          disabled={!isPlaying || isPaused || gameOver}
          className="border-purple-500 text-purple-300 hover:bg-purple-900/30 bg-transparent h-12"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={dropPiece}
        disabled={!isPlaying || isPaused || gameOver}
        className="border-purple-500 text-purple-300 hover:bg-purple-900/30 bg-transparent h-10 w-full mt-2 mx-2"
      >
        <ArrowDown className="h-5 w-5 mr-2" />
        Drop
      </Button>

      <div className="flex gap-2 mt-2 w-full px-2">
        {!isPlaying ? (
          <Button onClick={startGame} size="sm" className="game-button flex-1 text-xs">
            <Play className="h-3 w-3 mr-1" />
            Start
          </Button>
        ) : (
          <Button onClick={togglePause} size="sm" className="game-button flex-1 text-xs">
            {isPaused ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
            {isPaused ? "Weiter" : "Pause"}
          </Button>
        )}

        {gameOver && (
          <Button
            onClick={startGame}
            size="sm"
            variant="outline"
            className="flex-1 border-purple-500 text-purple-300 hover:bg-purple-900/30 bg-transparent text-xs"
          >
            Nochmal
          </Button>
        )}
      </div>

      {gameOver && (
        <div className="text-center mt-2 p-2 bg-red-900/30 border border-red-700/50 rounded-lg w-full mx-2">
          <h3 className="text-lg font-bold text-red-300">Game Over!</h3>
          <p className="text-red-300/80 text-sm">Score: {score}</p>
        </div>
      )}

      {isPaused && (
        <div className="text-center mt-2 p-2 bg-yellow-900/30 border border-yellow-700/50 rounded-lg w-full mx-2">
          <h3 className="text-lg font-bold text-yellow-300">Pause</h3>
        </div>
      )}
    </div>
  )
}
