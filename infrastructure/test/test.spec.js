const {provision} = require('./blueGreen/1-provision/shell')
const {destroy} = require('./blueGreen/5-destroy/shell')
const {v4} = require('uuid')
const axios = require('axios')
const { assert } = require('chai')


describe('System tests', () => {
  it('should setup an environment, open a wallet, credit money, then wait for the materialized read model', async() => {
    await destroy('green')
    const { apiGatewayEndpoint } = await provision('green')

    console.log({ apiGatewayEndpoint })


    /*
    await axios.post(apiGatewayEndpoint + '/open', {
      walletId: v4()
    })
    await axios.post(apiGatewayEndpoint + '/credit_money', {
      walletId: v4(),
      amount: 5
    })

    await new Promise(
      async resolve => {
        setInterval(async() => {

          const { data } = await axios.get(apiGatewayEndpoint + '/retrieve_balance')
          console.log(`Got data`, data)


        }, 1000)
      }
    )*/
  }).timeout(60000 * 5)


  it('should perform a zero downtime, blue green deployment', async() => {
    const blue = v4()
    const green = v4()

  })
})