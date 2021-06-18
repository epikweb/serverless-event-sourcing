const {read} = require("../read/shell");
const {write} = require("./shell");
const {truncateAllTables} = require("../destroy/shell");
const {assert} = require('chai')

describe('write shell', () => {
  it('should write 3 events to an aggregate + snapshot it', () =>
    truncateAllTables().then(
      () =>
        write({
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
    ).then(
      () => read('wallet-123')
    ).then(
      ({ events, expectedVersion }) => {
        assert.equal(expectedVersion, 4)
      }
    )
  )
  it('should protect concurrent access to a single stream by retrying 10 times over ~2 sec', () =>
    truncateAllTables()
      .then(
        () =>
          Promise.all(
            [...new Array(5)].map(
              _ => write({
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
      )
      .then(() => read('123'))
      .then(({ expectedVersion }) => assert.equal(expectedVersion, 5))

  ).timeout(15000)
})