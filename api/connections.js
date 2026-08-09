const CONNECTIONS = [
  {
    id: 'wca',
    name: 'WCA App',
    kind: 'data-source',
    status: 'configured',
    mode: 'read',
    capabilities: ['partner.search.v1', 'partner.read.v1', 'contact.search.v1', 'contact.read.v1', 'business-card.read.v1']
  },
  { id: 'report-aziende', name: 'Report Aziende', kind: 'data-source', status: 'planned', mode: 'read', capabilities: [] },
  { id: 'funnemail', name: 'Funnemail', kind: 'application', status: 'planned', capabilities: [] },
  { id: 'bartalk', name: 'BarTalk', kind: 'application', status: 'planned', capabilities: [] },
  { id: 'scraper', name: 'Scraper', kind: 'service', status: 'planned', capabilities: [] },
  { id: 'cobra', name: 'Cobra', kind: 'service', status: 'planned', capabilities: [] }
];

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ service: 'tmwe-nexus', connections: CONNECTIONS });
};
