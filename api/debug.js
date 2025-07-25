module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return res.status(200).json({
    status: 'OK',
    message: 'Debug endpoint working',
    env_check: {
      ESPN_S2: process.env.ESPN_S2 ? 'SET' : 'MISSING',
      ESPN_SWID: process.env.ESPN_SWID ? 'SET' : 'MISSING',
      ESPN_LEAGUE_ID: process.env.ESPN_LEAGUE_ID ? 'SET' : 'MISSING',
      MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'MISSING'
    },
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};