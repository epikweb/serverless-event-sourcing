const AWS = require('aws-sdk')
const {marshalCreateTableRequest} = require("./core");
const {awsOptions} = require("../config");
const {checkTableExists, checkTableIsReadyForWrites} = require("./core");

const dynamoDbClient = new AWS.DynamoDB(awsOptions)

module.exports.setupScreen = (async function run() {
  const maybeTableName = await dynamoDbClient.listTables().promise().then(checkTableExists)

  if (!maybeTableName.exists) {
    const createdTable = await dynamoDbClient.createTable(marshalCreateTableRequest()).promise()
    console.log(`Created event dynamodb table, waiting for it to be ready for writes`, createdTable)

    return setTimeout(run, 5000)
  }

  const table = await dynamoDbClient.describeTable({
    TableName: maybeTableName.value
  }).promise()

  console.log(table)
  console.log(`Event dynamodb table ready`)
})