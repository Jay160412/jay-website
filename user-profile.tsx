"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getUser, getDailyMissions, type Mission } from "@/lib/auth"
import { Coins, LogOut, Award } from "lucide-react"

interface UserProfileProps {
  username: string
  onLogout: () => void
  onShopOpen: () => void
}

export function UserProfile({ username, onLogout, onShopOpen }: UserProfileProps) {
  const [user, setUser] = useState<any>(null)
  const [missions, setMissions] = useState<Mission[]>([])

  useEffect(() => {
    // Lade Benutzerdaten
    const userData = getUser(username)
    setUser(userData)

    // Lade tägliche Missionen
    const userMissions = getDailyMissions(username)
    setMissions(userMissions)

    // Aktualisiere die Daten alle 30 Sekunden
    const interval = setInterval(() => {
      const refreshedUser = getUser(username)
      setUser(refreshedUser)

      const refreshedMissions = getDailyMissions(username)
      setMissions(refreshedMissions)
    }, 30000)

    return () => clearInterval(interval)
  }, [username])

  if (!user) return null

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>{username}</CardTitle>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span className="text-xl font-bold">{user.coins}</span>
          </div>
        </div>
        <CardDescription>Mitglied seit {new Date(user.createdAt).toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <h3 className="font-medium mb-2 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Tägliche Missionen
        </h3>
        <div className="space-y-2">
          {missions.map((mission) => (
            <div key={mission.id} className="border rounded-md p-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-sm">{mission.title}</h4>
                  <p className="text-xs text-muted-foreground">{mission.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm">{mission.reward}</span>
                  <Coins className="h-3 w-3 text-yellow-500" />
                </div>
              </div>
              <div className="mt-1 flex justify-between items-center">
                <div className="w-full max-w-xs bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${mission.completed ? "bg-green-500" : "bg-primary"}`}
                    style={{ width: `${mission.completed ? 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-xs ml-2">{mission.completed ? "✓" : ""}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Abmelden
        </Button>
        <Button size="sm" onClick={onShopOpen}>
          <Coins className="h-4 w-4 mr-2" />
          Shop
        </Button>
      </CardFooter>
    </Card>
  )
}
