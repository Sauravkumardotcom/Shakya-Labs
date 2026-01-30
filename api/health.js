module.exports = function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Vercel API functions are working!',
    timestamp: new Date().toISOString()
  });
};
