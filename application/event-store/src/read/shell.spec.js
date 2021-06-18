const {eventStore, setup} = require("../../test/harness");
const {assert} = require('chai')

describe('read integration tests', () => {
  beforeEach(() => setup())
  it('should return no events and sequence number read as zero if the aggregate does not yet exist', () =>
    eventStore.read({ aggregateId: 'wallet-123' })
      .then(
        res => assert.deepEqual(res, {
          expectedVersion: 0,
          events: []
        })
      )
  )
})