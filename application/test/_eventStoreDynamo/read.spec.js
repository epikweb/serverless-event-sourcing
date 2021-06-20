const {EventStore} = require('../src/_eventStoreDynamo')
const {arrangeEventTable, client} = require("./_harness");
const {assert} = require('chai')
const {v4} = require('uuid')

describe('event store read integration tests', () => {
  it('should return no events and sequence number read as zero if the aggregate does not yet exist', async() => {
    const tableName = v4()
    await arrangeEventTable(tableName)
    const eventStore = EventStore({ client, tableName })

    const output = await eventStore.read({ aggregateId: 'wallet-123' })
    assert.deepEqual(output, {
      expectedVersion: 0,
      events: []
    })
  }).timeout(15000)
})