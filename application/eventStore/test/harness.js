const {EventStore} = require("../src");
const AWS = require('aws-sdk')
const options = {
  region: 'dummy',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy'
  }
}

const client = new AWS.DynamoDB.DocumentClient(options)
const ddlClient = new AWS.DynamoDB(options)

module.exports = {
  arrangeEventStore: async() => {
    const tableName = require('uuid').v4()
    await ddlClient.createTable({
      TableName: tableName,
      AttributeDefinitions: [
        {AttributeName: 'aggregateId', AttributeType: 'S'},
        {AttributeName: 'version', AttributeType: 'N'}
      ],
      KeySchema: [
        {AttributeName: 'aggregateId', KeyType: 'HASH'},
        {AttributeName: 'version', KeyType: 'RANGE'}
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }).promise()



    return EventStore({ tableName, client })
  }
}