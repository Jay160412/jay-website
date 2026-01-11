// Einfaches Authentifizierungssystem für die Spiele

export interface User {
  username: string
  password: string
  coins: number
  cosmetics: string[]
  activeCosmetic: string | null
  createdAt: string
  lastLogin: string
}

// Speichere einen Benutzer
export function saveUser(user: User): void {
  if (typeof window !== "undefined") {
    try {
      const users = getUsers()
      users[user.username] = user
      localStorage.setItem("gameUsers", JSON.stringify(users))
      console.log("Benutzer gespeichert:", user.username)
    } catch (error) {
      console.error("Fehler beim Speichern des Benutzers:", error)
    }
  }
}

// Hole alle Benutzer
export function getUsers(): Record<string, User> {
  if (typeof window !== "undefined") {
    try {
      const usersJson = localStorage.getItem("gameUsers")
      if (usersJson) {
        const users = JSON.parse(usersJson)
        return users || {}
      }
    } catch (error) {
      console.error("Fehler beim Laden der Benutzer:", error)
    }
  }
  return {}
}

// Hole einen bestimmten Benutzer
export function getUser(username: string): User | null {
  if (typeof window !== "undefined") {
    try {
      const users = getUsers()
      const user = users[username]

      if (user && user.activeCosmetic === undefined) {
        user.activeCosmetic = null
        saveUser(user)
      }

      return user || null
    } catch (error) {
      console.error("Fehler beim Laden des Benutzers:", error)
      return null
    }
  }
  return null
}

export function getUserData(username: string): {
  coins: number
  ownedSkins: Record<string, string[]>
  activeSkins: Record<string, string>
} | null {
  if (typeof window !== "undefined") {
    try {
      // Get base user data
      const user = getUser(username)
      if (!user) return null

      // Get extended game data from localStorage
      const extendedDataJson = localStorage.getItem(`user_${username}`)
      let extendedData: any = {}

      if (extendedDataJson) {
        extendedData = JSON.parse(extendedDataJson)
      }

      return {
        coins: user.coins,
        ownedSkins: extendedData.ownedSkins || {
          snake: ["classic"],
          runner: ["classic"],
          flappy: ["classic"],
          tetris: ["classic"],
          memory: ["classic"],
        },
        activeSkins: extendedData.activeSkins || {
          snake: "classic",
          runner: "classic",
          flappy: "classic",
          tetris: "classic",
          memory: "classic",
        },
      }
    } catch (error) {
      console.error("Fehler beim Laden der Benutzerdaten:", error)
      return null
    }
  }
  return null
}

// Überprüfe die Anmeldedaten
export function checkCredentials(username: string, password: string): boolean {
  const user = getUser(username)
  return user !== null && user.password === password
}

// Aktualisiere die Coins eines Benutzers
export function updateCoins(username: string, amount: number): void {
  const user = getUser(username)
  if (user) {
    user.coins = Math.max(0, user.coins + amount) // Verhindere negative Coins
    user.lastLogin = new Date().toISOString()
    saveUser(user)

    // Aktualisiere auch die globale Coin-Anzeige
    window.dispatchEvent(new CustomEvent("coinsUpdated", { detail: { username, coins: user.coins } }))
  }
}

// Speichere einen Highscore (GLOBAL und lokal)
export function saveHighscore(gameId: string, username: string, score: number): void {
  // Lokale Speicherung (für Offline-Funktionalität)
  saveLocalHighscore(gameId, username, score)

  // Globale Speicherung (für geräteübergreifende Bestenliste)
  saveGlobalHighscore(gameId, username, score)
}

// Lokale Highscore-Speicherung
function saveLocalHighscore(gameId: string, username: string, score: number): void {
  if (typeof window !== "undefined") {
    try {
      const highscoresJson = localStorage.getItem("gameHighscores") || "{}"
      const highscores = JSON.parse(highscoresJson)

      if (!highscores[gameId]) {
        highscores[gameId] = []
      }

      const existingIndex = highscores[gameId].findIndex(
        (entry: { username: string; score: number }) => entry.username === username,
      )

      if (existingIndex !== -1) {
        if (score > highscores[gameId][existingIndex].score) {
          highscores[gameId][existingIndex].score = score
        }
      } else {
        highscores[gameId].push({ username, score })
      }

      highscores[gameId].sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      localStorage.setItem("gameHighscores", JSON.stringify(highscores))
    } catch (error) {
      console.error("Fehler beim Speichern des lokalen Highscores:", error)
    }
  }
}

