const {write} = require("../../eventStore/write/shell");
const {read} = require("../../eventStore/read/shell");

const buildReducer = (initialState, handlers) => events => events.reduce((state, event) => {
  if (handlers[event.type]) {
    return handlers[event.type](state, event)
  }
  return state
}, initialState)

module.exports.handler = async(event, context) => {
  const { events, expectedVersion } = await read('steve')

  const reduce = buildReducer(0, {
    Credited: (balance, { payload }) => balance + payload.amount,
    Debited: (balance, { payload }) => balance - payload.amount
  })

  const balance = reduce(events)

  console.log(`Current balance is ${balance} => crediting 5`)

  await write({
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