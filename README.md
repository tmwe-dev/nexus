# TMWE Nexus

Federation layer for independent TMWE applications, data sources and shared capabilities.

## Architecture rule

**Independent applications. Shared contracts. Connected data. Cobra orchestration.**

Nexus is not a new monolith and does not become owner of operational datasets.

## Initial modules

- WCA App — source for network forwarder addresses, commercial contacts and business cards
- Report Aziende — Italian company data source
- Funnemail — email service
- BarTalk — multilingual communications
- Scraper / Research — external research services
- CRM — independent commercial relationship module
- AI Platform — shared AI capabilities
- Agent Framework — agents and tools
- Cobra — orchestration of simple and complex workflows
- Navigator — intelligence workspace migrating toward capability consumption

TMWE2 is explicitly excluded from the current migration and will be connected last.

## First implementation

The first connector is WCA and is read-only. No production source data or secrets are stored in this repository.
