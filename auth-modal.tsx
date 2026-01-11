"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { checkCredentials, getUser, saveUser } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (username: string) => void
}

export function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState("")
  const { toast } = useToast()

  // Zurücksetzen des Formulars beim Öffnen
  useEffect(() => {
    if (isOpen) {
      setUsername("")
      setPassword("")
      setError("")
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username || !password) {
      setError("Bitte fülle alle Felder aus.")
      return
    }

    try {
      if (isLogin) {
        // Login
        console.log("Versuche Anmeldung mit:", username)

        if (checkCredentials(username, password)) {
          console.log("Anmeldung erfolgreich")

          // Aktualisiere den letzten Login-Zeitpunkt
          const user = getUser(username)
          if (user) {
            user.lastLogin = new Date().toISOString()
            saveUser(user)
          }

          toast({
            title: "Erfolgreich angemeldet",
            description: `Willkommen zurück, ${username}!`,
          })
          onLogin(username)
          onClose()
        } else {
          console.log("Anmeldung fehlgeschlagen")
          setError("Falscher Benutzername oder Passwort.")
        }
      } else {
        // Registrierung
        console.log("Versuche Registrierung mit:", username)

        const existingUser = getUser(username)
        if (existingUser) {
          console.log("Benutzername bereits vergeben")
          setError("Dieser Benutzername ist bereits vergeben.")
          return
        }

        // Neuen Benutzer erstellen
        const newUser = {
          username,
          password,
          coins: 100, // Startguthaben
          cosmetics: [],
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        }

        saveUser(newUser)
        console.log("Registrierung erfolgreich")

        toast({
          title: "Registrierung erfolgreich",
          description: `Willkommen, ${username}! Du hast 100 Coins als Startguthaben erhalten.`,
        })
        onLogin(username)
        onClose()
      }
    } catch (error) {
      console.error("Fehler bei Authentifizierung:", error)
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isLogin ? "Anmelden" : "Registrieren"}</DialogTitle>
          <DialogDescription>
            {isLogin
              ? "Melde dich an, um deine Highscores zu speichern und Belohnungen zu erhalten."
              : "Erstelle ein Konto, um deine Highscores zu speichern und Belohnungen zu erhalten."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Benutzername</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Dein Benutzername"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Dein Passwort"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => setIsLogin(!isLogin)} className="sm:w-full">
              {isLogin ? "Neues Konto erstellen" : "Zurück zur Anmeldung"}
            </Button>
            <Button type="submit" className="sm:w-full">
              {isLogin ? "Anmelden" : "Registrieren"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
