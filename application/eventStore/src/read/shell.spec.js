const {arrangeEventStore} = require("../../test/harness");
const {assert} = require('chai')

describe('read integration tests', () => {
  it('should return no events and sequence number read as zero if the aggregate does not yet exist', () =>
    arrangeEventStore()
      .then(
        eventStore =>
          eventStore
            .read({ aggregateId: 'wallet-123' })
            .then(
              res => assert.deepEqual(res, {
                expectedVersion: 0,
                events: []
              })
            )
      )
  )
})