const { readAccount } = require('../../modules/crm/accounts/service');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ error: 'ACCOUNT_ID_REQUIRED' });
  try {
    const account = await readAccount(id, { limit: req.query.limit });
    if (!account) return res.status(404).json({ error: 'ACCOUNT_NOT_FOUND' });
    return res.status(200).json({ contract: 'crm.account.read.v1', account });
  } catch (error) {
    return res.status(502).json({
      error: 'CRM_ACCOUNT_READ_UNAVAILABLE',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
