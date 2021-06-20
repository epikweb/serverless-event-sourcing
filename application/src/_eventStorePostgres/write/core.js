const {pipe} = require("../auxiliary");
const { assert } = require('chai')

const checkPreconditions = ({ aggregateId, expectedVersion, events, snapshot }) => {
  assert.typeOf(aggregateId, 'string')
  assert.typeOf( expectedVersion, 'number')
  assert.isAtLeast(expectedVersion, 0)
  assert.isArray(events)
  assert(events.filter(({ type, payload }) => typeof type === 'string' && typeof payload === 'object').length === events.length)

  if (snapshot) {
    assert.typeOf(snapshot, 'object')
  }
}

const handleError = ({ err, attemptsMade, random=Math.random() }) => {
  if (err.name === 'TransactionCanceledException') {
    if (attemptsMade === 10) {
      return { instruction: 'throw', data: {msg: `Concurrency violation after ${attemptsMade} attempts`} }
    }

    const backoffDelay = Math.pow(2, attemptsMade) * random
    return { instruction: 'sleepThenRetry', data: {nextAttempt: attemptsMade + 1, backoffDelay} }
  }

  return { instruction: 'throw', data: {msg: err.name} }
}

const sequenceEvents = ({ events, snapshot, expectedVersion, attemptsMade }) =>
  [...events].concat(snapshot ? [{ type: 'Reconciled', payload: snapshot }] : [])
  .map(
    (event, index) => ({
      ...event,
      eventId: require('uuid').v4(),
      version: expectedVersion + attemptsMade + index + 1
    })
  )

const marshalWrite = ({ aggregateId, events, snapshot, expectedVersion, attemptsMade, tableName }) => pipe(
  () => aggregateId.split('-')[0],
  aggregateName => ({ aggregateName, events: sequenceEvents({ events, expectedVersion, attemptsMade, snapshot })}),
  ({ aggregateName, events }) => ({
    TransactItems: events.map(
      event => (
        {
          Put: {
            TableName: tableName,
            Item: {
              aggregateId,
              aggregateName,
              eventId: event.eventId,
              version: event.version,
              type: event.type,
              payload: JSON.stringify(event.payload),
              timestamp: new Date().toISOString()
            },
            ConditionExpression: 'attribute_not_exists(version)',
            ReturnValues: 'NONE'
          }
        })
    )

  })
)()



module.exports = {
  checkPreconditions,
  marshalWrite,
  handleError
}