const {pipe} = require("./auxiliary");
const {shouldRetry} = require("./logic");
const { assert } = require('chai')

const genError = name => pipe(
  error => { error.name = name; return error }
)(new Error(name))

describe('eventStore shared logic', () => {
  describe('shouldRetry', () => {
    it('should generate the next retry delay if TransactionCanceledException', () =>
      [...new Array(10)].map(
        (_, index) =>
          pipe(
            () => shouldRetry({ err: genError('TransactionCanceledException'), attemptsMade: index, random: 0.36 }),
            (res) =>
              assert.deepEqual(res, {
                cmd: 'retry',
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
        res => assert.deepEqual(res, { cmd: 'throw', data: { msg: 'RandomError' } })
      )(shouldRetry({ err: { name: 'RandomError' }, attemptsMade: 1 }))
    )
    it('should throw if attempts = 10', () =>
      pipe(
        res => assert.deepEqual(res, { cmd: 'throw', data: { msg: 'Concurrency violation after 10 attempts' } })
      )(shouldRetry({ err: genError('TransactionCanceledException'), attemptsMade: 10 }))
    )
  })
})