const {arrangeEventTable, client} = require("./_harness");
const {EventStore} = require("../src/_eventStoreDynamo");
const {assert} = require('chai')
const {v4} = require('uuid')
describe('event store write integration tests', () => {
  it('should write 3 events to an aggregate + snapshot it', async() => {
    const tableName = v4()
    await arrangeEventTable(tableName)

    const eventStore = EventStore({ tableName, client })

    await eventStore.write({
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

    const { expectedVersion } = await eventStore.read({ aggregateId: 'wallet-123' })
    assert.equal(expectedVersion, 4)

  }).timeout(15000)

  it('should protect concurrent access to a single stream by retrying to insert at a higher sequence number', async() => {
    const tableName = v4()
    await arrangeEventTable(tableName)

    const eventStore = EventStore({ tableName, client })

    await Promise.all(
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

    const { expectedVersion, events } = await eventStore.read({ aggregateId: '123' })
    assert.equal(expectedVersion, 5)

  }).timeout(15000)
})