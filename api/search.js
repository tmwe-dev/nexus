'use strict';
const { searchContacts } = require('../modules/crm/contacts/service');
const { searchAccounts } = require('../modules/crm/accounts/service');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!q) return res.status(400).json({ error: 'SEARCH_QUERY_REQUIRED' });
  try {
    const [contacts, accounts] = await Promise.all([
      searchContacts({ search: q, limit: 25, offset: 0 }),
      searchAccounts({ search: q, limit: 25, offset: 0 })
    ]);
    const c = (contacts.items || []).map(item => ({ type: 'contact', item }));
    const a = (accounts.items || []).map(item => ({ type: 'account', item }));
    return res.status(200).json({ contract: 'nexus.search.v1', query: q, total: c.length + a.length, items: [...c, ...a] });
  } catch (error) {
    return res.status(502).json({ error: 'NEXUS_SEARCH_UNAVAILABLE', message: error instanceof Error ? error.message : String(error) });
  }
};
