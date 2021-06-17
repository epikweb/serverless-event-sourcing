const {getAggregateName} = require("../logic");
const {readLatestStreamForwards} = require("../readLatestStreamForwards");
const {shouldRetry} = require("../appendToStream/logic");
const {pipe} = require("../../examples/wallet/auxiliary");
const {marshalEvent} = require("../logic");
const {benchmark} = require("../auxiliary");
const {dynamoClient} = require("../aws-clients");
const {log} = require("../auxiliary");



module.exports.reconcileAggregate = ({ aggregateId, getState }) =>
  benchmark('reconcileAggregate')(() =>
    new Promise(
      (resolve, reject) =>
        (async function retry( attemptsMade=0 ) {

          const newStreamId = require('uuid').v4()
          console.log(`Attempting to reconcile aggregate: ${aggregateId} into stream ${newStreamId}`)

          const aggregateName = getAggregateName(aggregateId)
          const {expectedVersion, streamId, events} = await readLatestStreamForwards(aggregateId)

          const state = getState(events)

          return dynamoClient.transactWrite({
            TransactItems: [
              marshalEvent({
                streamId,
                aggregateId: aggregateId,
                aggregateName,
                event: {
                  type: 'Tombstoned',
                  payload: {
                    newStreamId,
                    ...state
                  }
                },
                expectedVersion
              }),
              marshalEvent({
                streamId: newStreamId,
                aggregateId: aggregateId,
                aggregateName,
                event: {
                  type: 'Reconciled',
                  payload: {
                    oldStreamId: streamId,
                    ...state
                  }
                },
                expectedVersion
              })
            ]
          })
            .promise()
            .then(
              () => {
                log(newStreamId)(`Reconciled ${aggregateId} from ${streamId} into ${newStreamId} with state`, state)
                resolve()
              }
            )
            .catch(
              err =>
                pipe(
                  () => shouldRetry({err, attemptsMade}),
                  ({cmd, data}) => cmd === 'retry' ? setTimeout(retry(data.nextAttempt), data.backoffDelay) : reject(new Error(data.msg))
                )()
            )

        })()
    )
  )
