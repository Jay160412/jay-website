"use server"

export async function sendContactMessage(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const subject = formData.get("subject") as string
    const message = formData.get("message") as string

    // Validation
    if (!name || !subject || !message) {
      return {
        success: false,
        error: "Bitte fülle alle Pflichtfelder aus.",
      }
    }

    // Create email content
    const emailContent = `
Neue Support-Anfrage von der Website:

Name: ${name}
E-Mail: ${email || "Nicht angegeben"}
Betreff: ${subject}

Nachricht:
${message}

---
Gesendet über das Kontaktformular der Website
Zeitstempel: ${new Date().toLocaleString("de-DE")}
    `.trim()

    // Send email using a service like Resend, SendGrid, or Nodemailer
    // For now, we'll simulate the email sending

    // In a real implementation, you would use something like:
    /*
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@jay-website.de',
        to: 'anonym160412@gmail.com',
        subject: `Support-Anfrage: ${subject}`,
        text: emailContent,
      }),
    })
    */

    // For demo purposes, we'll just log it and return success
    console.log("Contact form submission:", {
      name,
      email: email || "Not provided",
      subject,
      message,
      timestamp: new Date().toISOString(),
    })

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      success: true,
      message: "Nachricht erfolgreich gesendet!",
    }
  } catch (error) {
    console.error("Error sending contact message:", error)
    return {
      success: false,
      error: "Ein technischer Fehler ist aufgetreten. Bitte versuche es später erneut.",
    }
  }
}
