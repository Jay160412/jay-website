"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getUser, updateActiveCosmetic } from "@/lib/auth"
import { Check, Paintbrush, Crown, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface InventoryModalProps {
  isOpen: boolean
  onClose: () => void
  username: string
  onOpenInventory?: () => void
}

// Verfügbare kosmetische Gegenstände
const COSMETICS = [
  {
    id: "gold_name",
    name: "Goldener Name",
    description: "Dein Name erscheint in Gold in der Bestenliste",
    icon: <Crown className="h-5 w-5 text-yellow-500" />,
    preview: { color: "#FFD700" },
  },
  {
    id: "rainbow_name",
    name: "Regenbogen-Name",
    description: "Dein Name erscheint in Regenbogenfarben in der Bestenliste",
    icon: <Sparkles className="h-5 w-5 text-purple-500" />,
    preview: {
      background: "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
  },
  {
    id: "blue_name",
    name: "Blauer Name",
    description: "Dein Name erscheint in Blau in der Bestenliste",
    icon: <Paintbrush className="h-5 w-5 text-blue-500" />,
    preview: { color: "#3b82f6" },
  },
  {
    id: "green_name",
    name: "Grüner Name",
    description: "Dein Name erscheint in Grün in der Bestenliste",
    icon: <Paintbrush className="h-5 w-5 text-green-500" />,
    preview: { color: "#10b981" },
  },
  {
    id: "purple_name",
    name: "Lila Name",
    description: "Dein Name erscheint in Lila in der Bestenliste",
    icon: <Paintbrush className="h-5 w-5 text-purple-500" />,
    preview: { color: "#8b5cf6" },
  },
]

export function InventoryModal({ isOpen, onClose, username }: InventoryModalProps) {
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && username) {
      // Lade Benutzerdaten
      const userData = getUser(username)
      setUser(userData)
    }
  }, [isOpen, username])

  const handleActivate = (cosmeticId: string) => {
    if (!user) return

    // Aktiviere den Gegenstand
    updateActiveCosmetic(username, cosmeticId)

    // Aktualisiere die Benutzerdaten
    const updatedUser = getUser(username)
    setUser(updatedUser)

    toast({
      title: "Gegenstand aktiviert",
      description: `Du hast den Gegenstand erfolgreich aktiviert.`,
    })
  }

  const handleDeactivate = () => {
    if (!user) return

    // Deaktiviere den aktiven Gegenstand
    updateActiveCosmetic(username, null)

    // Aktualisiere die Benutzerdaten
    const updatedUser = getUser(username)
    setUser(updatedUser)

    toast({
      title: "Gegenstand deaktiviert",
      description: `Du hast den Gegenstand erfolgreich deaktiviert.`,
    })
  }

  if (!user) return null

  const ownedCosmetics = COSMETICS.filter((item) => user.cosmetics.includes(item.id))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mobile-dialog-content">
        <DialogHeader className="mobile-dialog-header">
          <DialogTitle>Inventar</DialogTitle>
          <DialogDescription>Wähle einen kosmetischen Gegenstand aus deinem Inventar</DialogDescription>
        </DialogHeader>

        {ownedCosmetics.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Du besitzt noch keine kosmetischen Gegenstände.</p>
            <Button onClick={onClose}>Zum Shop</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mobile-card-grid">
            {ownedCosmetics.map((item) => {
              const isActive = user.activeCosmetic === item.id

              return (
                <div key={item.id} className={`border rounded-md p-4 ${isActive ? "border-purple-500" : ""}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <h3 className="font-medium">{item.name}</h3>
                    </div>
                    {isActive && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-700/50">
                        <Check className="h-3 w-3 mr-1" />
                        Aktiv
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                  <div className="mt-4">
                    <div className="mb-2">
                      <span className="text-sm font-medium">Vorschau: </span>
                      <span style={item.preview} className="font-semibold">
                        {username}
                      </span>
                    </div>
                    {isActive ? (
                      <Button onClick={handleDeactivate} variant="outline" className="w-full">
                        Deaktivieren
                      </Button>
                    ) : (
                      <Button onClick={() => handleActivate(item.id)} className="w-full">
                        Aktivieren
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
