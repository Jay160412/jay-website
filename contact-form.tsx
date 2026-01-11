"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Send, CheckCircle, AlertCircle } from "lucide-react"
import { sendContactMessage } from "@/app/actions/contact"

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setStatus("idle")

    try {
      const result = await sendContactMessage(formData)

      if (result.success) {
        setStatus("success")
        setMessage("Deine Nachricht wurde erfolgreich gesendet! Ich antworte so schnell wie möglich.")
        // Reset form
        const form = document.getElementById("contact-form") as HTMLFormElement
        form?.reset()
      } else {
        setStatus("error")
        setMessage(result.error || "Ein Fehler ist aufgetreten. Bitte versuche es später erneut.")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <form id="contact-form" action={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" className="block text-sm font-medium mb-2">
            Name *
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            required
            className="w-full bg-background/50 focus:ring-2 focus:ring-purple-500"
            placeholder="Dein Name"
          />
        </div>

        <div>
          <Label htmlFor="email" className="block text-sm font-medium mb-2">
            E-Mail (optional)
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            className="w-full bg-background/50 focus:ring-2 focus:ring-purple-500"
            placeholder="deine@email.de (für Rückantwort)"
          />
        </div>

        <div>
          <Label htmlFor="subject" className="block text-sm font-medium mb-2">
            Betreff *
          </Label>
          <Input
            type="text"
            id="subject"
            name="subject"
            required
            className="w-full bg-background/50 focus:ring-2 focus:ring-purple-500"
            placeholder="Worum geht es?"
          />
        </div>

        <div>
          <Label htmlFor="message" className="block text-sm font-medium mb-2">
            Nachricht *
          </Label>
          <Textarea
            id="message"
            name="message"
            required
            rows={4}
            className="w-full bg-background/50 focus:ring-2 focus:ring-purple-500"
            placeholder="Deine Nachricht..."
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full gaming-button">
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Wird gesendet...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Nachricht senden
            </>
          )}
        </Button>
      </form>

      {/* Status Messages */}
      {status === "success" && (
        <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-green-300 text-sm">{message}</p>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-red-300 text-sm">{message}</p>
        </div>
      )}

      <p className="text-sm text-muted-foreground text-center mt-4">
        💡 Deine Nachricht wird sicher übertragen und vertraulich behandelt.
      </p>
    </div>
  )
}
