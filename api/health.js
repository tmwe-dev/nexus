module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    service: 'tmwe-nexus',
    status: 'ok',
    version: '0.1.0',
    environment: process.env.NEXUS_ENV || 'unknown',
    timestamp: new Date().toISOString()
  });
};
