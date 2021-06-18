module.exports.handler = async(event, context) => {
  return {
    statusCode: 200,
    headers: {
      "x-custom-header" : "my custom header value"
    },
    body: 'hello'
  }
}