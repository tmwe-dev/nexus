const STAGES = ['new','first_touch_sent','holding','engaged','qualified','negotiation','converted'];
const TERMINAL = ['archived','blacklisted'];

const GATES = [
  { from: 'new', to: 'first_touch_sent', trigger: 'first_outbound', automatic: true },
  { from: 'first_touch_sent', to: 'holding', trigger: 'no_reply_3d', automatic: true },
  { from: 'first_touch_sent', to: 'engaged', trigger: 'reply_received', automatic: true },
  { from: 'holding', to: 'engaged', trigger: 'reply_received', automatic: true },
  { from: 'holding', to: 'archived', trigger: 'stale_90d_3_attempts', automatic: false },
  { from: 'engaged', to: 'qualified', trigger: 'explicit_need', automatic: false },
  { from: 'qualified', to: 'negotiation', trigger: 'proposal_sent', automatic: false },
  { from: 'negotiation', to: 'converted', trigger: 'order_or_contract', automatic: false }
];

function canTransition(from, to) {
  if (!from || !to || from === to) return false;
  if (TERMINAL.includes(to)) return true;
  const a = STAGES.indexOf(from);
  const b = STAGES.indexOf(to);
  return a >= 0 && b > a;
}

module.exports = { STAGES, TERMINAL, GATES, canTransition };
