/**
 * ApiGatewayStack - API Gateway with Lambda integration
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface ApiGatewayStackArgs {
  environmentSuffix: string;
  validatorLambdaArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ApiGatewayStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;
  public readonly apiId: pulumi.Output<string>;
  public readonly stageName: pulumi.Output<string>;

  constructor(
    name: string,
    args: ApiGatewayStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:api:ApiGatewayStack', name, args, opts);

    const { environmentSuffix, validatorLambdaArn, tags } = args;

    // REST API
    const api = new aws.apigateway.RestApi(
      `payment-api-${environmentSuffix}`,
      {
        name: `payment-api-${environmentSuffix}`,
        description: 'Payment Processing API',
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-api-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    this.apiId = api.id;

    // Resource: /payments
    const paymentsResource = new aws.apigateway.Resource(
      `payment-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'payments',
      },
      { parent: this }
    );

    // Method: POST /payments
    const paymentsMethod = new aws.apigateway.Method(
      `payment-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: paymentsResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // Lambda Integration
    const integration = new aws.apigateway.Integration(
      `payment-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: paymentsResource.id,
        httpMethod: paymentsMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: validatorLambdaArn.apply(
          arn =>
            `arn:aws:apigateway:eu-south-2:lambda:path/2015-03-31/functions/${arn}/invocations`
        ),
      },
      { parent: this }
    );

    // Lambda Permission for API Gateway
    new aws.lambda.Permission(
      `payment-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: validatorLambdaArn,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*/*`,
      },
      { parent: this }
    );

    // Deployment
    const deployment = new aws.apigateway.Deployment(
      `payment-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
        triggers: {
          redeployment: pulumi
            .all([paymentsResource.id, paymentsMethod.id, integration.id])
            .apply(([r, m, i]) =>
              JSON.stringify({ resource: r, method: m, integration: i })
            ),
        },
      },
      { parent: this, dependsOn: [integration] }
    );

    // Stage with throttling
    const stage = new aws.apigateway.Stage(
      `payment-stage-${environmentSuffix}`,
      {
        restApi: api.id,
        deployment: deployment.id,
        stageName: environmentSuffix,
        tags,
      },
      { parent: this }
    );

    this.stageName = stage.stageName;

    // Method Settings for throttling (10,000 requests per minute = ~167 per second)
    new aws.apigateway.MethodSettings(
      `payment-method-settings-${environmentSuffix}`,
      {
        restApi: api.id,
        stageName: stage.stageName,
        methodPath: '*/*',
        settings: {
          throttlingBurstLimit: 5000,
          throttlingRateLimit: 167, // 10,000 per minute / 60 seconds
        },
      },
      { parent: this }
    );

    this.apiUrl = pulumi.interpolate`https://${api.id}.execute-api.eu-south-2.amazonaws.com/${stage.stageName}/payments`;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      apiId: this.apiId,
      stageName: this.stageName,
    });
  }
}
