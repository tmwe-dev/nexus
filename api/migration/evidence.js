const { listEvidence, recordEvidence } = require('../../modules/migration/evidenceRegistry');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const capability = String(req.query.capability || '').trim();
    return res.status(200).json({ contract: 'migration.evidence-list.v1', items: listEvidence(capability || null) });
  }
  if (req.method === 'POST') {
    try { return res.status(201).json(recordEvidence(req.body || {})); }
    catch (error) { return res.status(400).json({ error: error.message }); }
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
