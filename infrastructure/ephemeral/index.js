#!/usr/bin/env node
const cdk = require('@aws-cdk/core');
const app = new cdk.App();

// We build this into the deployment CI pipeline if we are doing a blue green deployment
const version = process.env.GIT_SHA || 'dc67f7f'
const stack = new cdk.Stack(app, `${version}-event-sourcing`, { env: { region: 'us-east-2' }})


// Event store
const dynamodb = require('@aws-cdk/aws-dynamodb');
const eventTable = new dynamodb.Table(stack, 'events', {
  partitionKey: {name: 'aggregateId', type: dynamodb.AttributeType.STRING},
  sortKey: {name: 'version', type: dynamodb.AttributeType.NUMBER},
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
})

// Event bus
const kinesis = require('@aws-cdk/aws-kinesis');
new kinesis.Stream(stack, 'event-bus', {
  shardCount: 5
})


// Application services
const lambda = require('@aws-cdk/aws-lambda');

const addCashToRegister = new lambda.Function(stack, 'add-cash-to-register', {
  runtime: lambda.Runtime.NODEJS_12_X,
  handler: 'lambda/add-cash-to-register.handler',
  code: new lambda.AssetCode('../../application'),
  environment: {
    DYNAMODB_TABLE_NAME: eventTable.tableName
  }
})
eventTable.grantReadWriteData(addCashToRegister);



const apiGateway = require('@aws-cdk/aws-apigateway')

const api = apiGateway.RestApi.fromRestApiId(stack, 'event-sourcing-api', 'bekfnoqf05')

const deployment = new apiGateway.Deployment(stack, 'deployment', {
  api
});

new apiGateway.Stage(stack, 'stage', {
  deployment,
  stageName: version
})