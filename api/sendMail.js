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

    const adminEmail = 'Souravshakya951@gmail.com'
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Email to Admin
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `📬 New Message from ${name} - Shakya Labs Contact Form`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📬 New Contact Form Submission</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Shakya Labs</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">You have received a new message from someone interested in your services:</p>
            
            <div style="background-color: #f0f4ff; padding: 20px; border-left: 4px solid #667eea; border-radius: 5px; margin-bottom: 20px;">
              <p style="margin: 10px 0;"><strong>👤 From:</strong> <span style="color: #667eea;">${name}</span></p>
              <p style="margin: 10px 0;"><strong>📧 Email:</strong> <span style="color: #667eea;"><a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></span></p>
              <p style="margin: 10px 0;"><strong>📅 Date:</strong> ${currentDate}</p>
            </div>

            <div style="background-color: #fff5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
              <h3 style="color: #764ba2; margin-top: 0;">💭 Message:</h3>
              <p style="color: #333; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p>
            </div>

            <div style="margin-bottom: 20px; border-radius: 5px; overflow: hidden; text-align: center;">
              <p style="color: #667eea; font-size: 14px; margin: 10px 0; font-weight: bold;">📹 Special Message Video:</p>
              <iframe
                src="https://drive.google.com/file/d/1zpuoQTlKka3OnH9A4iYM_AJuDY255r6E/preview"
                style="width:100%;max-width:500px;height:300px;border:2px solid #667eea;border-radius:5px;display:inline-block;"
                allow="autoplay"
                allowfullscreen>
              </iframe>
            </div>

            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p style="margin: 0; color: #2e7d32; font-size: 14px;">
                <strong>💡 Quick Action:</strong> Reply directly to this email or use the email address provided above to respond to the user.
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              This is an automated notification from Shakya Labs Contact Form.<br>
              Please do not reply to this email address. Use the provided contact email above.
            </p>
          </div>
        </div>
      `,
      replyTo: email,
    }

    // Email to User (Confirmation)
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `✅ We Received Your Message - Shakya Labs`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">✅ Message Received!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for contacting Shakya Labs</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hi <strong>${name}</strong>,</p>
            
            <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
              Thank you for reaching out to us! We've received your message and truly appreciate you taking the time to connect with Shakya Labs.
            </p>

            <div style="background-color: #f0f4ff; padding: 20px; border-left: 4px solid #667eea; border-radius: 5px; margin-bottom: 20px;">
              <h3 style="color: #667eea; margin-top: 0;">📋 Your Message Summary:</h3>
              <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 10px 0;"><strong>Submitted:</strong> ${currentDate}</p>
            </div>

            <div style="background-color: #fff5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
              <h3 style="color: #764ba2; margin-top: 0;">Your Message:</h3>
              <p style="color: #333; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; margin: 0;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p>
            </div>

            <div style="margin-bottom: 20px; border-radius: 5px; overflow: hidden; text-align: center;">
              <p style="color: #667eea; font-size: 14px; margin: 10px 0; font-weight: bold;">📹 Special Message Video:</p>
              <iframe
                src="https://drive.google.com/file/d/1zpuoQTlKka3OnH9A4iYM_AJuDY255r6E/preview"
                style="width:100%;max-width:500px;height:300px;border:2px solid #667eea;border-radius:5px;display:inline-block;"
                allow="autoplay"
                allowfullscreen>
              </iframe>
            </div>

            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
              <h3 style="color: #1976d2; margin-top: 0;">⏱️ What's Next?</h3>
              <p style="color: #333; margin: 0; line-height: 1.6;">
                Our team will review your message and get back to you within <strong>24-48 hours</strong>. We're committed to providing you with the best possible response and solutions for your needs.
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #555; font-size: 15px; margin-bottom: 10px;">
              If you have any additional questions in the meantime, feel free to reply to this email.
            </p>

            <p style="color: #555; font-size: 15px; margin-bottom: 20px;">
              Best regards,<br>
              <strong style="color: #667eea;">Shakya Labs Team</strong><br>
              <em>Building the Future with Precision</em>
            </p>

            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                💕 Built with Love | 🚀 Modern Engineering | 🎯 Precision Solutions
              </p>
            </div>
          </div>
        </div>
      `,
    }

    // Send both emails
    await transporter.sendMail(adminMailOptions)
    await transporter.sendMail(userMailOptions)

    return res.status(200).json({ 
      message: 'Thank you! Your message has been received. We will get back to you soon!' 
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return res.status(500).json({ 
      message: 'Failed to send message. Please try again later.' 
    })
  }
}
