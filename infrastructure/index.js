#!/usr/bin/env node
const cdk = require('@aws-cdk/core');
const app = new cdk.App();


const version = process.env.GIT_SHA
if (!version) {
  throw new Error(`Version must be provided in environment variable GIT_SHA`)
}

const stack = new cdk.Stack(app, version, { stackName: version, env: { region: 'us-east-2' }})


const dynamodb = require('@aws-cdk/aws-dynamodb');
const eventTable = new dynamodb.Table(stack, 'events', {
  partitionKey: {name: 'aggregateId', type: dynamodb.AttributeType.STRING},
  sortKey: {name: 'version', type: dynamodb.AttributeType.NUMBER},
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.DESTROY
})
const projectionTable = new dynamodb.Table(stack, 'projections', {
  partitionKey: {name: 'lookupKey', type: dynamodb.AttributeType.STRING},
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.DESTROY
})


const kinesis = require('@aws-cdk/aws-kinesis');
const eventBus = new kinesis.Stream(stack, 'event-bus', {
  shardCount: 5
})


const lambda = require('@aws-cdk/aws-lambda');
const apiGateway = require('@aws-cdk/aws-apigateway')

const api = new apiGateway.RestApi(stack, 'rest-api', {
  restApiName: 'rest-api'
});

const { KinesisEventSource } = require('@aws-cdk/aws-lambda-event-sources');

(
  () => {
    const fn = new lambda.Function(stack, 'open', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'src/1-open/index.open',
      code: new lambda.AssetCode('../application'),
      environment: {
        DYNAMODB_TABLE_NAME: projectionTable.tableName
      }
    })

    const resource = api.root.addResource('open')
    const integration = new apiGateway.LambdaIntegration(fn)

    resource.addMethod('POST', integration)
    eventTable.grantReadWriteData(fn)
  }
)();

(
  () => {
    const fn = new lambda.Function(stack, 'creditMoney', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'src/2-creditMoney/index.creditMoney',
      code: new lambda.AssetCode('../application'),
      environment: {
        DYNAMODB_TABLE_NAME: eventTable.tableName
      }
    })

    const resource = api.root.addResource('credit_money')
    const integration = new apiGateway.LambdaIntegration(fn)

    resource.addMethod('POST', integration)
    eventTable.grantReadWriteData(fn)
  }
)();

(
  () => {
    const fn = new lambda.Function(stack, 'calculateBalance', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'src/3-calculateBalance/index.calculateBalance',
      code: new lambda.AssetCode('../application'),
      environment: {
        DYNAMODB_TABLE_NAME: projectionTable.tableName
      }
    });

    fn.addEventSource(new KinesisEventSource(eventBus, {
      batchSize: 100,
      startingPosition: lambda.StartingPosition.TRIM_HORIZON
    }))
    projectionTable.grantReadWriteData(fn)
  }
)();

(
  () => {
    const fn = new lambda.Function(stack, 'retrieveBalance', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'src/4-retrieveBalance/index.retrieveBalance',
      code: new lambda.AssetCode('../application'),
      environment: {
        DYNAMODB_TABLE_NAME: projectionTable.tableName
      }
    })


    const resource = api.root.addResource('retrieve_balance')
    const integration = new apiGateway.LambdaIntegration(fn)

    resource.addMethod('GET', integration)
    projectionTable.grantReadWriteData(fn)
  }
)();

module.exports = { stack }