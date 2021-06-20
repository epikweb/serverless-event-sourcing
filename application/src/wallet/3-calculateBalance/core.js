const {assert} = require('chai')


const Maybe = value => ({
  exists: typeof value !== 'undefined' && value !== null,
  value,
  chain: cb => cb(Maybe(value)),
  map: cb => cb(value)
})
Maybe.Just = value => Maybe(value)
Maybe.Nothing = Maybe(null)


const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
const buildReducer = (initialState, handlers) => events => events.reduce((state, event) => {
  if (handlers[event.type]) {
    return handlers[event.type](state, event)
  }
  return state
}, initialState)

const unmarshalKinesisMessages = data => data.Records.map(
  record =>
    pipe(
      () => Buffer.from(record.kinesis.data, 'base64').toString(),
      JSON.parse
  )()
)
const unmarshalDynamoTableEvents = kinesisMessages => {
  const newImages = kinesisMessages.map(msg => msg.dynamodb.NewImage)
  return pipe(
    () => newImages.map(image => ({ type: image.type.S, payload: JSON.parse(image.payload.S), aggregateId: image.aggregateId.S })),
    events => ({ events, walletId: newImages[0]['aggregateId']['S'] })
  )()
}

const marshalCurrentStateQuery = (projectionTableName, walletId) => ({
  TableName: projectionTableName,
  ConsistentRead: false,
  KeyConditionExpression: 'lookupKey = :lookupKey',
  ExpressionAttributeValues: {
    ':lookupKey': walletId
  },
  ScanIndexForward: true
})


const unmarshalPrevState = getResponse => pipe(
  () => getResponse.Items[0],
  row => row ? Maybe.Just(JSON.parse(row.state)) : Maybe.Nothing
)()

const marshalStateMutationQuery = (projectionTableName, walletId, nextState) => ({
  TableName: projectionTableName,
  Item: {
    lookupKey: walletId,
    state: JSON.stringify(nextState)
  },
  ReturnValues: 'NONE'
})




const computeNextState = (maybePrevState, events) =>
  buildReducer(maybePrevState.exists ? {
    balance: maybePrevState.value.balance,
    currency: maybePrevState.value.currency
  } : null, {
    Opened: (state, { payload }) => ({ ...state, currency: payload.currency, balance: 0 }),
    Credited: (state, { payload }) => ({ ...state, balance: state.balance + payload.amount }),
    Debited: (state, { payload }) => ({ ...state, balance: state.balance - payload.amount })
  })(events)

module.exports = ({
  unmarshalEvents: cmd => pipe(
    unmarshalKinesisMessages,
    unmarshalDynamoTableEvents
  )(cmd),
  marshalCurrentStateQuery,
  unmarshalPrevState,
  computeNextState,
  marshalStateMutationQuery
})