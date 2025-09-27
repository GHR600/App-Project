const express = require('express');
const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      supabase: !!process.env.SUPABASE_URL
    }
  });
});

module.exports = router;