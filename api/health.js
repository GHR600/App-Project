// Vercel API function for health check
module.exports = (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    service: 'AI Journaling API',
    anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
    version: '1.0.0'
  });
};