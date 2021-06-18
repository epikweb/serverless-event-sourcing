#!/usr/bin/env node
const cdk = require('@aws-cdk/core');
const app = new cdk.App();

const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
const stack = new cdk.Stack(app, `event-sourcing`, { env: { region: 'us-east-2' }})

const apiGateway = require('@aws-cdk/aws-apigateway')
const api = new apiGateway.RestApi(stack, 'event-sourcing-api');


const lambda = require('@aws-cdk/aws-lambda');


(
  () => {
    const fn = new lambda.Function(stack, 'hello-world', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'lambda/hello-world.handler',
      code: new lambda.AssetCode('../../application')
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
      handler: 'lambda/hello-world.handler',
      code: new lambda.AssetCode('../../application')
    });

    const resource = api.root.addResource('add_cash_to_register');
    const integration = new apiGateway.LambdaIntegration(fn);

    resource.addMethod('POST', integration);
  }
)()