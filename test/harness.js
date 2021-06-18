require('dotenv').config()

const {EventStore} = require("../src");
const options = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
}

const tableName = process.env.DYNAMODB_TABLE_NAME

const client = new AWS.DynamoDB.DocumentClient(options)
const ddlClient = new AWS.DynamoDB(options)
const kinesisClient = new AWS.Kinesis(options)



const arrange = async () => {

  if (!tableExists) {
    const result = await ddlClient.createTable({
      TableName: tableName,
      AttributeDefinitions: [
        {AttributeName: 'aggregateId', AttributeType: 'S'},
        {AttributeName: 'version', AttributeType: 'N'}
      ],
      KeySchema: [
        {AttributeName: 'aggregateId', KeyType: 'HASH'},
        {AttributeName: 'version', KeyType: 'RANGE'}
      ],
      BillingMode: 'PAY_PER_REQUEST',
      StreamSpecification: {
        StreamEnabled: true,
        StreamViewType: 'NEW_IMAGE',
      }
    }).promise()
    console.log(`Created new table:`, result)
  }

  const streamArn = result.TableDescription.LatestStreamArn
  const streamInfo = await streamClient.describeStream({ StreamArn: streamArn }).promise()
  const shard = streamInfo.StreamDescription.Shards[0]
  const startingSequenceNumber = shard.SequenceNumberRange.StartingSequenceNumber

  const { ShardIterator } = await streamClient.getShardIterator({ ShardId: shard.ShardId, ShardIteratorType: 'TRIM_HORIZON', StreamArn: streamArn }).promise()
  const items = await streamClient.getRecords({ ShardIterator }).promise()

  console.log(items)

  return EventStore({ tableName, client })
}


module.exports = {
  arrange
}