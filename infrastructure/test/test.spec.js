const {provision} = require('./blueGreen/1-provision/shell')
const {destroy} = require('./blueGreen/5-destroy/shell')
const {v4} = require('uuid')
const axios = require('axios')
const { assert } = require('chai')


describe('System tests', () => {
  it.skip('should setup an environment, credit money, then wait for the materialized read model', async() => {
    await destroy('green')
    const { apiGatewayEndpoint } = await provision('green')

    console.log(apiGatewayEndpoint)
    const creditUrl = apiGatewayEndpoint + '/credit_money'

    console.log('Credit money @ggf', creditUrl)

    const { data } = await axios.post(creditUrl)
    console.log('Credit response', data)

    assert.equal(data, 'money added')

  }).timeout(60000 * 5)

  it('should replay in order on a per aggregate basis', async() => {
    const apiUrl = 'https://kanc6pes7l.execute-api.us-east-2.amazonaws.com/prod'

    await axios.post(apiUrl + '/credit_money')
  })


  it('should perform a zero downtime, blue green deployment', async() => {
    const blue = v4()
    const green = v4()

  })
})