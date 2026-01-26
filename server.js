import express from 'express'
import nodemailer from 'nodemailer'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'Souravshakya951@gmail.com',
    pass: 'nzrwngwreqialorz'
  }
})

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email service error:', error)
  } else {
    console.log('✅ Email service ready to send messages')
  }
})

// Send email route
app.post('/api/send-message', async (req, res) => {
  const { name, email, message } = req.body

  // Validation
  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false, 
      error: 'All fields are required' 
    })
  }

  // Email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid email format' 
    })
  }

  try {
    // Email to you (admin)
    const adminMailOptions = {
      from: 'Souravshakya951@gmail.com',
      to: 'Souravshakya951@gmail.com',
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0; border-bottom: 3px solid #667eea; padding-bottom: 10px;">📬 New Contact Form Submission</h2>
            
            <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
              <p style="margin: 10px 0; color: #555;"><strong>👤 Name:</strong> ${name}</p>
              <p style="margin: 10px 0; color: #555;"><strong>📧 Email:</strong> <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></p>
            </div>

            <div style="margin: 20px 0;">
              <h3 style="color: #333; margin-bottom: 10px;">💬 Message:</h3>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; line-height: 1.6; color: #555; white-space: pre-wrap; word-wrap: break-word;">
                ${message}
              </div>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 5px 0;">
                This message was sent from your Shakya Labs website contact form
              </p>
              <p style="color: #667eea; font-weight: bold; margin: 10px 0;">
                🚀 Shakya Labs - Built with Love
              </p>
            </div>
          </div>
        </div>
      `
    }

    // Confirmation email to user
    const userMailOptions = {
      from: 'Souravshakya951@gmail.com',
      to: email,
      subject: '✅ We Received Your Message - Shakya Labs',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">Thank You! 🎉</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We received your message</p>
          </div>

          <div style="background: white; padding: 30px; margin-top: -1px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Hi <strong>${name}</strong>,
            </p>

            <p style="color: #555; font-size: 14px; line-height: 1.6;">
              Thank you for reaching out to Shakya Labs! We've received your message and our team will get back to you as soon as possible.
            </p>

            <div style="background: #f0f4ff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 5px 0; color: #555;">
                <strong>📧 Your Email:</strong> ${email}
              </p>
              <p style="margin: 5px 0; color: #555;">
                <strong>⏰ Sent At:</strong> ${new Date().toLocaleString()}
              </p>
            </div>

            <p style="color: #555; font-size: 14px; line-height: 1.6;">
              We're excited to discuss your project and how Shakya Labs can help transform your ideas into reality. Expect a response within 24 hours.
            </p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 10px 0;">
                Best regards,<br>
                <strong>The Shakya Labs Team</strong>
              </p>
              <p style="color: #667eea; font-weight: bold; margin: 15px 0 0 0; font-size: 14px;">
                🚀 Ancient Wisdom. Modern Engineering.
              </p>
            </div>
          </div>
        </div>
      `
    }

    // Send both emails
    await transporter.sendMail(adminMailOptions)
    await transporter.sendMail(userMailOptions)

    console.log(`✅ Email sent successfully from ${email}`)
    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully! We will get back to you soon.' 
    })

  } catch (error) {
    console.error('❌ Error sending email:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send email. Please try again later.' 
    })
  }
})

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
