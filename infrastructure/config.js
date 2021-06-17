module.exports.infrastructureConfig = {
  dynamoTables: [
    {
      TableName: 'events',
      AttributeDefinitions: [
        {AttributeName: 'streamId', AttributeType: 'S'},
        {AttributeName: 'aggregateName', AttributeType: 'S'},
        {AttributeName: 'aggregateId', AttributeType: 'S'},
        {AttributeName: 'sequenceNumber', AttributeType: 'N'},
        {AttributeName: 'type', AttributeType: 'S'}
      ],
      KeySchema: [
        {AttributeName: 'streamId', KeyType: 'HASH'},
        {AttributeName: 'sequenceNumber', KeyType: 'RANGE'}
      ],
      BillingMode: 'PAY_PER_REQUEST',
      GlobalSecondaryIndexes: [
        {
          IndexName: 'AggregateName',
          KeySchema: [
            {
              AttributeName: 'aggregateName',
              KeyType: 'HASH'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        },
        {
          IndexName: 'AggregateId',
          KeySchema: [
            {
              AttributeName: 'aggregateId',
              KeyType: 'HASH'
            },
            {AttributeName: 'type', KeyType: 'RANGE'}
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ],
    }
  ],
  kinesisStreams: [

  ]
}