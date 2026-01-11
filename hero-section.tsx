import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export function HeroSection() {
  return (
    <div className="relative overflow-hidden rounded-lg gaming-border">
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/50 z-10" />
      <div className="relative aspect-[21/9] w-full bg-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            <Image
              src="/images/jay-character-5.png"
              alt="Jay Character"
              fill
              className="object-contain opacity-40"
              style={{ objectPosition: "center" }}
            />
          </div>
        </div>
      </div>
      <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-center p-8 md:p-12">
        <Image
          src="/images/jay-logo-tech.png"
          alt="Jay Logo"
          width={200}
          height={200}
          className="mb-6 animate-float gaming-glow"
        />
        <p className="text-xl md:text-2xl text-white/90 max-w-xl mb-6 gaming-text-glow">INFLUENCER & CONTENT CREATOR</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 w-full max-w-4xl">
          <Button asChild size="lg" className="w-full gaming-button gaming-border">
            <Link href="/youtube">YOUTUBE</Link>
          </Button>
          <Button asChild size="lg" className="w-full gaming-button gaming-border">
            <Link href="/tiktok">TIKTOK</Link>
          </Button>
          <Button asChild size="lg" className="w-full gaming-button gaming-border">
            <Link href="/discord">DISCORD & BOT</Link>
          </Button>
          <Button asChild size="lg" className="w-full gaming-button gaming-border md:col-span-1 col-span-2">
            <Link href="/games">GAMES</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default HeroSection
