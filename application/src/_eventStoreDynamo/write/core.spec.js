const {pipe} = require("../auxiliary");
const {handleError} = require("./core");
const { assert } = require('chai')

const genError = name => pipe(
  error => { error.name = name; return error }
)(new Error(name))

describe('write core', () => {
  it('should generate the next retry delay if TransactionCanceledException', () =>
    [...new Array(10)].map(
      (_, index) =>
        pipe(
          () => handleError({ err: genError('TransactionCanceledException'), attemptsMade: index, random: 0.36 }),
          (res) =>
            assert.deepEqual(res, {
              instruction: 'sleepThenRetry',
              data: {
                nextAttempt: index + 1,
                backoffDelay: Math.pow(2, index) * 0.36
              }
            })
        )()
    )
  )
  it('should throw if not TransactionCanceledException', () =>
    pipe(
      () => handleError({ err: { name: 'RandomError' }, attemptsMade: 1 }),
      res => assert.deepEqual(res, { instruction: 'throw', data: { msg: 'RandomError' } })
    )()
  )
  it('should throw if attempts = 10', () =>
    pipe(
      () => handleError({ err: genError('TransactionCanceledException'), attemptsMade: 10 }),
      res => assert.deepEqual(res, { instruction: 'throw', data: { msg: 'Concurrency violation after 10 attempts' } })
    )()
  )
})