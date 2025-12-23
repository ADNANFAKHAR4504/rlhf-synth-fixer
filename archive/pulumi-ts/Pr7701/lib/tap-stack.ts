/**
 * Webhook Processing System - Baseline Infrastructure (NON-OPTIMIZED)
 *
 * This is the BASELINE implementation with intentionally non-optimized settings.
 * The optimize.py script will optimize these resources after deployment.
 *
 * Baseline Configuration:
 * - 3 separate Lambda functions (will be consolidated)
 * - DynamoDB on-demand billing (will switch to provisioned)
 * - API Gateway REST API (will replace with HTTP API)
 * - Lambda functions with 3GB memory (will reduce to 512MB)
 * - Unlimited Lambda concurrency (will add reserved concurrency)
 * - No CloudWatch log retention (will add 7-day retention)
 * - Broad IAM permissions (will optimize)
 * - No DLQ (will add)
 * - No cost tags (will add)
 * - Partial X-Ray tracing (will fix)
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;
  public readonly receiverFunctionName: pulumi.Output<string>;
  public readonly validatorFunctionName: pulumi.Output<string>;
  public readonly processorFunctionName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const defaultTags = {
      Environment: environmentSuffix,
      ManagedBy: 'Pulumi',
      Project: 'WebhookProcessing',
      ...(args.tags || {}),
    };

    // ========================================
    // DynamoDB Table - BASELINE: On-Demand Billing
    // ========================================
    const webhookTable = new aws.dynamodb.Table(
      `webhook-table-${environmentSuffix}`,
      {
        name: `webhook-table-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST', // BASELINE: Should be PROVISIONED for 500 RPS
        hashKey: 'webhookId',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'webhookId', type: 'S' },
          { name: 'timestamp', type: 'N' },
          { name: 'status', type: 'S' },
        ],
        globalSecondaryIndexes: [
          {
            name: 'StatusIndex',
            hashKey: 'status',
            rangeKey: 'timestamp',
            projectionType: 'ALL',
          },
        ],
        tags: defaultTags,
        pointInTimeRecovery: { enabled: true },
        serverSideEncryption: { enabled: true },
      },
      { parent: this }
    );

    // ========================================
    // IAM Role for Lambda Functions - BASELINE: Broad Permissions
    // ========================================
    const lambdaRole = new aws.iam.Role(
      `webhook-lambda-role-${environmentSuffix}`,
      {
        name: `webhook-lambda-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    // BASELINE: Overly broad DynamoDB permissions
    const dynamoPolicy = new aws.iam.RolePolicy(
      `webhook-dynamo-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "dynamodb:*"
          ],
          "Resource": "*"
        }]
      }`,
      },
      { parent: this }
    );

    // BASELINE: Broad X-Ray permissions
    const xrayPolicy = new aws.iam.RolePolicy(
      `webhook-xray-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['xray:*'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // ========================================
    // Lambda Function 1: Webhook Receiver - BASELINE
    // ========================================
    const receiverFunction = new aws.lambda.Function(
      `webhook-receiver-${environmentSuffix}`,
      {
        name: `webhook-receiver-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        memorySize: 3072, // BASELINE: Unnecessarily high, should be 512MB
        timeout: 30,
        // BASELINE: No reserved concurrency (unlimited)
        environment: {
          variables: {
            TABLE_NAME: webhookTable.name,
            ENVIRONMENT: environmentSuffix,
          },
        },
        // BASELINE: Partial X-Ray tracing
        tracingConfig: { mode: 'PassThrough' }, // Should be Active
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Receiving webhook:', JSON.stringify(event));
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Webhook received' })
  };
};
`),
        }),
        tags: defaultTags,
      },
      { parent: this, dependsOn: [lambdaRole, dynamoPolicy, xrayPolicy] }
    );

    // BASELINE: No CloudWatch log retention policy
    // (Logs will be kept indefinitely)

    // ========================================
    // Lambda Function 2: Webhook Validator - BASELINE
    // ========================================
    const validatorFunction = new aws.lambda.Function(
      `webhook-validator-${environmentSuffix}`,
      {
        name: `webhook-validator-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        memorySize: 3072, // BASELINE: Unnecessarily high
        timeout: 30,
        environment: {
          variables: {
            TABLE_NAME: webhookTable.name,
            ENVIRONMENT: environmentSuffix,
          },
        },
        tracingConfig: { mode: 'PassThrough' },
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Validating webhook:', JSON.stringify(event));
  return {
    statusCode: 200,
    body: JSON.stringify({ valid: true })
  };
};
`),
        }),
        tags: defaultTags,
      },
      { parent: this, dependsOn: [lambdaRole] }
    );

    // ========================================
    // Lambda Function 3: Webhook Processor - BASELINE
    // ========================================
    const processorFunction = new aws.lambda.Function(
      `webhook-processor-${environmentSuffix}`,
      {
        name: `webhook-processor-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        memorySize: 3072, // BASELINE: Unnecessarily high
        timeout: 30,
        // BASELINE: No DLQ configured
        environment: {
          variables: {
            TABLE_NAME: webhookTable.name,
            ENVIRONMENT: environmentSuffix,
          },
        },
        tracingConfig: { mode: 'PassThrough' },
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Processing webhook:', JSON.stringify(event));
  return {
    statusCode: 200,
    body: JSON.stringify({ processed: true })
  };
};
`),
        }),
        tags: defaultTags,
      },
      { parent: this, dependsOn: [lambdaRole] }
    );

    // ========================================
    // API Gateway REST API - BASELINE (Should be HTTP API)
    // ========================================
    const api = new aws.apigatewayv2.Api(
      `webhook-api-${environmentSuffix}`,
      {
        name: `webhook-api-${environmentSuffix}`,
        protocolType: 'HTTP', // Using HTTP API (correct)
        corsConfiguration: {
          allowOrigins: ['*'],
          allowMethods: ['POST', 'GET', 'OPTIONS'],
          allowHeaders: ['Content-Type', 'Authorization'],
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // Lambda permissions for API Gateway
    const receiverPermission = new aws.lambda.Permission(
      `webhook-receiver-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: receiverFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    const validatorPermission = new aws.lambda.Permission(
      `webhook-validator-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: validatorFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    const processorPermission = new aws.lambda.Permission(
      `webhook-processor-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: processorFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // Lambda integrations
    const receiverIntegration = new aws.apigatewayv2.Integration(
      `webhook-receiver-integration-${environmentSuffix}`,
      {
        apiId: api.id,
        integrationType: 'AWS_PROXY',
        integrationUri: receiverFunction.arn,
        integrationMethod: 'POST',
        payloadFormatVersion: '2.0',
      },
      { parent: this, dependsOn: [receiverPermission] }
    );

    const validatorIntegration = new aws.apigatewayv2.Integration(
      `webhook-validator-integration-${environmentSuffix}`,
      {
        apiId: api.id,
        integrationType: 'AWS_PROXY',
        integrationUri: validatorFunction.arn,
        integrationMethod: 'POST',
        payloadFormatVersion: '2.0',
      },
      { parent: this, dependsOn: [validatorPermission] }
    );

    const processorIntegration = new aws.apigatewayv2.Integration(
      `webhook-processor-integration-${environmentSuffix}`,
      {
        apiId: api.id,
        integrationType: 'AWS_PROXY',
        integrationUri: processorFunction.arn,
        integrationMethod: 'POST',
        payloadFormatVersion: '2.0',
      },
      { parent: this, dependsOn: [processorPermission] }
    );

    // Routes
    new aws.apigatewayv2.Route(
      `webhook-receive-route-${environmentSuffix}`,
      {
        apiId: api.id,
        routeKey: 'POST /webhook/receive',
        target: pulumi.interpolate`integrations/${receiverIntegration.id}`,
      },
      { parent: this }
    );

    new aws.apigatewayv2.Route(
      `webhook-validate-route-${environmentSuffix}`,
      {
        apiId: api.id,
        routeKey: 'POST /webhook/validate',
        target: pulumi.interpolate`integrations/${validatorIntegration.id}`,
      },
      { parent: this }
    );

    new aws.apigatewayv2.Route(
      `webhook-process-route-${environmentSuffix}`,
      {
        apiId: api.id,
        routeKey: 'POST /webhook/process',
        target: pulumi.interpolate`integrations/${processorIntegration.id}`,
      },
      { parent: this }
    );

    // Stage
    new aws.apigatewayv2.Stage(
      `webhook-stage-${environmentSuffix}`,
      {
        apiId: api.id,
        name: '$default',
        autoDeploy: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Outputs
    this.apiUrl = pulumi.interpolate`${api.apiEndpoint}`;
    this.tableName = webhookTable.name;
    this.receiverFunctionName = receiverFunction.name;
    this.validatorFunctionName = validatorFunction.name;
    this.processorFunctionName = processorFunction.name;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      tableName: this.tableName,
      receiverFunctionName: this.receiverFunctionName,
      validatorFunctionName: this.validatorFunctionName,
      processorFunctionName: this.processorFunctionName,
    });
  }
}
