import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' })
  }

  const { name, email, message } = req.body

  // Validate input
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'Souravshakya951@gmail.com',
      subject: `New Message from ${name} - Shakya Labs Contact Form`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>This is an automated message from Shakya Labs Contact Form</em></p>
      `,
      replyTo: email,
    }

    await transporter.sendMail(mailOptions)
    return res.status(200).json({ message: 'Email sent successfully!' })
  } catch (error) {
    console.error('Error sending email:', error)
    return res.status(500).json({ message: 'Failed to send email. Please try again later.' })
  }
}
