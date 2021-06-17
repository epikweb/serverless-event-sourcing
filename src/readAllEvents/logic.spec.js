const {rollupAggregates, reorderAggregateEventsBySequence, unwrapOrderedEvents} = require("./logic");
const {pipe} = require("../../examples/wallet/auxiliary");
const {assert} = require('chai')
describe('Read all events logic', () => {
  it('should reorder events by aggregate id, then by sequence number', () =>
    pipe(
      () => [
        { aggregateId: '11', type: 'Debited', sequenceNumber: 2 },
        { aggregateId: '1', type: 'Debited', sequenceNumber: 2 },
        { aggregateId: '21', type: 'Debited', sequenceNumber: 2 },


        { aggregateId: '21', type: 'Credited', sequenceNumber: 1 },
        { aggregateId: '1', type: 'Credited', sequenceNumber: 1 },
        { aggregateId: '11', type: 'Credited', sequenceNumber: 1 },
      ],
      rollupAggregates,
      reorderAggregateEventsBySequence,
      unwrapOrderedEvents,
      orderedEvents => assert.deepEqual(orderedEvents, [
        { aggregateId: '21', type: 'Credited', sequenceNumber: 1 },
        { aggregateId: '21', type: 'Debited', sequenceNumber: 2 },
        { aggregateId: '1', type: 'Credited', sequenceNumber: 1 },
        { aggregateId: '1', type: 'Debited', sequenceNumber: 2 },
        { aggregateId: '11', type: 'Credited', sequenceNumber: 1 },
        { aggregateId: '11', type: 'Debited', sequenceNumber: 2 }
      ])
    )()
  )
})