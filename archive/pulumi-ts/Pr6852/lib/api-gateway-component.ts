import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { EnvironmentConfig, ResourceTags } from './types';

export interface ApiGatewayComponentArgs {
  config: EnvironmentConfig;
  tags: ResourceTags;
  environmentSuffix: string;
  lambdaFunctionArn: pulumi.Input<string>;
  lambdaFunctionName: pulumi.Input<string>;
}

/**
 * API Gateway Component with environment-scaled rate limiting
 */
export class ApiGatewayComponent extends pulumi.ComponentResource {
  public readonly api: aws.apigateway.RestApi;
  public readonly deployment: aws.apigateway.Deployment;
  public readonly stage: aws.apigateway.Stage;

  constructor(
    name: string,
    args: ApiGatewayComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:api:ApiGatewayComponent', name, {}, opts);

    const {
      config,
      tags,
      environmentSuffix,
      lambdaFunctionArn,
      lambdaFunctionName,
    } = args;

    // Create REST API
    this.api = new aws.apigateway.RestApi(
      `payment-api-${environmentSuffix}`,
      {
        name: `payment-api-${environmentSuffix}`,
        description: `Payment processing API for ${config.environment}`,
        tags: {
          ...tags,
          Name: `payment-api-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create resource for /payments
    const paymentsResource = new aws.apigateway.Resource(
      `payments-resource-${environmentSuffix}`,
      {
        restApi: this.api.id,
        parentId: this.api.rootResourceId,
        pathPart: 'payments',
      },
      { parent: this }
    );

    // Create POST method
    const postMethod = new aws.apigateway.Method(
      `payments-post-${environmentSuffix}`,
      {
        restApi: this.api.id,
        resourceId: paymentsResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // Create Lambda integration
    const integration = new aws.apigateway.Integration(
      `payments-integration-${environmentSuffix}`,
      {
        restApi: this.api.id,
        resourceId: paymentsResource.id,
        httpMethod: postMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: pulumi.interpolate`arn:aws:apigateway:${aws.config.region}:lambda:path/2015-03-31/functions/${lambdaFunctionArn}/invocations`,
      },
      { parent: this }
    );

    // Grant API Gateway permission to invoke Lambda
    new aws.lambda.Permission(
      `api-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunctionName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${this.api.executionArn}/*/*/*`,
      },
      { parent: this }
    );

    // Create deployment
    this.deployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: this.api.id,
        triggers: {
          redeployment: pulumi
            .all([postMethod.id, integration.id])
            .apply(([methodId, integrationId]) =>
              JSON.stringify({ methodId, integrationId })
            ),
        },
      },
      { parent: this, dependsOn: [postMethod, integration] }
    );

    // Create stage with throttling
    this.stage = new aws.apigateway.Stage(
      `api-stage-${environmentSuffix}`,
      {
        restApi: this.api.id,
        deployment: this.deployment.id,
        stageName: config.environment,
        tags: {
          ...tags,
          Name: `api-stage-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create method settings for throttling
    new aws.apigateway.MethodSettings(
      `api-throttle-${environmentSuffix}`,
      {
        restApi: this.api.id,
        stageName: this.stage.stageName,
        methodPath: '*/*',
        settings: {
          throttlingRateLimit: config.apiGatewayRateLimit,
          throttlingBurstLimit: config.apiGatewayRateLimit * 2,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      apiId: this.api.id,
      apiUrl: pulumi.interpolate`https://${this.api.id}.execute-api.${aws.config.region}.amazonaws.com/${this.stage.stageName}/payments`,
    });
  }
}
