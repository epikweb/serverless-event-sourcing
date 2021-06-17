const {unmarshalEvent} = require("../logic");
const {Maybe} = require("../auxiliary");
const {pipe} = require("../auxiliary");

const unmarshalEvents = res => res.Items.map(unmarshalEvent)

const appendEventToExistingAggregate = (aggregates, event, existingAggregate) => [...aggregates.filter(s => s.aggregateId !== existingAggregate.aggregateId), ({...existingAggregate, events: [...existingAggregate.events, event] }) ]
const addNewAggregate = (aggregates, event) => [...aggregates, {aggregateId: event.aggregateId, events: [event] } ]

const rollupAggregates = outOfOrderEvents => outOfOrderEvents.reduce(
  (aggregates, event) => pipe(
    () => Maybe(aggregates.find(s => s.aggregateId === event.aggregateId)),
    maybeAggregate => maybeAggregate.exists ? appendEventToExistingAggregate(aggregates, event, maybeAggregate.value) : addNewAggregate(aggregates, event)
  )()
, [])

const reorderAggregateEventsBySequence = aggregates => aggregates.reduce(
  (aggregates, aggregate) => [...aggregates, {...aggregate, events: [...aggregate.events].sort((a, b) => a.sequenceNumber - b.sequenceNumber) } ]
, [])

const unwrapOrderedEvents = orderedAggregates => orderedAggregates.reduce(
  (orderedEvents, { aggregateId, events }) => {
    return [...orderedEvents, ...events.map(e => ({ ...e, aggregateId }))]
  }, [])

const tap = msg => data => {
  console.log(`[${msg}]: `, data)
  return data
}

module.exports = {
  unmarshalEvents,
  rollupAggregates,
  reorderAggregateEventsBySequence,
  unmarshalEvent,
  unwrapOrderedEvents,
  tap
}