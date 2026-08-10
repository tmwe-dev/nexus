const { readContact } = require('../../modules/crm/contacts/service');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ error: 'CONTACT_ID_REQUIRED' });
  try {
    const payload = await readContact(id);
    if (!payload) return res.status(404).json({ error: 'CONTACT_NOT_FOUND' });
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(502).json({
      error: 'CRM_CONTACT_READ_UNAVAILABLE',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
