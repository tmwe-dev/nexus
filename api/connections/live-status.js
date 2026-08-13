'use strict';

const { probe:genericProbe } = require('../../modules/connections/liveConnector');
const { probe:funnemailProbe } = require('../../modules/funnemail/legacyAdapter');
const { capabilitiesForOwner } = require('../../registry/capabilities');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const [funnemail, bartalk] = await Promise.all([funnemailProbe(), genericProbe('bartalk')]);
  return res.status(200).json({
    contract:'connections.live-status.v3',
    services:[
      { ...funnemail, capabilities:capabilitiesForOwner('funnemail').map(item => item.name) },
      { ...bartalk, capabilities:capabilitiesForOwner('bartalk').map(item => item.name) }
    ],
    excluded:[{ service:'tmwe2', reason:'excluded-until-final-phase', probed:false }],
    originals_modified:false
  });
};
