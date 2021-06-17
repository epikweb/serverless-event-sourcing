const {pipe} = require("../../../src/auxiliary");
const {TopCadWalletProjection} = require("./logic");
const {assert} = require('chai')

describe('Top CAD wallet projection', () => {
  it('should calculate balances from opening to now with one reconciliation', () =>
    pipe(
      () =>
        TopCadWalletProjection.build([
          { type: 'Opened', aggregateId: 1, payload: { playerId: 1, currency: 'CAD' } },
          { type: 'Credited', aggregateId: 1, payload: { amount: 5 } },
          { type: 'Credited', aggregateId: 1, payload: { amount: 5 } },
          { type: 'Reconciled', aggregateId: 1, payload: { balance: 10 } },
          { type: 'Credited', aggregateId: 1, payload: { amount: 5 } },

          { type: 'Opened', aggregateId: 2, payload: { playerId: 2, currency: 'CAD' } },
          { type: 'Credited', aggregateId: 2, payload: { amount: 20 } },
          { type: 'Credited', aggregateId: 2, payload: { amount: 20 } },
          { type: 'Reconciled', aggregateId: 2, payload: { balance: 40 } },
          { type: 'Credited', aggregateId: 2, payload: { amount: 5 } }
        ]),
      state =>
        assert.deepEqual(state,  {
          id: 2,
          currency: 'CAD',
          playerId: 2,
          balance: 45
        })
    )()
  )
  it('should calculate balances from reconciliation to now', () =>
    pipe(
      () =>
        TopCadWalletProjection.build([
          { type: 'Reconciled', aggregateId: 1, payload: { playerId: 1, balance: 15, currency: 'CAD' } },
          { type: 'Credited', aggregateId: 1, payload: { amount: 2 } },

          { type: 'Reconciled', aggregateId: 2, payload: { playerId: 2, balance: 10, currency: 'CAD' } },
          { type: 'Credited', aggregateId: 2, payload: { amount: 2 } }
        ]),
      state =>
        assert.deepEqual(state, {
          id: 1,
          currency: 'CAD',
          playerId: 1,
          balance: 17
        })
    )()
  )
})