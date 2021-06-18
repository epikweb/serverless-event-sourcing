const {EventStore} = require("../../eventStore/src");
const AWS = require('aws-sdk')
const client = new AWS.DynamoDB.DocumentClient()

const eventStore = EventStore({
  tableName: process.env.DYNAMODB_TABLE_NAME,
  client
})


const buildReducer = (initialState, handlers) => events => events.reduce((state, event) => {
  if (handlers[event.type]) {
    return handlers[event.type](state, event)
  }
  return state
}, initialState)

module.exports.handler = async(event, context) => {
  const { events, expectedVersion } = await eventStore.read({ aggregateId: 'steve' })

  const reduce = buildReducer(0, {
    Credited: (balance, { payload }) => balance + payload.amount,
    Debited: (balance, { payload }) => balance - payload.amount
  })

  const balance = reduce(events)

  console.log(`Current balance is ${balance} => crediting 5`)

  await eventStore.write({
    aggregateId: 'steve',
    expectedVersion,
    events: [
      {
        type: 'Credited',
        payload: {
          amount: 5
        }
      }
    ]
  })

  return {
    statusCode: 201,
    headers: {
      "x-custom-header" : "my custom header value"
    },
    body: 'money added'
  }
}