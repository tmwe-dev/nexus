'use strict';
const { probe } = require('../../modules/connections/liveConnector');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const [funnemail, bartalk] = await Promise.all([
    probe('FUNNEMAIL'),
    probe('BARTALK')
  ]);
  return res.status(200).json({
    contract: 'connections.live-status.v1',
    services: [
      { ...funnemail, capabilities: ['email:read','email:send','email:sync'] },
      { ...bartalk, capabilities: ['communication:session','communication:handoff'] }
    ],
    originals_modified: false
  });
};
