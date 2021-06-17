const {pipe} = require("../../../src/auxiliary");
const {Top3WalletsInEurosProjection} = require("./logic");
const {assert} = require('chai')
describe('Top 3 wallets in euros projection', () => {
  it('should calculate balances from opening to now with one reconciliation', () =>
    pipe(
      () =>
        Top3WalletsInEurosProjection.build([
          { type: 'Opened', aggregateId: 1, payload: { playerId: 1, currency: 'CAD' } },
          { type: 'Credited', aggregateId: 1, payload: { amount: 5 } },
          { type: 'Credited', aggregateId: 1, payload: { amount: 5 } },
          { type: 'Reconciled', aggregateId: 1, payload: { balance: 10 } },
          { type: 'Credited', aggregateId: 1, payload: { amount: 5 } }
        ]),
      state =>
        assert.deepEqual(state, [
          {
            id: 1,
            playerId: 1,
            numberOfTransactions: 3,
            eurBalance: 7.5,
            homeBalance: { balance: 15, currency: 'CAD' }
          }
        ])
    )()
  )
  it('should calculate balances from reconciliation to now', () =>
    pipe(
      () =>
        Top3WalletsInEurosProjection.build([
          { type: 'Reconciled', aggregateId: 1, payload: { playerId: 1, balance: 10, currency: 'CAD' } },
          { type: 'Credited', aggregateId: 1, payload: { amount: 2 } }
        ]),
      state =>
        assert.deepEqual(state, [
          {
            id: 1,
            playerId: 1,
            numberOfTransactions: 1,
            eurBalance: 6,
            homeBalance: { balance: 12, currency: 'CAD' }
          }
        ])
    )()
  )
})