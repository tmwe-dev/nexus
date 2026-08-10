# Nexus Identity Resolution Policy

## Purpose

Nexus Identity connects references that point to the same real company or person without becoming a new master database.

## Company resolution priority

1. WCA partner ID: authoritative within WCA scope.
2. VAT/legal identifier: authoritative within the matching jurisdiction/source scope.
3. Domain: strong evidence, not universal proof.
4. Normalized company name + compatible country: probable evidence.
5. Name only with country conflict: weak evidence.

## Contact resolution priority

1. Exact normalized email.
2. Exact normalized phone with at least 8 digits.
3. Same normalized name inside the same resolved company.
4. Name alone is insufficient.

## Status

- `resolved`: strong source identifier or very high-confidence evidence.
- `probable`: useful match but still reviewable.
- `provisional`: temporary federation reference only.

## Provenance

Every identity response must expose all source references that contributed to the result. Source records remain source-owned and are not copied as Nexus truth.

## Safety

Resolvers are pure/read-only functions. They do not update Navigator, WCA App, Report Aziende, COBRA, Funnemail, BarTalk or any other source application.
