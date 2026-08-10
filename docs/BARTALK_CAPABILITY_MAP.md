# BarTalk / Voice Translator Capability Map

Repository reviewed: `tmwe-dev/voice-translator2`.

The Vercel application exposes 36 live API routes. Relevant proven route families include `/api/health`, `/api/conversation`, `/api/messages`, `/api/room`, `/api/stanza-video`, `/api/transcribe`, `/api/translate`, `/api/tts`, `/api/contacts` and user/session routes.

## Nexus target capabilities

```text
communication.health.v1
communication.session.read.v1
communication.message.exchange.v1
translation.text.v1
translation.voice.v1
taxitalk.destination-handoff.v1
```

## Privacy boundary

Nexus must not become a message-content store. Session content, translated messages and voice data remain governed by BarTalk. Nexus may hold capability metadata, connection state and opaque session identifiers only when needed.

## Source mapping

- health → `/api/health`
- conversation/session → `/api/conversation`, `/api/room`, `/api/stanza-video`
- message exchange → `/api/messages`, `/api/chat-action`
- text translation → `/api/translate`, `/api/translate-consensus`
- voice translation → `/api/transcribe`, `/api/tts`, `/api/tts-edge`, `/api/tts-elevenlabs`
- contacts → `/api/contacts`

TaxiTalk destination handoff remains a target contract until its exact implementation route is verified; Nexus must not invent or proxy an unverified endpoint.
