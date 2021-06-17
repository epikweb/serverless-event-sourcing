const {benchmark} = require("../../examples/wallet/auxiliary");
const {readStreamForwards} = require("../readStreamForwards");
const {Maybe} = require("../auxiliary");
const {dynamoClient} = require("../aws-clients");

module.exports.readLatestStreamForwards = (aggregateId) =>
  benchmark('readLatestStreamForwards')(
    () =>
      dynamoClient.query({
        TableName: 'events',
        IndexName: 'AggregateId',
        ConsistentRead: false,
        KeyConditionExpression: 'aggregateId = :aggregateId and #type = :type',
        ExpressionAttributeValues: {
          ':aggregateId': aggregateId,
          ':type': 'Reconciled'
        },
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ScanIndexForward: false,
        Limit: 1
      }).promise()
        .then(
          res => Maybe(res.Items[0])
        ).then(
          maybeLatestStream => maybeLatestStream.exists ? maybeLatestStream.value.streamId : aggregateId
      ).then(
        async streamId => ({
          streamId,
          ...await readStreamForwards(streamId)
        })
      )
  )