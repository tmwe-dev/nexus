# Graceful Degradation Matrix

Nexus modules must remain usable when optional external capabilities fail.

| Service | Failure impact | Fallback | User/result status |
|---|---|---|---|
| COBRA / Research | enrichment unavailable | continue with CRM + WCA + Identity data | partial |
| Funnemail | sending/sync unavailable | preserve draft/action intent; do not fake delivery | degraded |
| WCA | network source unavailable | continue with CRM/Identity data already available | partial |
| AI Platform | model unavailable | use deterministic/non-AI logic where available | degraded |
| BarTalk | realtime communication unavailable | disable realtime/translation capability only | degraded |
| Report Aziende | source unavailable/not built | ignore source and continue | partial |

## Circuit states

- `closed`: calls flow normally.
- `open`: calls are short-circuited and the documented fallback is returned.
- `half-open`: one or more recovery probes are allowed after the reset timeout.

## Rules

1. Never report a partial result as complete.
2. Never fabricate missing data.
3. Never mutate source systems as part of fallback handling.
4. Failures in one service must not cascade into unrelated modules.
5. The fallback belongs to the caller's business flow; the circuit breaker only decides whether a dependency should be called.
6. Recovery must be automatic after a successful half-open call.

Only Nexus owns this resilience policy. Original applications remain untouched.
