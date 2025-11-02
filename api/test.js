console.log('🚀 TEST.JS FILE LOADED AT:', new Date().toISOString());

module.exports = async (req, res) => {
  console.log('🔥 TEST ENDPOINT HIT - Method:', req.method, 'Time:', new Date().toISOString());
  
  res.status(200).json({
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString(),
    method: req.method
  });
};