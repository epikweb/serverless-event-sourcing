const {readStreamForwards} = require("../src/readStreamForwards");
const {truncateAllTables} = require("../src/truncateTables");
const {appendToStream} = require("../src/appendToStream");
const { assert } = require('chai')

describe('Append to stream integration tests', () => {
  it('should protect concurrent access to a single stream by retrying 10 times over ~2 sec', () =>
    truncateAllTables()
      .then(
        () =>
          Promise.all(
            [...new Array(5)].map(
              _ => appendToStream({
                aggregateId: '123',
                aggregateName: 'wallet',
                streamId: '123',
                expectedVersion: 0,
                events: [
                  {
                    type: 'Event',
                    payload: {
                      test: true
                    }
                  }
                ],
              })
            )
          )
      )
      .then(() => readStreamForwards('123'))
      .then(({ events }) => events.map(e => e.sequenceNumber))
      .then(sequenceNumbers => assert.deepEqual([1, 2, 3, 4, 5], sequenceNumbers))

  ).timeout(15000)
})