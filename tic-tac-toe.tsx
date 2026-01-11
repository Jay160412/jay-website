"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, Settings, RefreshCw, Award } from "lucide-react"
import { saveHighscore, updateMissionProgress } from "@/lib/auth"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

type Player = "X" | "O" | null
type BoardState = Player[]
type GameStatus = "playing" | "won" | "draw" | "thinking"
type Difficulty = "easy" | "medium" | "hard"

interface TicTacToeProps {
  username?: string
}

export default function TicTacToe({ username }: TicTacToeProps) {
  // Spielbrett als Array von 9 Feldern (3x3)
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null))
  // Aktueller Spieler
  const [isXNext, setIsXNext] = useState<boolean>(true)
  // Spielstatus
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing")
  // Gewinner-Kombination
  const [winningLine, setWinningLine] = useState<number[] | null>(null)
  // Spielstatistik
  const [stats, setStats] = useState({
    wins: 0,
    losses: 0,
    draws: 0,
    totalGames: 0,
  })
  // Schwierigkeitsgrad
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  // Einstellungen anzeigen
  const [showSettings, setShowSettings] = useState(false)
  // Animationen aktivieren
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  // Spielthema
  const [gameTheme, setGameTheme] = useState("neon")
  // Konfetti-Effekt
  const [showConfetti, setShowConfetti] = useState(false)
  // KI-Timer
  const [aiTimer, setAiTimer] = useState<number>(3)
  // Verfolge, ob das Spiel bereits beendet wurde
  const [gameEnded, setGameEnded] = useState(false)

  const { toast } = useToast()

  // Verwende useRef, um den aktuellen Zustand zu verfolgen, ohne Rerenders auszulösen
  const aiMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const timer1Ref = useRef<NodeJS.Timeout | null>(null)
  const timer2Ref = useRef<NodeJS.Timeout | null>(null)
  const timer3Ref = useRef<NodeJS.Timeout | null>(null)
  const gameStateRef = useRef({
    isXNext,
    gameStatus,
    board,
  })

  // Aktualisiere den Ref, wenn sich der Zustand ändert
  useEffect(() => {
    gameStateRef.current = {
      isXNext,
      gameStatus,
      board,
    }
  }, [isXNext, gameStatus, board])

  // Prüfe auf Gewinner nach jedem Zug
  useEffect(() => {
    if (gameEnded) return // Verhindere mehrfache Ausführung

    const winner = calculateWinner(board)
    if (winner) {
      setGameStatus("won")
      setWinningLine(winner.line)
      setGameEnded(true)

      // Zeige Konfetti bei Sieg
      if (winner.player === "X" && animationsEnabled) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }

      // Aktualisiere Statistik nur einmal
      if (winner.player === "X") {
        setStats((prev) => ({
          ...prev,
          wins: prev.wins + 1,
          totalGames: prev.totalGames + 1,
        }))

        // Zeige Toast-Nachricht
        toast({
          title: "Glückwunsch!",
          description: "Du hast gewonnen!",
          variant: "default",
        })

        // Speichere Highscore und aktualisiere Mission, wenn angemeldet
        if (username) {
          // Verwende den aktuellen Wert + 1 für den neuen Sieg
          const newWins = stats.wins + 1
          saveHighscore("tictactoe", username, newWins)
          updateMissionProgress(username, "tictactoe", newWins)
        }
      } else {
        setStats((prev) => ({
          ...prev,
          losses: prev.losses + 1,
          totalGames: prev.totalGames + 1,
        }))

        // Zeige Toast-Nachricht
        toast({
          title: "Schade!",
          description: "Du hast verloren. Versuche es noch einmal!",
          variant: "destructive",
        })
      }
    } else if (board.every((square) => square !== null) && !gameEnded) {
      setGameStatus("draw")
      setGameEnded(true)
      setStats((prev) => ({
        ...prev,
        draws: prev.draws + 1,
        totalGames: prev.totalGames + 1,
      }))

      // Zeige Toast-Nachricht
      toast({
        title: "Unentschieden!",
        description: "Das Spiel endet unentschieden.",
        variant: "default",
      })
    }
  }, [board, gameEnded, stats.wins, username, toast, animationsEnabled])

  // Zufälliger Zug
  const makeRandomMove = (currentBoard: BoardState): number => {
    const emptySquares = currentBoard
      .map((square, index) => (square === null ? index : null))
      .filter((index) => index !== null) as number[]

    if (emptySquares.length === 0) return 0

    const randomIndex = Math.floor(Math.random() * emptySquares.length)
    return emptySquares[randomIndex]
  }

  // Bester Zug mit Minimax-Algorithmus
  const makeBestMove = (currentBoard: BoardState): number => {
    // Prüfe, ob wir gewinnen können
    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        const boardCopy = [...currentBoard]
        boardCopy[i] = "O"
        if (calculateWinner(boardCopy)) {
          return i
        }
      }
    }

    // Prüfe, ob wir den Gegner blocken müssen
    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        const boardCopy = [...currentBoard]
        boardCopy[i] = "X"
        if (calculateWinner(boardCopy)) {
          return i
        }
      }
    }

    // Bevorzuge die Mitte
    if (currentBoard[4] === null) {
      return 4
    }

    // Bevorzuge die Ecken
    const corners = [0, 2, 6, 8].filter((i) => currentBoard[i] === null)
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)]
    }

    // Nimm ein beliebiges freies Feld
    return makeRandomMove(currentBoard)
  }

  // KI-Zug ausführen
  const makeAIMove = () => {
    const currentBoard = gameStateRef.current.board
    const currentGameStatus = gameStateRef.current.gameStatus

    // Sicherheitscheck: Nur ausführen, wenn das Spiel noch läuft
    if (currentGameStatus !== "thinking") {
      return
    }

    // Bestimme den besten Zug basierend auf dem Schwierigkeitsgrad
    let aiMove: number

    switch (difficulty) {
      case "easy":
        // Einfach: Zufälliger Zug
        aiMove = makeRandomMove(currentBoard)
        break

      case "medium":
        // Mittel: 70% Chance auf intelligenten Zug, 30% Chance auf zufälligen Zug
        if (Math.random() < 0.7) {
          aiMove = makeBestMove(currentBoard)
        } else {
          aiMove = makeRandomMove(currentBoard)
        }
        break

      case "hard":
      default:
        // Schwer: Immer der beste Zug
        aiMove = makeBestMove(currentBoard)
        break
    }

    // Aktualisiere das Spielbrett
    const newBoard = [...currentBoard]
    newBoard[aiMove] = "O"
    setBoard(newBoard)
    setIsXNext(true)
    setGameStatus("playing")
  }

  // Starte den KI-Timer und Zug
  const startAITurn = () => {
    // Bereinige vorherige Timeouts
    clearAllTimeouts()

    // Setze den Timer auf 3
    setAiTimer(3)

    // Timer für 1 Sekunde
    timer1Ref.current = setTimeout(() => {
      setAiTimer(2)

      // Timer für 2 Sekunden
      timer2Ref.current = setTimeout(() => {
        setAiTimer(1)

        // Timer für 3 Sekunden und KI-Zug
        timer3Ref.current = setTimeout(() => {
          setAiTimer(0)
          makeAIMove()
        }, 1000)
      }, 1000)
    }, 1000)
  }

  // Bereinige alle Timeouts
  const clearAllTimeouts = () => {
    if (timer1Ref.current) {
      clearTimeout(timer1Ref.current)
      timer1Ref.current = null
    }
    if (timer2Ref.current) {
      clearTimeout(timer2Ref.current)
      timer2Ref.current = null
    }
    if (timer3Ref.current) {
      clearTimeout(timer3Ref.current)
      timer3Ref.current = null
    }
    if (aiMoveTimeoutRef.current) {
      clearTimeout(aiMoveTimeoutRef.current)
      aiMoveTimeoutRef.current = null
    }
  }

  // KI-Zug ausführen, wenn der Spieler (X) seinen Zug gemacht hat
  useEffect(() => {
    // Wenn O an der Reihe ist und das Spiel noch läuft
    if (!isXNext && gameStatus === "playing") {
      // Setze den Status auf "thinking"
      setGameStatus("thinking")

      // Starte den KI-Timer und Zug
      startAITurn()
    }

    // Bereinige alle Timeouts beim Unmount
    return clearAllTimeouts
  }, [isXNext])

  // Spielfeld zurücksetzen
  const resetGame = () => {
    // Bereinige laufende Timeouts
    clearAllTimeouts()

    setBoard(Array(9).fill(null))
    setIsXNext(true)
    setGameStatus("playing")
    setWinningLine(null)
    setShowConfetti(false)
    setAiTimer(3)
    setGameEnded(false) // Wichtig: Setze gameEnded zurück
  }

  // Spielzug durchführen
  const handleClick = (index: number) => {
    // Ignoriere Klicks, wenn das Feld bereits belegt ist oder das Spiel vorbei ist
    if (board[index] || gameStatus !== "playing") {
      return
    }

    // Aktualisiere das Spielbrett
    const newBoard = [...board]
    newBoard[index] = "X"
    setBoard(newBoard)
    setIsXNext(false)
  }

  // Rendere ein Spielfeld
  const renderSquare = (index: number) => {
    const isWinningSquare = winningLine?.includes(index)
    const squareValue = board[index]

    // Bestimme die Klassen basierend auf dem Spielthema
    let squareClasses = `
      w-[30vw] h-[30vw] max-w-[100px] max-h-[100px] flex items-center justify-center 
      text-3xl font-bold transition-all duration-300
    `

    // Themenspezifische Stile
    switch (gameTheme) {
      case "neon":
        squareClasses += `
          ${
            isWinningSquare
              ? "bg-purple-700/50 text-white border-2 border-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.7)]"
              : "border-2 border-purple-700/50 hover:border-purple-500 hover:bg-purple-900/30"
          }
        `
        break
      case "retro":
        squareClasses += `
          ${
            isWinningSquare
              ? "bg-yellow-700/50 text-white border-4 border-yellow-500 retro-shadow"
              : "border-4 border-gray-700 hover:border-yellow-500 hover:bg-yellow-900/30 retro-shadow"
          }
          pixel-corners
        `
        break
      case "minimal":
        squareClasses += `
          ${
            isWinningSquare
              ? "bg-blue-700/50 text-white border border-blue-500"
              : "border border-gray-700 hover:border-blue-500 hover:bg-blue-900/30"
          }
          rounded-none
        `
        break
      default:
        squareClasses += `
          ${
            isWinningSquare
              ? "bg-primary/30 text-white border-2 border-primary"
              : "border-2 border-purple-700/50 hover:bg-purple-800/20 active:bg-purple-800/30"
          }
        `
    }

    return (
      <motion.button
        key={index}
        className={squareClasses}
        onClick={() => handleClick(index)}
        disabled={gameStatus !== "playing" || !!board[index]}
        aria-label={`Feld ${index + 1}`}
        initial={animationsEnabled ? { scale: 0.8, opacity: 0 } : {}}
        animate={animationsEnabled ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.2, delay: index * 0.05 }}
        whileHover={animationsEnabled ? { scale: 1.05 } : {}}
        whileTap={animationsEnabled ? { scale: 0.95 } : {}}
      >
        {squareValue && (
          <motion.span
            initial={animationsEnabled ? { scale: 0, opacity: 0 } : {}}
            animate={animationsEnabled ? { scale: 1, opacity: 1 } : {}}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className={`
              ${
                squareValue === "X"
                  ? gameTheme === "neon"
                    ? "text-pink-500 text-shadow-[0_0_10px_rgba(236,72,153,0.7)]"
                    : gameTheme === "retro"
                      ? "text-yellow-500"
                      : "text-blue-500"
                  : gameTheme === "neon"
                    ? "text-cyan-500 text-shadow-[0_0_10px_rgba(6,182,212,0.7)]"
                    : gameTheme === "retro"
                      ? "text-green-500"
                      : "text-red-500"
              }
            `}
          >
            {squareValue}
          </motion.span>
        )}
      </motion.button>
    )
  }

  // Spielstatus-Nachricht
  const getStatusMessage = () => {
    if (gameStatus === "thinking") {
      return (
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary absolute" />
            <span className="text-xs font-bold z-10">{aiTimer}</span>
          </div>
          <span>KI denkt nach...</span>
        </div>
      )
    }

    if (gameStatus === "won") {
      return (
        <motion.div
          className={`font-bold text-xl ${!isXNext ? "text-pink-500" : "text-cyan-500"}`}
          initial={animationsEnabled ? { scale: 0.8, opacity: 0 } : {}}
          animate={animationsEnabled ? { scale: 1, opacity: 1 } : {}}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          Gewinner: {!isXNext ? "X" : "O"}
        </motion.div>
      )
    }

    if (gameStatus === "draw") {
      return (
        <motion.div
          className="font-bold text-xl text-yellow-500"
          initial={animationsEnabled ? { scale: 0.8, opacity: 0 } : {}}
          animate={animationsEnabled ? { scale: 1, opacity: 1 } : {}}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          Unentschieden!
        </motion.div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <span>Nächster Spieler:</span>
        <motion.span
          className={`font-bold ${isXNext ? "text-pink-500" : "text-cyan-500"}`}
          animate={animationsEnabled ? { scale: [1, 1.2, 1], opacity: [1, 1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
        >
          {isXNext ? "X" : "O"}
        </motion.span>
      </div>
    )
  }

  // Konfetti-Komponente
  const Confetti = () => (
    <div className="absolute inset-0 pointer-events-none z-10">
      {Array.from({ length: 50 }).map((_, index) => (
        <div
          key={index}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: ["#ec4899", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"][Math.floor(Math.random() * 5)],
            animationDuration: `${Math.random() * 3 + 2}s`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        />
      ))}
    </div>
  )

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex justify-between items-center w-full">
        <div className="text-lg font-medium">{getStatusMessage()}</div>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} className="relative">
          <Settings className={`h-5 w-5 transition-transform duration-300 ${showSettings ? "rotate-90" : ""}`} />
          {!showSettings && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full overflow-hidden"
          >
            <Card className="gaming-card p-4 mb-4">
              <Tabs defaultValue="difficulty" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="difficulty">Schwierigkeit</TabsTrigger>
                  <TabsTrigger value="appearance">Aussehen</TabsTrigger>
                </TabsList>
                <TabsContent value="difficulty" className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">KI-Schwierigkeit</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={difficulty === "easy" ? "default" : "outline"}
                        onClick={() => setDifficulty("easy")}
                        className={difficulty === "easy" ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        Einfach
                      </Button>
                      <Button
                        variant={difficulty === "medium" ? "default" : "outline"}
                        onClick={() => setDifficulty("medium")}
                        className={difficulty === "medium" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                      >
                        Mittel
                      </Button>
                      <Button
                        variant={difficulty === "hard" ? "default" : "outline"}
                        onClick={() => setDifficulty("hard")}
                        className={difficulty === "hard" ? "bg-red-600 hover:bg-red-700" : ""}
                      >
                        Schwer
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="appearance" className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Spielthema</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={gameTheme === "neon" ? "default" : "outline"}
                        onClick={() => setGameTheme("neon")}
                        className={gameTheme === "neon" ? "bg-purple-600 hover:bg-purple-700" : ""}
                      >
                        Neon
                      </Button>
                      <Button
                        variant={gameTheme === "retro" ? "default" : "outline"}
                        onClick={() => setGameTheme("retro")}
                        className={gameTheme === "retro" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                      >
                        Retro
                      </Button>
                      <Button
                        variant={gameTheme === "minimal" ? "default" : "outline"}
                        onClick={() => setGameTheme("minimal")}
                        className={gameTheme === "minimal" ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        Minimal
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="animations">Animationen</Label>
                      <p className="text-sm text-muted-foreground">Aktiviere oder deaktiviere Spielanimationen</p>
                    </div>
                    <Switch id="animations" checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {showConfetti && <Confetti />}
        <Card
          className={`p-4 overflow-hidden ${gameTheme === "neon" ? "gaming-card" : gameTheme === "retro" ? "retro-shadow pixel-corners" : ""}`}
        >
          <div className="grid grid-cols-3 gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => renderSquare(index))}
          </div>
        </Card>
      </div>

      <Button onClick={resetGame} className="mt-4 w-full sm:w-auto game-button-3d">
        <RefreshCw className="h-4 w-4 mr-2" />
        Spiel neu starten
      </Button>

      <div className="text-sm text-muted-foreground mt-4">
        <p>Du spielst als X, die KI spielt als O.</p>
        <p>Viel Spaß!</p>
      </div>

      {/* Statistik */}
      <motion.div
        className="mt-4 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="font-medium mb-2 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Deine Statistik
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="game-stats-card">
            <div className="text-2xl font-bold text-green-500">{stats.wins}</div>
            <div className="text-xs text-green-400">Siege</div>
          </div>
          <div className="game-stats-card">
            <div className="text-2xl font-bold text-yellow-500">{stats.draws}</div>
            <div className="text-xs text-yellow-400">Unentschieden</div>
          </div>
          <div className="game-stats-card">
            <div className="text-2xl font-bold text-red-500">{stats.losses}</div>
            <div className="text-xs text-red-400">Niederlagen</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Hilfsfunktion, um den Gewinner zu berechnen
function calculateWinner(squares: BoardState): { player: Player; line: number[] } | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (const line of lines) {
    const [a, b, c] = line
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { player: squares[a], line }
    }
  }

  return null
}
