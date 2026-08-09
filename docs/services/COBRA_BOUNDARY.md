# COBRA Service Boundary

COBRA is the single orchestration and browser-action engine for Nexus.

## Source reviewed

Repository: `tmwe-dev/COBRA`.

Observed architecture:
- natural-language request intake;
- SuperMario intent/tool/model routing;
- AI provider cascade;
- 68 tools;
- browser automation through Chrome extension;
- web reading/scraping;
- risk guards, domain allow-listing and confirmations;
- memory and learned facts;
- audit chain;
- IMAP/SMTP email tooling.

## Nexus ownership

COBRA owns orchestration, web research execution and browser-action execution.

Target capabilities:
- `workflow.execute.v1`
- `web.research.v1`
- `browser.execute.v1`

## Explicit architecture decision

There is no separate Firescrape or standalone Scraper service in the Nexus target architecture. Research/scraping/browser work is exposed through COBRA capabilities.

## Does not own

COBRA must not become the source of truth for:
- WCA partner records;
- Report Aziende company facts;
- CRM relationship state;
- Funnemail mailbox state;
- BarTalk sessions;
- Navigator presentation state.

COBRA composes capabilities. It does not absorb their domain data.
