const {eventStore, setup} = require("../../test/harness");
const {assert} = require('chai')

describe('write integration tests', () => {
  beforeEach(() => setup())
  it('should write 3 events to an aggregate + snapshot it', () =>
    eventStore.write({
      aggregateId: 'wallet-123',
      events: [
        { type: 'Credited', payload: { amount: 5 }},
        { type: 'Debited', payload: { amount: 5 }},
        { type: 'Credited', payload: { amount: 5 }},
      ],
      snapshot: {
        balance: 15
      },
      expectedVersion: 0
    })
      .then(
        () => eventStore.read({ aggregateId: 'wallet-123' })
      ).then(
      ({ events, expectedVersion }) => {
        assert.equal(expectedVersion, 4)
      }
    )
  )
  it('should protect concurrent access to a single stream by retrying 10 times over ~2 sec', () =>

    Promise.all(
      [...new Array(5)].map(
        _ => eventStore.write({
          aggregateId: '123',
          sequenceNumberRead: 0,
          events: [
            {
              type: 'Event',
              payload: {
                test: true
              }
            }
          ],
          expectedVersion: 0
        })
      )
    )
      .then(() => eventStore.read({ aggregateId: '123' }))
      .then(({ expectedVersion }) => assert.equal(expectedVersion, 5))


  ).timeout(15000)
})