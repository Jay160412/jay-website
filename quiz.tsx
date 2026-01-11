"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { saveHighscore, updateMissionProgress } from "@/lib/auth"
import { CheckCircle, XCircle, ArrowRight, Trophy, RotateCcw } from "lucide-react"

interface QuizProps {
  username?: string
}

const QUIZ_QUESTIONS = [
  {
    question: "Welches Spiel ist bekannt für fallende Blöcke?",
    options: ["Pac-Man", "Tetris", "Super Mario", "Sonic"],
    correctAnswer: 1,
  },
  {
    question: "In welchem Jahr wurde Minecraft veröffentlicht?",
    options: ["2009", "2011", "2013", "2015"],
    correctAnswer: 0,
  },
  {
    question: "Welches dieser Spiele ist KEIN Battle Royale?",
    options: ["Fortnite", "PUBG", "Apex Legends", "Overwatch"],
    correctAnswer: 3,
  },
  {
    question: "Welches Unternehmen hat die PlayStation entwickelt?",
    options: ["Microsoft", "Nintendo", "Sony", "Sega"],
    correctAnswer: 2,
  },
  {
    question: "Wie heißt der Protagonist in The Legend of Zelda?",
    options: ["Zelda", "Link", "Ganon", "Mario"],
    correctAnswer: 1,
  },
  {
    question: "Welches Spiel wurde von Mojang entwickelt?",
    options: ["Roblox", "Terraria", "Minecraft", "Stardew Valley"],
    correctAnswer: 2,
  },
  {
    question: "Welche Währung verwendet Roblox?",
    options: ["V-Bucks", "Robux", "Minecoins", "Credits"],
    correctAnswer: 1,
  },
  {
    question: "Welches Spiel hat den Charakter 'Steve'?",
    options: ["Terraria", "Minecraft", "Roblox", "Fortnite"],
    correctAnswer: 1,
  },
  {
    question: "In welchem Spiel sammelt man 'V-Bucks'?",
    options: ["Roblox", "Minecraft", "Fortnite", "Among Us"],
    correctAnswer: 2,
  },
  {
    question: "Welches Unternehmen entwickelte Among Us?",
    options: ["Epic Games", "Mojang", "InnerSloth", "Valve"],
    correctAnswer: 2,
  },
]

export default function Quiz({ username }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const [questions, setQuestions] = useState<typeof QUIZ_QUESTIONS>([])
  const [isStarted, setIsStarted] = useState(false)

  const startGame = () => {
    const shuffledQuestions = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5)
    setQuestions(shuffledQuestions)
    setCurrentQuestion(0)
    setScore(0)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setGameOver(false)
    setIsStarted(true)
  }

  const selectAnswer = (index: number) => {
    if (isAnswered) return

    setSelectedAnswer(index)
    setIsAnswered(true)

    if (index === questions[currentQuestion].correctAnswer) {
      setScore(score + 1)
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer(null)
        setIsAnswered(false)
      } else {
        setGameOver(true)

        if (username) {
          const finalScore = score + (index === questions[currentQuestion].correctAnswer ? 1 : 0)
          if (finalScore > highScore) {
            setHighScore(finalScore)
            saveHighscore("quiz", username, finalScore)
          }
          updateMissionProgress(username, "quiz", finalScore)
        }
      }
    }, 1500)
  }

  useEffect(() => {
    if (username) {
      const scores = JSON.parse(localStorage.getItem("gameHighscores") || "{}")
      if (scores.quiz) {
        const userScore = scores.quiz.find((entry: any) => entry.username === username)
        if (userScore) {
          setHighScore(userScore.score)
        }
      }
    }
  }, [username])

  return (
    <div className="flex flex-col items-center gap-2 p-2 w-full max-w-sm mx-auto">
      <div className="flex justify-between items-center w-full text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Punkte</p>
          <p className="text-lg font-bold">
            {score}/{questions.length || 5}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <span className="font-bold">{highScore}</span>
        </div>
      </div>

      {!isStarted ? (
        <div className="text-center space-y-3 py-4">
          <p className="text-sm">Teste dein Gaming-Wissen!</p>
          <p className="text-xs text-muted-foreground">5 zufällige Fragen</p>
          <Button onClick={startGame} className="w-full h-10 game-button-3d">
            Quiz starten
          </Button>
        </div>
      ) : gameOver ? (
        <Card className="w-full p-4 gaming-border text-center">
          <h3 className="text-xl font-bold mb-2">Quiz beendet!</h3>
          <p className="text-lg mb-4">
            {score} von {questions.length} richtig
          </p>
          <Button onClick={startGame} className="w-full h-10 game-button-3d">
            <RotateCcw className="h-4 w-4 mr-2" />
            Nochmal
          </Button>
        </Card>
      ) : (
        <Card className="w-full gaming-border">
          <CardContent className="p-3">
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1 text-xs">
                <span>
                  Frage {currentQuestion + 1}/{questions.length}
                </span>
                <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-secondary h-1.5 rounded-full">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <h3 className="text-base font-bold mb-3">{questions[currentQuestion]?.question}</h3>

            <div className="space-y-2">
              {questions[currentQuestion]?.options.map((option, index) => (
                <button
                  key={index}
                  className={`
                    w-full text-left p-3 rounded-lg border-2 transition-all flex justify-between items-center text-sm
                    touch-manipulation active:scale-[0.98]
                    ${
                      selectedAnswer === index
                        ? index === questions[currentQuestion].correctAnswer
                          ? "border-green-500 bg-green-500/20"
                          : "border-red-500 bg-red-500/20"
                        : "border-purple-700/50 hover:bg-purple-800/20"
                    }
                  `}
                  onClick={() => selectAnswer(index)}
                  disabled={isAnswered}
                >
                  <span>{option}</span>
                  {isAnswered && index === questions[currentQuestion].correctAnswer && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {isAnswered && selectedAnswer === index && index !== questions[currentQuestion].correctAnswer && (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </button>
              ))}
            </div>

            {isAnswered && currentQuestion < questions.length - 1 && (
              <Button
                variant="ghost"
                className="w-full mt-3 text-sm"
                onClick={() => {
                  setCurrentQuestion(currentQuestion + 1)
                  setSelectedAnswer(null)
                  setIsAnswered(false)
                }}
              >
                Weiter <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-[10px] text-muted-foreground text-center">Wähle die richtige Antwort</p>
    </div>
  )
}
