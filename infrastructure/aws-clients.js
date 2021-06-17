require('dotenv').config()
const AWS = require("aws-sdk");
AWS.config.update({region: 'us-east-2', credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }})

module.exports.dynamoDdlClient = new AWS.DynamoDB({ region: process.env.AWS_REGION })