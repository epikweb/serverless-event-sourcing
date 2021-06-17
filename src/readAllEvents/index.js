const {unwrapOrderedEvents} = require("./logic");
const {reorderAggregateEventsBySequence} = require("./logic");
const {rollupAggregates} = require("./logic");
const {unmarshalEvents} = require("./logic");
const {benchmark} = require("../auxiliary");
const {pipe} = require("../auxiliary");
const {deepFreeze} = require("../auxiliary");
const {dynamoClient} = require("../aws-clients");


module.exports.readAllEvents = {
  havingAggregateName: aggregateName => benchmark('withStreamId#aggregateName')(
    () =>
      dynamoClient.query({
        TableName: 'events',
        ConsistentRead: false,
        IndexName: 'AggregateName',
        KeyConditionExpression: 'aggregateName = :aggregateName',
        ExpressionAttributeValues: {
          ':aggregateName': aggregateName
        },
        ScanIndexForward: true
      }).promise()
        .then(
          res => pipe(
            unmarshalEvents,
            rollupAggregates,
            reorderAggregateEventsBySequence,
            unwrapOrderedEvents,
            deepFreeze
          )(res)
        )
  )
}