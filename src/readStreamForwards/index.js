const {unmarshalStream} = require("../logic");
const {benchmark} = require("../auxiliary");
const {dynamoClient} = require("../aws-clients");


module.exports.readStreamForwards = (streamId) =>
  benchmark('readStreamForwards')(
    () => dynamoClient.query({
      TableName: 'events',
      ConsistentRead: true,
      KeyConditionExpression: 'streamId = :streamId',
      ExpressionAttributeValues: {
        ':streamId': streamId
      },
      ScanIndexForward: true
    }).promise()
      .then(unmarshalStream)
  )