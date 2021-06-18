require('dotenv').config()
const AWS = require("aws-sdk");

AWS.config.update({region: process.env.AWS_REGION, credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, sessionToken: process.env.AWS_SESSION_TOKEN  }})
module.exports.dynamoClient = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION, endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000' })