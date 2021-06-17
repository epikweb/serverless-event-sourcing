const {readAllEvents} = require("../src/readAllEvents");
const {appendToStream} = require("../src/appendToStream");
const {truncateAllTables} = require("../src/truncateTables");
const {assert} = require('chai')

const walletIds = [...new Array(50)].map(
  (_, index) => index + 1
)

describe('Read all events integration tests', () => {
  it('should return all events with aggregate name wallet out of order globally, but in order for each stream id', () =>
    truncateAllTables()
      .then(
        () =>
          Promise.all(
            walletIds.map(
              (walletId, index) =>
                appendToStream({
                  aggregateId: `wallet-${index}`,
                  aggregateName: 'wallet',
                  streamId: `wallet-${index}`,
                  expectedVersion: 0,
                  events: [
                    {
                      type: 'Opened',
                      payload: {
                        walletId,
                        playerId: 'test'
                      }
                    },
                    {
                      type: 'Credited',
                      payload: {
                        amount: 6
                      }
                    },
                    {
                      type: 'Debited',
                      payload: {
                        amount: 5
                      }
                    }
                  ]
                })
            )
          )
      ).then(
      () => readAllEvents.havingAggregateName('wallet')
    ).then(
      events => events.forEach(
        (event, index) => {
          if (event.type === 'Opened') {
            const nextNeighbour = events[index + 1]
            const nextNextNeighbour = events[index + 2]

            assert.equal(nextNeighbour.type, 'Credited')
            assert.equal(nextNeighbour.streamId, event.streamId)

            assert.equal(nextNextNeighbour.type, 'Debited')
            assert.equal(nextNextNeighbour.streamId, event.streamId)
          }
        }
      )
    )
  )
})