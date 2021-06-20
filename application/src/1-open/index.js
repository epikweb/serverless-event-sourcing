const {EventStore} = require("../_eventStore");
const AWS = require('aws-sdk')


const log = (...args) => console.log(`[open]:`, ...args)
module.exports.open = async(cmd, context, { client = new AWS.DynamoDB.DocumentClient(), eventTableName = process.env.EVENT_TABLE_NAME }) => {
  const { walletId } = JSON.parse(cmd.body)

  const eventStore = EventStore({
    tableName: eventTableName,
    client
  })

  await eventStore.write({
    aggregateId: walletId,
    expectedVersion: 0,
    events: [
      {
        type: 'Opened',
        payload: {
          currency: 'CAD'
        }
      }
    ]
  })

  return {
    statusCode: 201,
    headers: {},
    body: JSON.stringify({
      walletId
    })
  }
}