"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Coins, Palette, ShoppingCart, CreditCard, AlertCircle } from "lucide-react"
import { updateCoins, getUser } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

interface ShopModalProps {
  username: string
  isOpen: boolean
  onClose: () => void
}

// Alle verfügbaren Skins für alle Spiele
const GAME_SKINS = {
  runner: [
    { id: "default", name: "Cyber Cube", color: "#8b5cf6", cost: 0, unlocked: true },
    { id: "neon", name: "Neon Glow", color: "#00ff88", cost: 100, unlocked: false },
    { id: "fire", name: "Fire Dash", color: "#ff4444", cost: 200, unlocked: false },
    { id: "ice", name: "Ice Crystal", color: "#44aaff", cost: 300, unlocked: false },
    { id: "rainbow", name: "Rainbow Rush", color: "#ff00ff", cost: 500, unlocked: false },
  ],
  flappybird: [
    { id: "classic", name: "Classic Bird", color: "#FFD700", cost: 0, unlocked: true },
    { id: "red", name: "Red Phoenix", color: "#FF4444", cost: 50, unlocked: false },
    { id: "blue", name: "Blue Jay", color: "#4444FF", cost: 100, unlocked: false },
    { id: "green", name: "Green Parrot", color: "#44FF44", cost: 150, unlocked: false },
    { id: "purple", name: "Purple Eagle", color: "#AA44FF", cost: 200, unlocked: false },
    { id: "rainbow", name: "Rainbow Bird", color: "rainbow", cost: 500, unlocked: false },
  ],
  tetris: [
    { id: "classic", name: "Classic Blocks", color: "#8b5cf6", cost: 0, unlocked: true },
    { id: "neon", name: "Neon Blocks", color: "#00ff88", cost: 150, unlocked: false },
    { id: "fire", name: "Fire Blocks", color: "#ff4444", cost: 250, unlocked: false },
    { id: "ice", name: "Ice Blocks", color: "#44aaff", cost: 350, unlocked: false },
    { id: "gold", name: "Golden Blocks", color: "#ffd700", cost: 600, unlocked: false },
  ],
  snake: [
    { id: "classic", name: "Classic Snake", color: "#8b5cf6", cost: 0, unlocked: true },
    { id: "neon", name: "Neon Snake", color: "#00ff88", cost: 120, unlocked: false },
    { id: "fire", name: "Fire Snake", color: "#ff4444", cost: 220, unlocked: false },
    { id: "ice", name: "Ice Snake", color: "#44aaff", cost: 320, unlocked: false },
    { id: "rainbow", name: "Rainbow Snake", color: "rainbow", cost: 550, unlocked: false },
  ],
  memory: [
    { id: "classic", name: "Classic Cards", color: "#8b5cf6", cost: 0, unlocked: true },
    { id: "neon", name: "Neon Cards", color: "#00ff88", cost: 80, unlocked: false },
    { id: "fire", name: "Fire Cards", color: "#ff4444", cost: 180, unlocked: false },
    { id: "ice", name: "Ice Cards", color: "#44aaff", cost: 280, unlocked: false },
    { id: "gold", name: "Golden Cards", color: "#ffd700", cost: 480, unlocked: false },
  ],
}

// Coin-Pakete zum Kauf
const COIN_PACKAGES = [
  { id: "small", coins: 100, price: "1,99€", description: "Starter Paket" },
  { id: "medium", coins: 500, price: "4,99€", description: "Beliebtes Paket", popular: true },
  { id: "large", coins: 1200, price: "9,99€", description: "Bester Wert" },
  { id: "mega", coins: 2500, price: "19,99€", description: "Mega Paket" },
]

