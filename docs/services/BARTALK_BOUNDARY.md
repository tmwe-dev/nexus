# BarTalk / Voice Translator Application Boundary

Repository: `tmwe-dev/voice-translator2`.

## Source reviewed

The repository is a standalone voice-translation application with a Vercel-oriented application subtree.

## Nexus ownership rule

BarTalk remains an independent communications application. Nexus should connect to it through session/capability contracts, not copy its UI or P2P communication implementation.

Target capability families after deeper source mapping:
- communication session create/join;
- translated text exchange;
- voice translation session;
- TaxiTalk destination handoff;
- presence/session status where safe and needed.

## Privacy rule

Nexus must not become a message-content store. Communication content remains governed by BarTalk's privacy/P2P architecture. Nexus may carry identifiers, capability tokens and operational metadata only where required.

## Does not own

BarTalk does not own CRM state, WCA data, company research data or email state.
