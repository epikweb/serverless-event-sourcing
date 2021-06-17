const {topCadWallet} = require("./query-topCadWallet");
const {reconcileWallet} = require("./3-reconcile");
const {top3WalletsInEuros} = require("./query-top3WalletsInEuros");
const {openWallets} = require("./query-openWallets");
const {creditMoney} = require("./2-creditMoney");
const {openWallet} = require("./1-openWallet");
const {truncateAllTables} = require("../../src/truncateTables");
const {assert} = require('chai')

const currencies = [
  'CAD',
  'EUR',
  'USD'
]

const players = [...new Array(1)].map(
  () => ({
    playerId: require('uuid').v4(),
    wallets: currencies.map(
      currency => ({
        walletId: require('uuid').v4(),
        currency,
        amountToCredit: 50
      })
    )
  })
)


const openPlayerWallets = () => Promise.all(
  players.map(
    ({ playerId, wallets }) =>
      Promise.all(
        wallets.map(
          ({ walletId, currency }) =>
            openWallet({ walletId, playerId, currency })
        )
      )
  )
)

const creditMoneyIntoAllWalletsConcurrently5Times =
  wallets =>
    Promise.all(
      wallets.map(
        ({ id }) =>
          Promise.all([...new Array(5)].map(_ => creditMoney({ walletId: id, amount: 5 })))
      )
    )


const reconcileAllPlayerWallets = () => Promise.all(
  players.map(
    ({ wallets }) =>
      Promise.all(
        wallets.map(
          ({ walletId }) =>
            reconcileWallet({ walletId })
        )
      )
  )
)

const gatherOutputContract = () =>
  top3WalletsInEuros.find()
    .then(
      wallets => wallets.map(
        ({ eurBalance, numberOfTransactions, homeBalance }) => ({
          eurBalance,
          numberOfTransactions,
          homeBalance
        })
      )
    )

describe('Integration tests', () => {
  it('should open a CAD, EUR and USD balances, credit each of them 5 times concurrently then reconcile each of them into a new stream', () =>
    truncateAllTables()
      .then(openPlayerWallets)
      .then(openWallets.find)
      .then(creditMoneyIntoAllWalletsConcurrently5Times)
      .then(top3WalletsInEuros.find)
      .then(gatherOutputContract)
      .then(
        (output) =>
          assert.deepEqual(output, [
            {
              eurBalance: 25,
              numberOfTransactions: 5,
              homeBalance: { balance: 25, currency: 'EUR' }
            },
            {
              eurBalance: 18.75,
              numberOfTransactions: 5,
              homeBalance: { balance: 25, currency: 'USD' }
            },
            {
              eurBalance: 12.5,
              numberOfTransactions: 5,
              homeBalance: { balance: 25, currency: 'CAD' }
            }
          ])
      )

      .then(reconcileAllPlayerWallets)
      .then(top3WalletsInEuros.find)
      .then(gatherOutputContract)
      .then(
        output =>
          assert.deepEqual(output, [
            {
              eurBalance: 25,
              numberOfTransactions: 5,
              homeBalance: { balance: 25, currency: 'EUR' }
            },
            {
              eurBalance: 18.75,
              numberOfTransactions: 5,
              homeBalance: { balance: 25, currency: 'USD' }
            },
            {
              eurBalance: 12.5,
              numberOfTransactions: 5,
              homeBalance: { balance: 25, currency: 'CAD' }
            }
          ])
      ).then(
        topCadWallet.find
    ).then(
      wallet => {
        console.dir(wallet, { depth: null })
      }
    )
  ).timeout(25000)
})