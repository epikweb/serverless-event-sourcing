const {locateApiGatewayRestApi, checkIfDynamoTableNeedsKinesisIntegration, locateDynamoEventTable, locateKinesisEventBus, parseKinesisEventBusArn} = require("./core");
const AWS = require('aws-sdk')
const {runCommand} = require("../../harness");

const dynamoDb = new AWS.DynamoDB({ region: 'us-east-2' })
const apiGateway = new AWS.APIGateway({ region: 'us-east-2' })
const kinesis = new AWS.Kinesis({ region: 'us-east-2' })

module.exports.provision = async gitSha => {
  console.log(`Preparing to provision version with git sha: ${gitSha}`)


  await runCommand('cdk', [
    'deploy',
    '--require-approval', 'never'
  ], {
    GIT_SHA: gitSha
  })

  return await Promise.all([
    dynamoDb.listTables().promise()
      .then(locateDynamoEventTable(gitSha))
      .then(
        TableName =>
          dynamoDb.describeKinesisStreamingDestination({ TableName }).promise()
            .then(checkIfDynamoTableNeedsKinesisIntegration)
            .then(needsIntegration => ({
                dynamoEventTableName: TableName,
                dynamoEventTableNeedsKinesisIntegration: needsIntegration
              })
            )
      ),

        apiGateway.getRestApis().promise()
          .then(locateApiGatewayRestApi(gitSha)),

        kinesis.listStreams().promise()
          .then(locateKinesisEventBus(gitSha))
          .then(StreamName => kinesis.describeStream({ StreamName }).promise())
          .then(parseKinesisEventBusArn)
  ]).then(
    async(
      [
        { dynamoEventTableName, dynamoEventTableNeedsKinesisIntegration },
        apiGatewayEndpoint,
        kinesisEventBusArn
      ]
    ) => {

      // DynamoDb kinesis integration not yet supported in cloudformation/cdk
      if (dynamoEventTableNeedsKinesisIntegration) {
        console.log('Hooking up table to kinesis')
        await dynamoDb.enableKinesisStreamingDestination({
          TableName: dynamoEventTableName,
          StreamArn: kinesisEventBusArn
        }).promise()
      }

      return {
        apiGatewayEndpoint
      }
    }
  )
}