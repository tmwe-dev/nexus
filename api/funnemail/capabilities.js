const CAPABILITIES = [
  { name: 'email.message.search.v1', source: 'channel_messages', status: 'nexus-adapter-ready', route:'/api/email/messages' },
  { name: 'email.message.read.v1', source: 'channel_messages', status: 'nexus-adapter-ready', route:'/api/email/message?id=' },
  { name: 'email.draft.create.v1', source: 'email_drafts', status: 'nexus-adapter-ready', route:'/api/email/drafts' },
  { name: 'email.send.v1', source: 'funnemail-send-direct', status: 'nexus-adapter-ready', route:'/api/email/send' },
  { name: 'email.sync.v1', source: 'funnemail-imap-sync', status: 'nexus-adapter-ready', route:'/api/email/sync' },
  { name: 'email.classify.v1', source: 'funnemail-classify', status: 'nexus-adapter-ready', route:'/api/email/classify' }
];

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    service: 'funnemail',
    status: 'nexus-adapters-complete-runtime-pending',
    capabilities: CAPABILITIES,
    rules: [
      'Funnemail remains owner of email-domain state.',
      'Nexus accesses Funnemail only through the service boundary.',
      'The original Funnemail repository is not modified.',
      'Live completion requires the Funnemail boundary URL/token and corresponding service endpoints.'
    ]
  });
};
