module.exports.EventStore = ({ tableName, client }) => {
  return {
    read: ({ aggregateId }) => require('./read/shell')({ tableName, client })(aggregateId),
    write: ({ aggregateId, events, expectedVersion, snapshot }) => require('./write/shell')({ tableName, client })({ aggregateId, events, expectedVersion, snapshot })
  }
}