const assert = require('assert')
const {Maybe} = require("../auxiliary");
const {marshalEvent} = require("../logic");

const checkPreconditions = ({ aggregateId, aggregateName, streamId, expectedVersion, events }) => {
  assert(typeof aggregateId === 'string')
  assert(typeof aggregateName === 'string')
  assert(typeof streamId === 'string')
  assert(typeof expectedVersion === 'number')
  assert(Array.isArray(events))
  assert(events.filter(({ type, payload }) => typeof type === 'string' && typeof payload === 'object').length === events.length)
}
const marshalEvents = ({ streamId, aggregateId, aggregateName, expectedVersion, events }) => ({
  TransactItems: events.reduce(
    (items, event, index) => [
      ...items,
      marshalEvent({ streamId, aggregateId, aggregateName, event, expectedVersion: expectedVersion + index })
    ]
    , [])
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

module.exports = {
  checkPreconditions,
  marshalEvents,
  shouldRetry
}