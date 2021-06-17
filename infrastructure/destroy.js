const {infrastructureConfig} = require("./config");
const {dynamoDdlClient} = require("./aws-clients");


const log = (...args) => console.log(`[Destroyer]:`, ...args)
Promise.all(
  infrastructureConfig.dynamoTables.map(
    ({ TableName }) => dynamoDdlClient.deleteTable({
      TableName
    }).promise(),
  )
)
  .then(
    () => log('Dynamo tables deletion requested, this may take up to 25 seconds')
  )
  .then(
    () => Promise.all(
      infrastructureConfig.dynamoTables.map(
        ({ TableName }) =>
          dynamoDdlClient.waitFor('tableNotExists', {
            TableName
          }).promise()
      )
    )
  )
  .then(
    () => log('Dynamo tables deleted')
  ).catch(
  err => {
    if (err.code === 'ResourceNotFoundException') {} else { throw err }
  }
)