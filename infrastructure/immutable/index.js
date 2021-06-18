#!/usr/bin/env node
const cdk = require('@aws-cdk/core');
const app = new cdk.App();
const stack = new cdk.Stack(app, 'event-sourcing', { env: { region: 'us-east-2' }})



const dynamodb = require('@aws-cdk/aws-dynamodb');
const eventTable = new dynamodb.Table(stack, 'events', {
  partitionKey: {name: 'aggregateId', type: dynamodb.AttributeType.STRING},
  sortKey: {name: 'version', type: dynamodb.AttributeType.NUMBER},
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  stream: 'NEW_IMAGE'
})

// Application lambdas
const lambda = require('@aws-cdk/aws-lambda');

const addCashToRegister = new lambda.Function(stack, 'add-cash-to-register', {
  runtime: lambda.Runtime.NODEJS_12_X,
  handler: 'workflows/cashier/add-cash-to-register.handler',
  code: new lambda.AssetCode('../application')
})

eventTable.grantReadWriteData(addCashToRegister);

const apigateway = require('@aws-cdk/aws-apigateway')
const api = new apigateway.RestApi(stack, 'cashier-api', {
  restApiName: 'Cashier'
});
const money = api.root.addResource('add_cash_to_register');
const creditIntegration = new apigateway.LambdaIntegration(addCashToRegister);
money.addMethod('POST', creditIntegration);


/*
const sqs = require('@aws-cdk/aws-sqs')
const deadLetterQueue = new sqs.Queue(stack, 'deadLetterQueue')

const { DynamoEventSource, SqsDlq } = require('@aws-cdk/aws-lambda-event-sources')
creditMoney.addEventSource(
  new DynamoEventSource(eventTable, {
    startingPosition: lambda.StartingPosition.TRIM_HORIZON,
    batchSize: 5,
    bisectBatchOnError: true,
    onFailure: new SqsDlq(deadLetterQueue),
    retryAttempts: 10
  })
)*/