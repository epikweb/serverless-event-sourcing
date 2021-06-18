const {checkPreconditions, handleError, marshalWrite} = require("./core");
const {dynamoClient} = require("../aws-clients");

module.exports.write = ({ aggregateId, events, expectedVersion, snapshot=null }) => {
  checkPreconditions({ aggregateId, events, expectedVersion, snapshot })

  return new Promise(
    (resolve, reject) =>
      (async function run(attemptsMade = 0) {
        const writePayload = marshalWrite({ events, snapshot, attemptsMade, expectedVersion, aggregateId })


        try {
          await dynamoClient.transactWrite(writePayload).promise()
          resolve()
        } catch(err) {
          const { instruction, data } = handleError({ err, attemptsMade })

          if (instruction === 'sleepThenRetry') {
            await new Promise(resolve => setTimeout(resolve, data.backoffDelay))
            return run(attemptsMade + 1)
          }

          reject(new Error(data.msg))
        }

      })()
  )
}