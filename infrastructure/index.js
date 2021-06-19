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


const kinesis = require('@aws-cdk/aws-kinesis');
new kinesis.Stream(stack, 'event-bus', {
  shardCount: 5
})


const lambda = require('@aws-cdk/aws-lambda');
const apiGateway = require('@aws-cdk/aws-apigateway')

const api = new apiGateway.RestApi(stack, 'rest-api', {
  restApiName: 'rest-api'
});

(
  () => {
    const fn = new lambda.Function(stack, 'hello-world', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda/hello-world.handler',
      code: new lambda.AssetCode('../application')
    });

    const resource = api.root.addResource('hello_world');
    const integration = new apiGateway.LambdaIntegration(fn);

    resource.addMethod('GET', integration);
  }
)();

(
  () => {
    const fn = new lambda.Function(stack, 'add-cash-to-register', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda/add-cash-to-register.handler',
      code: new lambda.AssetCode('../application'),
      environment: {
        DYNAMODB_TABLE_NAME: eventTable.tableName
      }
    });

    const resource = api.root.addResource('add_cash_to_register');
    const integration = new apiGateway.LambdaIntegration(fn);

    resource.addMethod('POST', integration);


    eventTable.grantReadWriteData(fn);
  }
)()

module.exports = { stack }