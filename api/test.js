module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  
  // Check environment variables
  const hasEmailUser = !!process.env.EMAIL_USER
  const hasEmailPass = !!process.env.EMAIL_PASS
  
  return res.status(200).json({
    status: 'ok',
    message: 'API is working',
    environment: {
      nodeEnv: process.env.NODE_ENV,
      emailConfigured: hasEmailUser && hasEmailPass,
      emailUserSet: hasEmailUser,
      emailPassSet: hasEmailPass,
      timestamp: new Date().toISOString()
    }
  })
}
