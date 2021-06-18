const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

const log = (streamId) => (...args) => console.log(`[${streamId}]:`, ...args)
const buildStreamId = (aggregateId, currentStreamNumber) => `${aggregateId}-v${currentStreamNumber}`

const Maybe = value => ({
  exists: typeof value !== 'undefined' && value !== null,
  value,
  chain: cb => cb(Maybe(value)),
  map: cb => cb(value)
})
Maybe.Just = value => Maybe(value)
Maybe.Nothing = Maybe(null)


function deepFreeze(object) {
  // Retrieve the property names defined on object
  const propNames = Object.getOwnPropertyNames(object);

  // Freeze properties before freezing self

  for (const name of propNames) {
    const value = object[name];

    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = {
  pipe, log, buildStreamId, Maybe, deepFreeze, sleep
}