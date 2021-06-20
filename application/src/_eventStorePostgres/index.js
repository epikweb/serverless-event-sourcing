const { Pool } = require('pg')

module.exports.EventStore = ({ tableName, connectionString }) => {
  const pool = new Pool({
    connectionString
  })

  return {
    read: ({ aggregateId }) => require('./read/shell')({ tableName, pool })(aggregateId),
    write: ({ aggregateId, events, expectedVersion, snapshot }) => require('./write/shell')({ tableName, pool })({ aggregateId, events, expectedVersion, snapshot })
  }
}