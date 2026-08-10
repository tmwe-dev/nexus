const DEFAULT_POLICIES = Object.freeze({
  cobra: { failure_threshold: 3, reset_timeout_ms: 30000, fallback: 'continue_without_research' },
  funnemail: { failure_threshold: 3, reset_timeout_ms: 30000, fallback: 'queue_or_draft_only' },
  wca: { failure_threshold: 3, reset_timeout_ms: 30000, fallback: 'continue_without_wca_enrichment' },
  ai: { failure_threshold: 3, reset_timeout_ms: 20000, fallback: 'continue_without_ai' },
  bartalk: { failure_threshold: 3, reset_timeout_ms: 30000, fallback: 'disable_realtime_translation_features' },
  report_aziende: { failure_threshold: 3, reset_timeout_ms: 30000, fallback: 'connection_only_deferred' }
});

function getResiliencePolicy(service) {
  return DEFAULT_POLICIES[service] || { failure_threshold: 3, reset_timeout_ms: 30000, fallback: 'continue_with_partial_result' };
}

module.exports = { DEFAULT_POLICIES, getResiliencePolicy };
