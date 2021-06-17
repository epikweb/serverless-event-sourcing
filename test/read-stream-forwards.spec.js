const {truncateAllTables} = require("../src/truncateTables");
const {readStreamForwards} = require("../src/readStreamForwards");
const { assert } = require('chai')

describe('Read stream forwards integration tests', () => {
  it('should return an empty array of events and expected version 0 if not found', () =>
    truncateAllTables()
      .then(
        () => readStreamForwards('wallet-123')
      ).then(
        res => assert.deepEqual(res, { events: [], expectedVersion: 0 })
      )
  )
})