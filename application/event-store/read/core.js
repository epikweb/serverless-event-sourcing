const {eventTableName} = require("../config");
const {deepFreeze} = require("../auxiliary");
const {pipe} = require("../auxiliary");
const unmarshalStream = ({ Items }) => {
  if (Items.length === 0) {
    return {
      events: [],
      expectedVersion: 0
    }
  }

  return {
    events: pipe(
      () => Items.reduce((events, item) => [...events, unmarshalEvent(item)], []),
      deepFreeze
    )(),
    expectedVersion: Items[Items.length - 1].version
  }
}
const unmarshalEvent = event => ({ aggregateId: event.aggregateId, type: event.type, payload: JSON.parse(event.payload), timestamp: event.timestamp, version: event.version })

const marshalRead = aggregateId => ({
  TableName: eventTableName,
  ConsistentRead: true,
  KeyConditionExpression: 'aggregateId = :aggregateId',
  ExpressionAttributeValues: {
    ':aggregateId': aggregateId
  },
  ScanIndexForward: true
})
module.exports = { marshalRead, unmarshalStream }