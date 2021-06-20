const {arrangeEventTable, arrangeProjectionTable, client} = require("./_harness");
const {retrieveBalance} = require("../src/4-retrieveBalance");
const { open } = require("../src/1-open/index")
const { creditMoney } = require("../src/2-creditMoney/index")
const {calculateBalance} = require("../src/3-calculateBalance");
const {assert} = require('chai')
const {v4} = require('uuid')

const marshalKinesisConsumerBatchProcessCmd = events => ({
  Records:
    events.map(
      ({ aggregateId, type, payload }) =>
        ({
          kinesis: {
            data: Buffer.from(
              JSON.stringify({
                dynamodb: {
                  NewImage: {
                    aggregateId: { S: aggregateId },
                    payload: { S: JSON.stringify(payload) },
                    type: { S: type }
                  }
                }
              })
            ).toString('base64')
          }
        })
    )
})

const marshalApiGatewayRestRequestCmd = body => ({ body: JSON.stringify(body )})

describe('Workflow integration tests', async() => {
  it('should open a wallet, credit 5 CAD then get the balance', async() => {
    const eventTableName = v4()
    const projectionTableName = v4()
    const walletId = v4()

    await arrangeEventTable(eventTableName)
    await arrangeProjectionTable(projectionTableName)


    await Promise.resolve(marshalApiGatewayRestRequestCmd({ walletId })).then(cmd => open(cmd, null, { client, eventTableName }))
    await Promise.resolve(marshalApiGatewayRestRequestCmd({ walletId, amount: 5 })).then(cmd => creditMoney(cmd, null, { client, eventTableName }))
    await Promise.resolve(marshalApiGatewayRestRequestCmd({ walletId, amount: 7 })).then(cmd => creditMoney(cmd, null, { client, eventTableName }))


    await Promise.resolve(
      marshalKinesisConsumerBatchProcessCmd([
        { aggregateId: walletId, payload: { currency: 'CAD' }, type: 'Opened' }
      ])
    ).then(cmd => calculateBalance(cmd, null, { client, projectionTableName }))

    await Promise.resolve(
      marshalKinesisConsumerBatchProcessCmd([
        { aggregateId: walletId, payload: { amount: 5 }, type: 'Credited' }
      ])
    ).then(cmd => calculateBalance(cmd, null, { client, projectionTableName }))

    await Promise.resolve(
      marshalKinesisConsumerBatchProcessCmd([
        { aggregateId: walletId, payload: { amount: 7 }, type: 'Credited' }
      ])
    ).then(cmd => calculateBalance(cmd, null, { client, projectionTableName }))


    const output = await Promise.resolve(marshalApiGatewayRestRequestCmd({ walletId })).then(cmd => retrieveBalance(cmd, null, { client, projectionTableName }))

    assert.deepEqual(output,  {
      statusCode: 200,
      headers: {},
      body: "{\"balance\":12,\"currency\":\"CAD\"}"
    })
  })
})