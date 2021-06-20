const {assert} = require('chai')


const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
const buildReducer = (initialState, handlers) => events => events.reduce((state, event) => {
  if (handlers[event.type]) {
    return handlers[event.type](state, event)
  }
  return state
}, initialState)

const unmarshalDynamoNewImages = cmd => cmd.Records.map(record => record.kinesis.data.dynamodb.NewImage)
const unmarshalEvents = dynamoNewImages => pipe(
  () => dynamoNewImages.map(image => ({ type: image['type']['S'], payload: JSON.parse(image['payload']['S']) })),
  events => ({ events, walletId: dynamoNewImages[0]['aggregateId']['S'] })
)()

const marshalCurrentStateQuery = (projectionTableName, walletId) => ({
  TableName: projectionTableName,
  ConsistentRead: false,
  KeyConditionExpression: 'lookupKey = :lookupKey',
  ExpressionAttributeValues: {
    ':lookupKey': walletId
  },
  ScanIndexForward: true
})


const unmarshalPrevState = getResponse => getResponse.Items[0]
const marshalStateMutationQuery = (projectionTableName, walletId, nextState) => ({
  TableName: projectionTableName,
  Item: {
    lookupKey: walletId,
    state: JSON.stringify(nextState)
  },
  ReturnValues: 'NONE'
})




const computeNextState = (prevState, events) =>
  buildReducer(prevState ? {
    balance: prevState.balance,
    currency: prevState.currency
  } : null, {
    Opened: (state, { payload }) => ({ ...state, currency: payload.currency, balance: 0 }),
    Credited: (state, { payload }) => ({ ...state, balance: state.balance + payload.amount }),
    Debited: (state, { payload }) => ({ ...state, balance: state.balance - payload.amount })
  })(events)

module.exports = ({
  unmarshalEvents: cmd => pipe(
    JSON.parse,
    unmarshalDynamoNewImages,
    unmarshalEvents
  )(cmd),
  marshalCurrentStateQuery,
  unmarshalPrevState,
  computeNextState,
  marshalStateMutationQuery
})