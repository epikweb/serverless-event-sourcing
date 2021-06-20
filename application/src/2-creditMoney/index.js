const {EventStore} = require("../_eventStore");
const AWS = require('aws-sdk')

const buildReducer = (initialState, handlers) => events => events.reduce((state, event) => {
  if (handlers[event.type]) {
    return handlers[event.type](state, event)
  }
  return state
}, initialState)


const log = (...args) => console.log(`[open]:`, ...args)
module.exports.creditMoney = async(cmd, context, { client = new AWS.DynamoDB.DocumentClient(), eventTableName = process.env.EVENT_TABLE_NAME }) => {

  const eventStore = EventStore({
    tableName: eventTableName,
    client
  })

  const { walletId, amount } = JSON.parse(cmd.body)
  const { events, expectedVersion } = await eventStore.read({ aggregateId: walletId })


  const state = buildReducer({}, {
    Opened: (state, { payload }) => ({...state, currency: payload.currency, balance: 0}),
    Credited: (state, { payload }) => ({...state, balance: state.balance + payload.amount}),
    Debited: (state, { payload }) => ({...state, balance: state.balance - payload.amount})
  })(events)
  log(`Current balance is ${amount} ${state.currency} => Crediting ${amount} ${state.currency}`)


  await eventStore.write({
    aggregateId: walletId,
    expectedVersion,
    events: [
      {
        type: 'Credited',
        payload: {
          amount
        }
      }
    ]
  })

  return {
    statusCode: 201,
    headers: {},
    body: null
  }
}