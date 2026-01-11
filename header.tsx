"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Menu, Youtube, MessageSquare, Gamepad2, Home, Trophy, Settings, Mail, X, Heart, Music } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"

// Hauptrouten für die Navigation (Bottom Bar)
const mainRoutes = [
  { name: "Home", path: "/", icon: <Home className="h-5 w-5 mr-2" /> },
  { name: "YouTube", path: "/youtube", icon: <Youtube className="h-5 w-5 mr-2" /> },
  {
    name: "TikTok",
    path: "/tiktok",
    icon: (
      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"></path>
      </svg>
    ),
  },
  {
    name: "Discord & Bot",
    path: "/discord",
    icon: <MessageSquare className="h-5 w-5 mr-2" />,
  },
  { name: "Games", path: "/games", icon: <Gamepad2 className="h-5 w-5 mr-2" /> },
  { name: "Kontakt", path: "/contact", icon: <Mail className="h-5 w-5 mr-2" /> },
]

const burgerOnlyRoutes = [
  { name: "Fan Zone", path: "/fan-zone", icon: <Heart className="h-5 w-5 mr-2" /> },
  { name: "Music", path: "/music", icon: <Music className="h-5 w-5 mr-2" /> },
]

// Zusätzliche Routen für das Burger-Menü
const additionalRoutes = [
  { name: "Bestenliste", path: "/leaderboard", icon: <Trophy className="h-5 w-5 mr-2" /> },
  { name: "Admin", path: "/admin", icon: <Settings className="h-5 w-5 mr-2" /> },
]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)

  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMenuOpen])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMenuOpen])

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-purple-900/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle Menu"
              className="touch-target"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>

            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/images/jay-logo.png"
                alt="Jay Logo"
                width={40}
                height={40}
                className="hidden md:block gaming-glow"
              />
              <span className="font-bold text-xl tracking-wider gaming-gradient text-transparent bg-clip-text gaming-text-glow">
                JAY'S WEBSEITE
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            {mainRoutes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                className={cn(
                  "flex items-center text-sm font-medium transition-colors hover:text-primary",
                  pathname === route.path ? "text-primary" : "text-muted-foreground",
                )}
              >
                {route.icon}
                {route.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden md:flex">
              <Link href="/admin">Admin</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Bleibt unverändert (nur mainRoutes) */}
      <div className="lg:hidden mobile-bottom-nav">
        {mainRoutes.slice(0, 5).map((route) => (
          <Link
            key={route.path}
            href={route.path}
            className={cn("mobile-bottom-nav-item", pathname === route.path ? "active" : "")}
          >
            <span className="mobile-bottom-nav-item-icon">{route.icon}</span>
            <span className="text-xs">{route.name}</span>
          </Link>
        ))}
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50">
          {/* Background Overlay */}
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)} />

          {/* Menu Panel */}
          <div
            ref={menuRef}
            className="fixed left-0 top-0 h-full w-[280px] bg-background border-r border-purple-900/50 shadow-xl gaming-card"
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-purple-900/30">
              <div className="flex items-center gap-3">
                <Image src="/images/jay-logo.png" alt="Jay Logo" width={32} height={32} className="gaming-glow" />
                <span className="font-bold gaming-gradient text-transparent bg-clip-text">Menü</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Menu Content */}
            <div className="flex flex-col h-[calc(100%-73px)] overflow-y-auto">
              <div className="p-4 space-y-6">
                {/* Main Routes */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">Hauptseiten</h3>
                  <nav className="space-y-1">
                    {mainRoutes.map((route) => (
                      <Link
                        key={route.path}
                        href={route.path}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                          "hover:bg-accent/50 active:bg-accent/70",
                          pathname === route.path
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {route.icon}
                        {route.name}
                      </Link>
                    ))}
                  </nav>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">Exklusiv</h3>
                  <nav className="space-y-1">
                    {burgerOnlyRoutes.map((route) => (
                      <Link
                        key={route.path}
                        href={route.path}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                          "hover:bg-accent/50 active:bg-accent/70",
                          pathname === route.path
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {route.icon}
                        {route.name}
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Additional Routes */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">Weitere Seiten</h3>
                  <nav className="space-y-1">
                    {additionalRoutes.map((route) => (
                      <Link
                        key={route.path}
                        href={route.path}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                          "hover:bg-accent/50 active:bg-accent/70",
                          pathname === route.path
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {route.icon}
                        {route.name}
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
