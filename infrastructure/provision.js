const {infrastructureConfig} = require("./config");
const {dynamoDdlClient} = require("./aws-clients");

const log = (...args) => console.log(`[Provisioner]:`, ...args)

Promise.all(
  infrastructureConfig.dynamoTables.map(
    data => dynamoDdlClient.createTable(data).promise()
  )
)
  .then(
    () => log('Dynamo tables provision requested, this may take up to 25 seconds')
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
    () => log('Dynamo tables provisioned')
  )