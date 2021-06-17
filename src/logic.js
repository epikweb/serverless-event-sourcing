const {pipe} = require("./auxiliary");
const {deepFreeze} = require("./auxiliary");

const marshalEvent = ({ streamId, aggregateId, aggregateName, expectedVersion, event }) => ({
  Put: {
    TableName: 'events',
    Item: {
      aggregateId,
      aggregateName,
      streamId,
      sequenceNumber: expectedVersion + 1,
      type: event.type,
      payload: JSON.stringify(event.payload),
      timestamp: new Date().toISOString()
    },
    ConditionExpression: 'attribute_not_exists(sequenceNumber)',
    ReturnValues: 'NONE'
  }
})
const unmarshalEvent = event => ({ aggregateId: event.aggregateId, type: event.type, payload: JSON.parse(event.payload), timestamp: event.timestamp, sequenceNumber: event.sequenceNumber })
const unmarshalStream = ({ Items }) => Items.length > 0 ?
  ({
    events: pipe(
      () => Items.reduce((events, item) => [...events, unmarshalEvent(item)], []),
      deepFreeze
    )(),
    expectedVersion: Items[Items.length - 1].sequenceNumber
  })
  : ({
    events: [],
    expectedVersion: 0
  })

const shouldRetry = ({ err, attemptsMade, random=Math.random() }) => {
  if (err.name === 'TransactionCanceledException') {
    if (attemptsMade === 10) {
      return { cmd: 'throw', data: {msg: `Concurrency violation after ${attemptsMade} attempts`} }
    }

    const backoffDelay = Math.pow(2, attemptsMade) * random
    console.log(`Failed to append events on attempt #${attemptsMade}. Retrying in ${backoffDelay}ms...`)

    return { cmd: 'retry', data: {nextAttempt: attemptsMade + 1, backoffDelay} }
  }

  return { cmd: 'throw', data: {msg: err.name} }
}

const getAggregateName = aggregateId => aggregateId.split('-')[0]

module.exports = {
  marshalEvent,
  unmarshalEvent,
  unmarshalStream,
  shouldRetry,
  getAggregateName
}