/**
 * apigateway-stack.ts
 *
 * API Gateway REST API for webhook endpoint.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ApiGatewayStackArgs {
  environmentSuffix: string;
  webhookLambdaArn: pulumi.Input<string>;
  webhookLambdaName: pulumi.Input<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ApiGatewayStack extends pulumi.ComponentResource {
  public readonly api: aws.apigateway.RestApi;
  public readonly apiEndpoint: pulumi.Output<string>;

  constructor(
    name: string,
    args: ApiGatewayStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:apigateway:ApiGatewayStack', name, args, opts);

    // Create IAM role for API Gateway CloudWatch logging
    const apiGatewayLoggingRole = new aws.iam.Role(
      `api-logging-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'apigateway.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs',
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    // Set API Gateway account settings (only needs to be done once per region/account)
    const apiAccount = new aws.apigateway.Account(
      `api-account-${args.environmentSuffix}`,
      {
        cloudwatchRoleArn: apiGatewayLoggingRole.arn,
      },
      { parent: this }
    );

    // Create REST API
    this.api = new aws.apigateway.RestApi(
      `payment-api-${args.environmentSuffix}`,
      {
        name: `payment-api-${args.environmentSuffix}`,
        description: 'Payment webhook processing API',
        tags: args.tags,
      },
      { parent: this }
    );

    // Create request validator
    const requestValidator = new aws.apigateway.RequestValidator(
      `webhook-validator-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        name: `webhook-validator-${args.environmentSuffix}`,
        validateRequestBody: true,
      },
      { parent: this }
    );

    // Create request model for validation
    const requestModel = new aws.apigateway.Model(
      `webhook-model-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        name: `WebhookModel${args.environmentSuffix.replace(/[^a-zA-Z0-9]/g, '')}`,
        contentType: 'application/json',
        schema: JSON.stringify({
          $schema: 'http://json-schema.org/draft-04/schema#',
          title: 'WebhookPayload',
          type: 'object',
          required: ['amount', 'currency', 'provider'],
          properties: {
            amount: { type: 'number' },
            currency: { type: 'string' },
            provider: { type: 'string' },
          },
        }),
      },
      { parent: this }
    );

    // Create /webhook resource
    const webhookResource = new aws.apigateway.Resource(
      `webhook-resource-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        parentId: this.api.rootResourceId,
        pathPart: 'webhook',
      },
      { parent: this }
    );

    // Create POST method
    const webhookMethod = new aws.apigateway.Method(
      `webhook-method-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        resourceId: webhookResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
        requestValidatorId: requestValidator.id,
        requestModels: {
          'application/json': requestModel.name,
        },
      },
      { parent: this }
    );

    // Create Lambda integration
    const webhookIntegration = new aws.apigateway.Integration(
      `webhook-integration-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        resourceId: webhookResource.id,
        httpMethod: webhookMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: pulumi.interpolate`arn:aws:apigateway:ap-southeast-2:lambda:path/2015-03-31/functions/${args.webhookLambdaArn}/invocations`,
      },
      { parent: this }
    );

    // Permission for API Gateway to invoke Lambda
    const lambdaPermission = new aws.lambda.Permission(
      `api-lambda-permission-${args.environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: args.webhookLambdaName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${this.api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // CloudWatch Log Group for API Gateway
    const apiLogGroup = new aws.cloudwatch.LogGroup(
      `api-logs-${args.environmentSuffix}`,
      {
        name: `/aws/apigateway/payment-api-${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: args.tags,
      },
      { parent: this }
    );

    // Deploy API
    const deployment = new aws.apigateway.Deployment(
      `api-deployment-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        triggers: {
          redeployment: pulumi.interpolate`${webhookResource.id}-${webhookMethod.id}-${webhookIntegration.id}`,
        },
      },
      { parent: this, dependsOn: [webhookIntegration] }
    );

    // Create stage with throttling
    const stage = new aws.apigateway.Stage(
      `api-stage-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        deployment: deployment.id,
        stageName: 'prod',
        accessLogSettings: {
          destinationArn: apiLogGroup.arn,
          format: JSON.stringify({
            requestId: '$context.requestId',
            ip: '$context.identity.sourceIp',
            requestTime: '$context.requestTime',
            httpMethod: '$context.httpMethod',
            resourcePath: '$context.resourcePath',
            status: '$context.status',
            protocol: '$context.protocol',
            responseLength: '$context.responseLength',
          }),
        },
        tags: args.tags,
      },
      { parent: this, dependsOn: [apiAccount] }
    );

    // Method settings for rate limiting
    const methodSettings = new aws.apigateway.MethodSettings(
      `method-settings-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        stageName: stage.stageName,
        methodPath: '*/*',
        settings: {
          throttlingBurstLimit: 1000,
          throttlingRateLimit: 1000,
          loggingLevel: 'INFO',
          dataTraceEnabled: true,
          metricsEnabled: true,
        },
      },
      { parent: this }
    );

    // Ensure resources are created (prevent unused variable warnings)
    void lambdaPermission;
    void methodSettings;

    // Construct the proper API Gateway endpoint URL
    this.apiEndpoint = pulumi.interpolate`https://${this.api.id}.execute-api.ap-southeast-2.amazonaws.com/${stage.stageName}/webhook`;

    this.registerOutputs({
      apiEndpoint: this.apiEndpoint,
    });
  }
}
