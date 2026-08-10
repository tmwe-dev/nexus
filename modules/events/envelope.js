function createEventEnvelope({ event_id, event_type, occurred_at, producer, subject = null, correlation_id = null, causation_id = null, payload = {} } = {}) {
  if (!event_type || !producer) throw new Error('EVENT_TYPE_AND_PRODUCER_REQUIRED');
  return {
    contract: 'event.envelope.v1',
    event_id: event_id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    event_type,
    occurred_at: occurred_at || new Date().toISOString(),
    producer,
    subject,
    correlation_id,
    causation_id,
    payload
  };
}

module.exports = { createEventEnvelope };
