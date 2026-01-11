import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { LatestVideos } from "@/components/latest-videos"
import { LatestTikToks } from "@/components/latest-tiktoks"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <div className="container mx-auto px-4 space-y-16">
        <AboutSection />
        <LatestVideos />
        <LatestTikToks />
      </div>
      <Footer />
    </div>
  )
}
