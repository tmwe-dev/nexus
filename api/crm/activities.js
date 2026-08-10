const { readContactActivities } = require('../../modules/crm/activities/service');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const contactId = typeof req.query.contact_id === 'string' ? req.query.contact_id : '';
  if (!contactId) return res.status(400).json({ error: 'CONTACT_ID_REQUIRED' });
  try {
    const payload = await readContactActivities(contactId, req.query.limit);
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(502).json({ error: 'CRM_ACTIVITIES_UNAVAILABLE', message: error instanceof Error ? error.message : String(error) });
  }
};