function ShopModal({ username, isOpen, onClose }: ShopModalProps) {
  const [totalCoins, setTotalCoins] = useState(0)
  const [ownedSkins, setOwnedSkins] = useState<Record<string, string[]>>({})
  const [activeSkins, setActiveSkins] = useState<Record<string, string>>({})
  const { toast } = useToast()

  // Lade Benutzer-Daten
  useEffect(() => {
    if (username) {
      const user = getUser(username)
      if (user) {
        setTotalCoins(user.coins)
      }

      // Lade alle Skins für alle Spiele
      const allOwnedSkins: Record<string, string[]> = {}
      const allActiveSkins: Record<string, string> = {}

      Object.keys(GAME_SKINS).forEach((game) => {
        const savedSkins = localStorage.getItem(`${username}_${game}_skins`)
        const savedActiveSkin = localStorage.getItem(`${username}_${game}_skin`)

        allOwnedSkins[game] = savedSkins ? JSON.parse(savedSkins) : [GAME_SKINS[game as keyof typeof GAME_SKINS][0].id]
        allActiveSkins[game] = savedActiveSkin || GAME_SKINS[game as keyof typeof GAME_SKINS][0].id
      })

      setOwnedSkins(allOwnedSkins)
      setActiveSkins(allActiveSkins)
    }
  }, [username, isOpen])

  const buySkin = (game: string, skinId: string) => {
    const skin = GAME_SKINS[game as keyof typeof GAME_SKINS]?.find((s) => s.id === skinId)
    if (!skin || ownedSkins[game]?.includes(skinId) || totalCoins < skin.cost) return

    // Aktualisiere Benutzer-Coins
    updateCoins(username, -skin.cost)
    setTotalCoins((prev) => prev - skin.cost)

    // Aktualisiere owned skins
    const newOwnedSkins = { ...ownedSkins }
    newOwnedSkins[game] = [...(newOwnedSkins[game] || []), skinId]
    setOwnedSkins(newOwnedSkins)

    // Setze als aktiven Skin
    const newActiveSkins = { ...activeSkins }
    newActiveSkins[game] = skinId
    setActiveSkins(newActiveSkins)

    // Speichere in localStorage
    localStorage.setItem(`${username}_${game}_skins`, JSON.stringify(newOwnedSkins[game]))
    localStorage.setItem(`${username}_${game}_skin`, skinId)

    toast({
      title: "Skin gekauft!",
      description: `${skin.name} wurde freigeschaltet und aktiviert!`,
      variant: "default",
    })
  }

  const selectSkin = (game: string, skinId: string) => {
    if (!ownedSkins[game]?.includes(skinId)) return

    const newActiveSkins = { ...activeSkins }
    newActiveSkins[game] = skinId
    setActiveSkins(newActiveSkins)

    localStorage.setItem(`${username}_${game}_skin`, skinId)

    toast({
      title: "Skin aktiviert!",
      description: "Der Skin wurde erfolgreich aktiviert.",
      variant: "default",
    })
  }

  const buyCoinPackage = (packageId: string) => {
    const coinPackage = COIN_PACKAGES.find((p) => p.id === packageId)
    if (!coinPackage) return

    // Zeige Fehlermeldung statt Coins zu geben
    toast({
      title: "Zahlungssystem noch nicht verfügbar",
      description: "Die Coin-Käufe sind noch nicht implementiert. Bitte versuche es später erneut.",
      variant: "destructive",
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-purple-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl text-purple-300">Games Shop</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="text-yellow-500 font-bold">{totalCoins} Coins</span>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="skins" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="skins" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Skins
              </TabsTrigger>
              <TabsTrigger value="coins" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Coins kaufen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="skins">
              <div className="space-y-6">
                {Object.entries(GAME_SKINS).map(([game, skins]) => (
                  <div key={game} className="space-y-4">
                    <h3 className="text-xl font-bold text-white capitalize flex items-center gap-2">
                      <Palette className="h-5 w-5 text-purple-400" />
                      {game === "flappybird" ? "Flappy Bird" : game === "tictactoe" ? "Tic Tac Toe" : game} Skins
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {skins.map((skin) => {
                        const owned = ownedSkins[game]?.includes(skin.id)
                        const active = activeSkins[game] === skin.id
                        const canAfford = totalCoins >= skin.cost

                        return (
                          <div
                            key={skin.id}
                            className={`p-4 rounded-lg border transition-all ${
                              active
                                ? "border-green-500 bg-green-900/20"
                                : owned
                                  ? "border-blue-500 bg-blue-900/20"
                                  : "border-gray-600 bg-gray-800/50"
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className="w-8 h-8 rounded border-2"
                                style={{
                                  backgroundColor: skin.color === "rainbow" ? "#FF0000" : skin.color,
                                  background:
                                    skin.color === "rainbow"
                                      ? "linear-gradient(45deg, #FF0000, #FF8000, #FFFF00, #00FF00, #0080FF, #8000FF)"
                                      : skin.color,
                                  boxShadow: `0 0 10px ${skin.color === "rainbow" ? "#FF0000" : skin.color}`,
                                }}
                              />
                              <div>
                                <h4 className="font-medium text-white">{skin.name}</h4>
                                {active && <Badge className="bg-green-600 text-white">Aktiv</Badge>}
                                {owned && !active && <Badge className="bg-blue-600 text-white">Besessen</Badge>}
                              </div>
                            </div>

                            {owned ? (
                              <Button
                                onClick={() => selectSkin(game, skin.id)}
                                disabled={active}
                                className={`w-full ${active ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"}`}
                              >
                                {active ? "Aktiv" : "Auswählen"}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => buySkin(game, skin.id)}
                                disabled={!canAfford}
                                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600"
                              >
                                <Coins className="h-4 w-4 mr-2" />
                                {skin.cost} Coins
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="coins">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">Coins kaufen</h3>
                  <p className="text-gray-400">Kaufe Coins um neue Skins freizuschalten!</p>
                </div>

                {/* Warnung */}
                <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-red-300 font-medium mb-1">Zahlungssystem noch nicht verfügbar</h4>
                    <p className="text-red-200/80 text-sm">
                      Die Coin-Käufe sind derzeit noch nicht implementiert. Du kannst Coins durch das Spielen der Games
                      verdienen!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {COIN_PACKAGES.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`p-6 rounded-lg border transition-all relative opacity-50 ${
                        pkg.popular
                          ? "border-yellow-500 bg-yellow-900/20 ring-2 ring-yellow-500/50"
                          : "border-gray-600 bg-gray-800/50"
                      }`}
                    >
                      {pkg.popular && (
                        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-black">
                          Beliebt
                        </Badge>
                      )}

                      <div className="text-center space-y-4">
                        <div>
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Coins className="h-8 w-8 text-yellow-500" />
                            <span className="text-3xl font-bold text-yellow-500">{pkg.coins}</span>
                          </div>
                          <p className="text-gray-400">{pkg.description}</p>
                        </div>

                        <div className="text-2xl font-bold text-white">{pkg.price}</div>

                        <Button
                          onClick={() => buyCoinPackage(pkg.id)}
                          disabled={true}
                          className={`w-full cursor-not-allowed ${
                            pkg.popular
                              ? "bg-yellow-600/50 hover:bg-yellow-700/50 text-black/50"
                              : "bg-purple-600/50 hover:bg-purple-700/50"
                          }`}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Noch nicht verfügbar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center text-sm text-gray-400 p-4 bg-gray-800/50 rounded-lg">
                  <p className="mb-2">
                    💡 <strong>Tipp:</strong>
                  </p>
                  <p>
                    Du kannst Coins verdienen, indem du die verschiedenen Spiele spielst und gute Scores erreichst!
                    Jedes Spiel belohnt dich mit Coins basierend auf deiner Leistung.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────────
//  Exports
// ────────────────────────────────────────────────────────────────────────────────

export { ShopModal }
export default ShopModal
