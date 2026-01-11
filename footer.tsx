"use client"

import Link from "next/link"
import { Youtube, MessageSquare } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

export function Footer() {
  const [isStandalone, setIsStandalone] = useState(false)

  // Check if the site is running as a standalone PWA
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isInStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        // @ts-expect-error – Safari PWA flag
        window.navigator.standalone === true
      setIsStandalone(isInStandaloneMode)
    }
  }, [])

  // Open external links correctly when running standalone
  const handleExternalLink = (url: string) => {
    if (isStandalone) {
      window.open(url, "_system")
      return false
    }
    return true
  }

  return (
    <footer className="border-t border-purple-900/30 py-8 md:py-12 gaming-card">
      <div className="container flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start">
          <Image
            src="/images/jay-logo.png"
            alt="Jay Logo"
            width={60}
            height={60}
            className="mb-2 gaming-glow"
            priority
          />
          <p className="text-sm text-muted-foreground mt-1">Content Creator & Künstler</p>
        </div>

        <div className="flex gap-6">
          <Link
            href="https://youtube.com/@jay_yt_real?si=L7nHrn2xEVT1feX_"
            target="_blank"
            onClick={() => handleExternalLink("https://youtube.com/@jay_yt_real?si=L7nHrn2xEVT1feX_")}
            className="text-muted-foreground hover:text-primary transition-colors app-link"
          >
            <Youtube className="h-6 w-6" />
            <span className="sr-only">YouTube</span>
          </Link>

          <Link
            href="https://www.tiktok.com/@jay__tiktok?_t=ZN-8vGFGfMUiVK&_r=1"
            target="_blank"
            onClick={() => handleExternalLink("https://www.tiktok.com/@jay__tiktok?_t=ZN-8vGFGfMUiVK&_r=1")}
            className="text-muted-foreground hover:text-primary transition-colors app-link"
          >
            {/* TikTok SVG icon */}
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
            </svg>
            <span className="sr-only">TikTok</span>
          </Link>

          <Link
            href="https://discord.com/invite/yugWsaGP6t"
            target="_blank"
            onClick={() => handleExternalLink("https://discord.com/invite/yugWsaGP6t")}
            className="text-muted-foreground hover:text-primary transition-colors app-link"
          >
            <MessageSquare className="h-6 w-6" />
            <span className="sr-only">Discord</span>
          </Link>
        </div>

        <div className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Jay. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  )
}

// keep default export for existing imports
export default Footer
