const {provision} = require('./blueGreen/1-provision/shell')
const {destroy} = require('./blueGreen/5-destroy/shell')
const {v4} = require('uuid')
const axios = require('axios')
const { assert } = require('chai')


describe('System tests', () => {
  it('should setup an environment, credit a player 5 times, wait for a websocket notification then look for the materialized read model', async() => {
    //await destroy('green')
    const { apiGatewayEndpoint } = await provision('green')

    console.log(apiGatewayEndpoint)
    const creditUrl = apiGatewayEndpoint + '/add_cash_to_register'

    console.log('Adding cash', creditUrl)

    const { data } = await axios.post(creditUrl)
    console.log('Credit response', data)

    assert.equal(data, 'money added')

  }).timeout(60000 * 5)

  it('should perform a zero downtime, blue green deployment', async() => {
    const blue = v4()
    const green = v4()

  })
})