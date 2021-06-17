const {reconcileAggregate} = require("../src/reconcileAggregate");
const {appendToStream} = require("../src/appendToStream");
const {truncateAllTables} = require("../src/truncateTables");
const {readLatestStreamForwards} = require("../src/readLatestStreamForwards");
const { assert } = require('chai')

describe('Reconciliation integration tests', () => {
  it('should return an empty array of events and expected version 0 if not found', () =>
    truncateAllTables()
      .then(
        () => readLatestStreamForwards('wallet-123')
      ).then(
      res => assert.deepEqual(res, { events: [], expectedVersion: 0, streamId: 'wallet-123' })
    )
  )
  it('should find the aggregates latest stream, and reconcile its state into a new stream, keeping sequence numbers increasing', () =>
    truncateAllTables()
      .then(
        () => appendToStream({
          aggregateId: 'wallet-123',
          aggregateName: 'wallet',
          streamId: 'wallet-123',
          expectedVersion: 0,
          events: [
            {
              type: 'Event',
              payload: {
                hi: true
              }
            }
          ]
        })
      )
      .then(
        () =>
          reconcileAggregate({
            aggregateId: 'wallet-123',
            getState: events => ({ numberOfEvents: events.length })
          })
      )
      .then(() => readLatestStreamForwards('wallet-123'))
      .then(
        ({ expectedVersion, events }) => {
          assert.deepEqual(expectedVersion, 2)
          assert.deepEqual(events.length, 1)
          assert.deepEqual(events[0].type, 'Reconciled')
        }
      )
  ).timeout(15000)
  it('should reconcile an aggregate while 10 another clients are trying to write events ' +
    'in this case, the client should retry, realize the current stream was tombstoned, then append to the newly reconciled one', () =>
    truncateAllTables()
      .then(
        () =>
          Promise.all([
            Promise.all(
              [...new Array(10)].map(
                _ =>
                  readLatestStreamForwards('wallet-123').then(
                    ({ streamId, expectedVersion, events }) =>
                      appendToStream({
                        aggregateId: 'wallet-123',
                        aggregateName: 'wallet',
                        streamId: streamId,
                        expectedVersion,
                        events: [
                          {
                            type: 'Event',
                            payload: {
                              hi: true
                            }
                          }
                        ]
                      })
                  )
              )
            ),
            reconcileAggregate({
              aggregateId: 'wallet-123',
              getState: events => ({ numberOfEvents: events.length })
            })
          ])
      ).then(
      () => readLatestStreamForwards('wallet-123').then(
        ({ events }) => assert.equal(events[events.length - 1].payload.numberOfEvents, 10)
      )
    )
  ).timeout(10000)
})