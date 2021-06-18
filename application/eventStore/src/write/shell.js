const {handleError} = require("./core");
const {marshalWrite} = require("./core");
const {checkPreconditions} = require("./core");
module.exports = ({ client, tableName }) => ({ aggregateId, events, expectedVersion, snapshot=null }) => {
  checkPreconditions({ aggregateId, events, expectedVersion, snapshot })

  return new Promise(
    (resolve, reject) =>
      (async function run(attemptsMade = 0) {
        const writePayload = marshalWrite({ events, snapshot, attemptsMade, expectedVersion, aggregateId, tableName })

        try {
          await client.transactWrite(writePayload).promise()
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