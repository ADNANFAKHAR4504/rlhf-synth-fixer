/**
 * apigateway-stack.ts
 *
 * This module defines the API Gateway REST API with Lambda integration
 * and request throttling for payment processing.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ApiGatewayStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  validatorFunctionArn: pulumi.Input<string>;
  validatorFunctionName: pulumi.Input<string>;
}

export class ApiGatewayStack extends pulumi.ComponentResource {
  public readonly apiGateway: aws.apigateway.RestApi;
  public readonly apiUrl: pulumi.Output<string>;

  constructor(
    name: string,
    args: ApiGatewayStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:apigateway:ApiGatewayStack', name, args, opts);

    const {
      environmentSuffix,
      tags,
      validatorFunctionArn,
      validatorFunctionName,
    } = args;

    // Create REST API
    this.apiGateway = new aws.apigateway.RestApi(
      `payment-api-${environmentSuffix}`,
      {
        name: `payment-api-${environmentSuffix}`,
        description: `Payment Processing API - ${environmentSuffix}`,
        endpointConfiguration: {
          types: 'REGIONAL',
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-api-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Create /payments resource
    const paymentsResource = new aws.apigateway.Resource(
      `payment-resource-${environmentSuffix}`,
      {
        restApi: this.apiGateway.id,
        parentId: this.apiGateway.rootResourceId,
        pathPart: 'payments',
      },
      { parent: this }
    );

    // Create POST method for /payments
    const paymentsMethod = new aws.apigateway.Method(
      `payment-method-${environmentSuffix}`,
      {
        restApi: this.apiGateway.id,
        resourceId: paymentsResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // Create Lambda integration
    const paymentsIntegration = new aws.apigateway.Integration(
      `payment-integration-${environmentSuffix}`,
      {
        restApi: this.apiGateway.id,
        resourceId: paymentsResource.id,
        httpMethod: paymentsMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: pulumi.interpolate`arn:aws:apigateway:ap-southeast-1:lambda:path/2015-03-31/functions/${validatorFunctionArn}/invocations`,
      },
      { parent: this }
    );

    // Grant API Gateway permission to invoke Lambda
    new aws.lambda.Permission(
      `payment-api-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: validatorFunctionName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${this.apiGateway.executionArn}/*/*`,
      },
      { parent: this }
    );

    // Create deployment
    const deployment = new aws.apigateway.Deployment(
      `payment-deployment-${environmentSuffix}`,
      {
        restApi: this.apiGateway.id,
      },
      {
        parent: this,
        dependsOn: [paymentsIntegration],
      }
    );

    // Create stage with throttling
    const stage = new aws.apigateway.Stage(
      `payment-stage-${environmentSuffix}`,
      {
        restApi: this.apiGateway.id,
        stageName: environmentSuffix,
        deployment: deployment.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-stage-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Configure method settings with throttling (10,000 requests per minute = 166.67 requests per second)
    new aws.apigateway.MethodSettings(
      `payment-method-settings-${environmentSuffix}`,
      {
        restApi: this.apiGateway.id,
        stageName: stage.stageName,
        methodPath: '*/*',
        settings: {
          throttlingBurstLimit: 200,
          throttlingRateLimit: 167, // ~10,000 requests per minute
          metricsEnabled: true,
          loggingLevel: 'INFO',
          dataTraceEnabled: true,
        },
      },
      { parent: this }
    );

    // Construct API URL
    this.apiUrl = pulumi.interpolate`https://${this.apiGateway.id}.execute-api.ap-southeast-1.amazonaws.com/${stage.stageName}/payments`;

    this.registerOutputs({
      apiGatewayId: this.apiGateway.id,
      apiUrl: this.apiUrl,
    });
  }
}
