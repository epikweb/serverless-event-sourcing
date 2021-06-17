const {shouldRetry} = require("./logic");
const {pipe} = require("../auxiliary");
const {marshalEvents, checkPreconditions} = require("./logic");
const {benchmark} = require("../auxiliary");
const {dynamoClient} = require("../aws-clients");
const { log } = require('../auxiliary')

module.exports.appendToStream = ({ aggregateId, aggregateName, streamId, expectedVersion, events }) => {
  checkPreconditions({ aggregateId, aggregateName, streamId, expectedVersion, events })


  return benchmark('append')(
    () => new Promise(
      (resolve, reject) =>
        (function retry( attemptsMade=0 ) {
            return pipe(
              () => expectedVersion + attemptsMade,
              expectedVersion => dynamoClient.transactWrite(
                marshalEvents({ aggregateName, aggregateId, expectedVersion, streamId, events })
              )
                .promise()
                .then(
                  () => {
                    log(streamId)(`Wrote ${events.length} events beginning at sequence ${expectedVersion}`)
                    resolve()
                  }
                )
                .catch(
                  err =>
                    pipe(
                      ({ cmd, data }) => cmd === 'retry' ? setTimeout(retry(data.nextAttempt), data.backoffDelay) : reject(new Error(data.msg))
                    )(shouldRetry({ err, attemptsMade }))
                )
            )()
          }
        )()
    )
  )
}