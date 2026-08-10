const { listEvidence, recordEvidence, hydrateEvidence } = require('../../modules/migration/evidenceRegistry');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const capability = String(req.query.capability || '').trim();
    let hydration = { durable: false, loaded: 0 };
    try { hydration = await hydrateEvidence(capability || null); } catch (error) { hydration = { durable: false, loaded: 0, error: error.message }; }
    return res.status(200).json({ contract: 'migration.evidence-list.v2', hydration, items: listEvidence(capability || null) });
  }
  if (req.method === 'POST') {
    try { return res.status(201).json(recordEvidence(req.body || {})); }
    catch (error) { return res.status(400).json({ error: error.message }); }
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