// Globale Highscore-Speicherung
async function saveGlobalHighscore(gameId: string, username: string, score: number): Promise<void> {
  try {
    console.log(`Speichere globalen Highscore: ${username} - ${gameId} - ${score}`)

    const response = await fetch("/api/highscores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        game: gameId,
        username,
        score,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      console.log("Globaler Highscore erfolgreich gespeichert:", data)
    } else {
      console.warn("Globaler Highscore konnte nicht gespeichert werden:", data.error)
    }
  } catch (error) {
    console.warn("Fehler beim Speichern des globalen Highscores:", error)
  }
}

// Hole globale Highscores
export async function getGlobalHighscores(
  gameId?: string,
): Promise<Array<{ username: string; score: number; game: string; timestamp: string }>> {
  try {
    const url = gameId ? `/api/highscores?game=${gameId}` : "/api/highscores"
    console.log("Lade globale Highscores von:", url)

    const response = await fetch(url, {
      cache: "no-store", // Verhindert Caching für aktuelle Daten
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Globale Highscores geladen:", data.highscores?.length || 0, "Einträge")

    return data.highscores || []
  } catch (error) {
    console.warn("Globale Highscores konnten nicht geladen werden:", error)
    return []
  }
}

// Hole die Top-Highscores für ein Spiel (lokal)
export function getTopHighscores(gameId: string, limit = 10): Array<{ username: string; score: number }> {
  if (typeof window !== "undefined") {
    try {
      const highscoresJson = localStorage.getItem("gameHighscores") || "{}"
      const highscores = JSON.parse(highscoresJson)

      if (!highscores[gameId]) {
        return []
      }

      return highscores[gameId].slice(0, limit)
    } catch (error) {
      console.error("Fehler beim Laden der Highscores:", error)
      return []
    }
  }
  return []
}

// Hole alle Highscores für alle Spiele (lokal)
export function getAllHighscores(): Record<string, Array<{ username: string; score: number }>> {
  if (typeof window !== "undefined") {
    try {
      const highscoresJson = localStorage.getItem("gameHighscores") || "{}"
      return JSON.parse(highscoresJson)
    } catch (error) {
      console.error("Fehler beim Laden aller Highscores:", error)
      return {}
    }
  }
  return {}
}

// Mission-Fortschritt aktualisieren
export function updateMissionProgress(username: string, game: string, value: number): void {
  console.log(`Mission Update: ${username} - ${game} - ${value}`)

  // Belohne Spieler mit Coins für gute Leistungen
  if (value > 0) {
    const bonusCoins = Math.floor(value / 10) // 1 Coin pro 10 Punkte
    if (bonusCoins > 0) {
      updateCoins(username, bonusCoins)
    }
  }
}

// Weitere Hilfsfunktionen...
export function addCosmetic(username: string, cosmetic: string): boolean {
  const user = getUser(username)
  if (user) {
    if (!user.cosmetics.includes(cosmetic)) {
      user.cosmetics.push(cosmetic)
      saveUser(user)
      return true
    }
  }
  return false
}

export function updateActiveCosmetic(username: string, cosmeticId: string | null): boolean {
  const user = getUser(username)
  if (user) {
    if (cosmeticId === null) {
      user.activeCosmetic = null
      saveUser(user)
      return true
    }

    if (user.cosmetics.includes(cosmeticId)) {
      user.activeCosmetic = cosmeticId
      saveUser(user)
      return true
    }
  }
  return false
}

export function getActiveCosmetic(username: string): string | null {
  const user = getUser(username)
  return user ? user.activeCosmetic : null
}

export interface Mission {
  id: string
  description: string
  progress: number
  target: number
  reward: number
  completed: boolean
}

export function getDailyMissions(username: string): Mission[] {
  // Dummy-Daten für tägliche Missionen
  return [
    {
      id: "mission1",
      description: "Spiele 3 verschiedene Spiele",
      progress: 0,
      target: 3,
      reward: 50,
      completed: false,
    },
    {
      id: "mission2",
      description: "Sammle 100 Punkte in einem Spiel",
      progress: 0,
      target: 100,
      reward: 30,
      completed: false,
    },
    {
      id: "mission3",
      description: "Sammle 20 Münzen",
      progress: 0,
      target: 20,
      reward: 25,
      completed: false,
    },
  ]
}

// Erstelle einen neuen Benutzer mit Standard-Coins
export function createUser(username: string, password: string): User {
  const newUser: User = {
    username,
    password,
    coins: 100, // Startbonus von 100 Coins
    cosmetics: [],
    activeCosmetic: null,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  }

  saveUser(newUser)
  return newUser
}
