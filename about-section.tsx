import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Youtube, Users, Gamepad2, Code, Heart, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function AboutSection() {
  const skills = ["Content Creation", "Gaming", "Community Building", "Video Editing", "Live Streaming", "Social Media"]

  const achievements = [
    { icon: Youtube, label: "YouTube Creator", value: "50+ Subscribers" },
    { icon: Users, label: "Community", value: "500+ Followers" },
    { icon: Gamepad2, label: "Games Played", value: "100+" },
    { icon: Code, label: "Projects", value: "10+" },
  ]

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 gaming-heading">Über mich</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Hey! Ich bin Jay, ein leidenschaftlicher Content Creator und Gamer. Hier erfährst du mehr über meine Reise
            und was mich antreibt.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <Card className="gaming-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 gaming-subheading">
                  <Heart className="h-5 w-5 text-red-500" />
                  Meine Geschichte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Seit mehr als 1 Jahr bin ich leidenschaftlich dabei, Content zu erstellen und eine Community
                  aufzubauen. Was als Hobby begann, ist zu meiner Leidenschaft geworden.
                </p>
                <p className="text-muted-foreground">
                  Ich liebe es, neue Spiele zu entdecken, spannende Inhalte zu erstellen und mit meiner Community zu
                  interagieren. Jeder Tag bringt neue Herausforderungen und Möglichkeiten.
                </p>
                <p className="text-muted-foreground">
                  Mein Ziel ist es, unterhaltsame und authentische Inhalte zu schaffen, die Menschen inspirieren und zum
                  Lächeln bringen.
                </p>
              </CardContent>
            </Card>

            <Card className="gaming-card">
              <CardHeader>
                <CardTitle className="gaming-subheading">Skills & Interessen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="gaming-badge">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <div className="w-80 h-80 rounded-full overflow-hidden gaming-border bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                <Image src="/images/jay-logo.png" alt="Jay Logo" fill className="object-contain p-8 gaming-glow" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-3">
                <Star className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {achievements.map((achievement, index) => (
            <Card key={index} className="gaming-card text-center">
              <CardContent className="pt-6">
                <achievement.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-1">{achievement.label}</h3>
                <p className="text-2xl font-bold text-primary">{achievement.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Card className="gaming-card max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="gaming-subheading">Lass uns connecten!</CardTitle>
              <CardDescription>Folge mir auf meinen Social Media Kanälen und werde Teil der Community</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild className="gaming-button">
                  <Link href="/youtube">
                    <Youtube className="h-4 w-4 mr-2" />
                    YouTube
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gaming-button-outline bg-transparent">
                  <Link href="/tiktok">TikTok</Link>
                </Button>
                <Button asChild variant="outline" className="gaming-button-outline bg-transparent">
                  <Link href="/discord">Discord</Link>
                </Button>
                <Button asChild variant="outline" className="gaming-button-outline bg-transparent">
                  <Link href="/games">
                    <Gamepad2 className="h-4 w-4 mr-2" />
                    Games
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

// Named export für Kompatibilität
export { AboutSection }
