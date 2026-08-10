const CAPABILITIES = [
  { name: 'email.message.search.v1', source: 'channel_messages', status: 'contract-design' },
  { name: 'email.message.read.v1', source: 'channel_messages', status: 'contract-design' },
  { name: 'email.draft.create.v1', source: 'email_drafts', status: 'contract-design' },
  { name: 'email.send.v1', source: 'funnemail-send-direct', status: 'source-proven' },
  { name: 'email.sync.v1', source: 'funnemail-imap-sync', status: 'source-proven' },
  { name: 'email.classify.v1', source: 'funnemail-classify', status: 'source-proven-domain-specific' }
];

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    service: 'funnemail',
    status: 'source-mapped-contract-design',
    capabilities: CAPABILITIES,
    rules: [
      'Funnemail remains owner of email-domain state.',
      'Nexus does not read Funnemail tables directly in the final architecture.',
      'Generic AI/model routing will be extracted only after caller mapping.'
    ]
  });
};
