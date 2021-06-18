const {truncateAllTables} = require("../destroy/shell");
const {read} = require("./shell");
const {assert} = require('chai')
describe('read shell', () => {
  it('should return no events and sequence number read as zero if the aggregate does not yet exist', () =>
    truncateAllTables()
      .then(
        () => read('wallet-123')
      ).then(
      res => assert.deepEqual(res, {
        expectedVersion: 0,
        events: []
      })
    )
  )
})