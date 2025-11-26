/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the Crypto Price Alert System.
 * Orchestrates Lambda functions, DynamoDB tables, API Gateway, SQS, SNS, EventBridge, and KMS.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly alertRulesTableName: pulumi.Output<string>;
  public readonly priceHistoryTableName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Custom KMS key for Lambda environment variable encryption
    const kmsKey = new aws.kms.Key(
      `crypto-alert-kms-${environmentSuffix}`,
      {
        description: 'KMS key for encrypting Lambda environment variables',
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `crypto-alert-kms-alias-${environmentSuffix}`,
      {
        targetKeyId: kmsKey.id,
        name: `alias/crypto-alert-${environmentSuffix}`,
      },
      { parent: this }
    );

    // DynamoDB table for user alert rules
    const alertRulesTable = new aws.dynamodb.Table(
      `crypto-alert-rules-${environmentSuffix}`,
      {
        name: `crypto-alert-rules-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'userId',
        rangeKey: 'alertId',
        attributes: [
          { name: 'userId', type: 'S' },
          { name: 'alertId', type: 'S' },
        ],
        pointInTimeRecovery: {
          enabled: true,
        },
        tags: tags,
      },
      { parent: this }
    );

    // DynamoDB table for price history with TTL
    const priceHistoryTable = new aws.dynamodb.Table(
      `crypto-alert-price-history-${environmentSuffix}`,
      {
        name: `crypto-alert-price-history-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'symbol',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'symbol', type: 'S' },
          { name: 'timestamp', type: 'N' },
        ],
        ttl: {
          attributeName: 'expiryTime',
          enabled: true,
        },
        tags: tags,
      },
      { parent: this }
    );

    // SNS topic for outbound notifications with server-side encryption
    const snsTopic = new aws.sns.Topic(
      `crypto-alert-notifications-${environmentSuffix}`,
      {
        name: `crypto-alert-notifications-${environmentSuffix}`,
        kmsMasterKeyId: kmsKey.id,
        tags: tags,
      },
      { parent: this }
    );

    // Dead letter queue
    const deadLetterQueue = new aws.sqs.Queue(
      `crypto-alert-dlq-${environmentSuffix}`,
      {
        name: `crypto-alert-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: tags,
      },
      { parent: this }
    );

    // Main SQS queue between ingestion and evaluation Lambdas
    const mainQueue = new aws.sqs.Queue(
      `crypto-alert-queue-${environmentSuffix}`,
      {
        name: `crypto-alert-queue-${environmentSuffix}`,
        visibilityTimeoutSeconds: 300, // 5 minutes
        redrivePolicy: pulumi.jsonStringify({
          deadLetterTargetArn: deadLetterQueue.arn,
          maxReceiveCount: 3,
        }),
        tags: tags,
      },
      { parent: this }
    );

    // IAM role for ingestion Lambda
    const ingestionLambdaRole = new aws.iam.Role(
      `crypto-alert-ingestion-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: tags,
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `crypto-alert-ingestion-lambda-basic-${environmentSuffix}`,
      {
        role: ingestionLambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Attach X-Ray write policy
    new aws.iam.RolePolicyAttachment(
      `crypto-alert-ingestion-lambda-xray-${environmentSuffix}`,
      {
        role: ingestionLambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    // Inline policy for ingestion Lambda - DynamoDB and SQS access
    const ingestionLambdaPolicy = new aws.iam.RolePolicy(
      `crypto-alert-ingestion-lambda-policy-${environmentSuffix}`,
      {
        role: ingestionLambdaRole.id,
        policy: pulumi
          .all([priceHistoryTable.arn, mainQueue.arn, kmsKey.arn])
          .apply(([tableArn, queueArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['dynamodb:PutItem'],
                  Resource: tableArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: queueArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt'],
                  Resource: keyArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Webhook ingestion Lambda function
    const ingestionLambda = new aws.lambda.Function(
      `crypto-alert-ingestion-${environmentSuffix}`,
      {
        name: `crypto-alert-ingestion-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: ingestionLambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive('../lib/lambda/ingestion'),
        }),
        memorySize: 256,
        timeout: 30,
        architectures: ['arm64'],
        environment: {
          variables: {
            PRICE_HISTORY_TABLE: priceHistoryTable.name,
            QUEUE_URL: mainQueue.url,
          },
        },
        kmsKeyArn: kmsKey.arn,
        tracingConfig: {
          mode: 'Active',
        },
        tags: tags,
      },
      { parent: this, dependsOn: [ingestionLambdaPolicy] }
    );

    // IAM role for evaluation Lambda
    const evaluationLambdaRole = new aws.iam.Role(
      `crypto-alert-evaluation-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: tags,
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `crypto-alert-evaluation-lambda-basic-${environmentSuffix}`,
      {
        role: evaluationLambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Attach X-Ray write policy
    new aws.iam.RolePolicyAttachment(
      `crypto-alert-evaluation-lambda-xray-${environmentSuffix}`,
      {
        role: evaluationLambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    // Inline policy for evaluation Lambda - DynamoDB, SQS, and SNS access
    const evaluationLambdaPolicy = new aws.iam.RolePolicy(
      `crypto-alert-evaluation-lambda-policy-${environmentSuffix}`,
      {
        role: evaluationLambdaRole.id,
        policy: pulumi
          .all([
            alertRulesTable.arn,
            priceHistoryTable.arn,
            mainQueue.arn,
            snsTopic.arn,
            kmsKey.arn,
          ])
          .apply(([rulesArn, historyArn, queueArn, topicArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:Query',
                    'dynamodb:Scan',
                    'dynamodb:GetItem',
                  ],
                  Resource: rulesArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['dynamodb:Query', 'dynamodb:GetItem'],
                  Resource: historyArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'sqs:ReceiveMessage',
                    'sqs:DeleteMessage',
                    'sqs:GetQueueAttributes',
                  ],
                  Resource: queueArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: topicArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                  Resource: keyArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Rule evaluation Lambda function
    const evaluationLambda = new aws.lambda.Function(
      `crypto-alert-evaluation-${environmentSuffix}`,
      {
        name: `crypto-alert-evaluation-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: evaluationLambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive('../lib/lambda/evaluation'),
        }),
        memorySize: 512,
        timeout: 60,
        architectures: ['arm64'],
        environment: {
          variables: {
            ALERT_RULES_TABLE: alertRulesTable.name,
            PRICE_HISTORY_TABLE: priceHistoryTable.name,
            SNS_TOPIC_ARN: snsTopic.arn,
          },
        },
        kmsKeyArn: kmsKey.arn,
        tracingConfig: {
          mode: 'Active',
        },
        tags: tags,
      },
      { parent: this, dependsOn: [evaluationLambdaPolicy] }
    );

    // SQS event source mapping for evaluation Lambda
    new aws.lambda.EventSourceMapping(
      `crypto-alert-evaluation-sqs-trigger-${environmentSuffix}`,
      {
        eventSourceArn: mainQueue.arn,
        functionName: evaluationLambda.name,
        batchSize: 10,
        enabled: true,
      },
      { parent: this }
    );

    // EventBridge rule for scheduled evaluation every 5 minutes
    const eventBridgeRole = new aws.iam.Role(
      `crypto-alert-eventbridge-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'events.amazonaws.com',
        }),
        tags: tags,
      },
      { parent: this }
    );

    const eventBridgePolicy = new aws.iam.RolePolicy(
      `crypto-alert-eventbridge-policy-${environmentSuffix}`,
      {
        role: eventBridgeRole.id,
        policy: evaluationLambda.arn.apply(lambdaArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['lambda:InvokeFunction'],
                Resource: lambdaArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    const scheduledRule = new aws.cloudwatch.EventRule(
      `crypto-alert-scheduled-evaluation-${environmentSuffix}`,
      {
        name: `crypto-alert-scheduled-evaluation-${environmentSuffix}`,
        description: 'Trigger evaluation Lambda every 5 minutes',
        scheduleExpression: 'rate(5 minutes)',
        tags: tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `crypto-alert-scheduled-target-${environmentSuffix}`,
      {
        rule: scheduledRule.name,
        arn: evaluationLambda.arn,
        roleArn: eventBridgeRole.arn,
      },
      { parent: this, dependsOn: [eventBridgePolicy] }
    );

    // Lambda permission for EventBridge
    new aws.lambda.Permission(
      `crypto-alert-eventbridge-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: evaluationLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: scheduledRule.arn,
      },
      { parent: this }
    );

    // API Gateway REST API
    const restApi = new aws.apigateway.RestApi(
      `crypto-alert-api-${environmentSuffix}`,
      {
        name: `crypto-alert-api-${environmentSuffix}`,
        description: 'Crypto price alert webhook API',
        tags: tags,
      },
      { parent: this }
    );

    // Enable X-Ray tracing on API Gateway
    const apiGatewayAccount = new aws.apigateway.Account(
      `crypto-alert-api-account-${environmentSuffix}`,
      {
        cloudwatchRoleArn: new aws.iam.Role(
          `crypto-alert-api-cloudwatch-role-${environmentSuffix}`,
          {
            assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
              Service: 'apigateway.amazonaws.com',
            }),
            managedPolicyArns: [
              'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs',
            ],
            tags: tags,
          },
          { parent: this }
        ).arn,
      },
      { parent: this }
    );

    // Request validator for API Gateway
    const requestValidator = new aws.apigateway.RequestValidator(
      `crypto-alert-api-validator-${environmentSuffix}`,
      {
        restApi: restApi.id,
        name: `crypto-alert-validator-${environmentSuffix}`,
        validateRequestBody: true,
        validateRequestParameters: true,
      },
      { parent: this }
    );

    // Request model for validation
    const requestModel = new aws.apigateway.Model(
      `crypto-alert-api-model-${environmentSuffix}`,
      {
        restApi: restApi.id,
        name: `WebhookRequest${environmentSuffix.replace(/[^a-zA-Z0-9]/g, '')}`,
        description: 'Webhook request validation model',
        contentType: 'application/json',
        schema: JSON.stringify({
          $schema: 'http://json-schema.org/draft-04/schema#',
          title: 'WebhookRequest',
          type: 'object',
          properties: {
            exchange: { type: 'string' },
            symbol: { type: 'string' },
            price: { type: 'number' },
          },
          required: ['exchange', 'symbol', 'price'],
        }),
      },
      { parent: this }
    );

    // /webhook resource
    const webhookResource = new aws.apigateway.Resource(
      `crypto-alert-api-webhook-resource-${environmentSuffix}`,
      {
        restApi: restApi.id,
        parentId: restApi.rootResourceId,
        pathPart: 'webhook',
      },
      { parent: this }
    );

    // POST method with request validation
    const webhookMethod = new aws.apigateway.Method(
      `crypto-alert-api-webhook-method-${environmentSuffix}`,
      {
        restApi: restApi.id,
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

    // Lambda integration for POST /webhook
    const webhookIntegration = new aws.apigateway.Integration(
      `crypto-alert-api-webhook-integration-${environmentSuffix}`,
      {
        restApi: restApi.id,
        resourceId: webhookResource.id,
        httpMethod: webhookMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: ingestionLambda.invokeArn,
      },
      { parent: this }
    );

    // Lambda permission for API Gateway
    new aws.lambda.Permission(
      `crypto-alert-api-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: ingestionLambda.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${restApi.executionArn}/*/*`,
      },
      { parent: this }
    );

    // API Gateway deployment
    const deployment = new aws.apigateway.Deployment(
      `crypto-alert-api-deployment-${environmentSuffix}`,
      {
        restApi: restApi.id,
        triggers: {
          redeployment: pulumi
            .all([webhookMethod.id, webhookIntegration.id])
            .apply(([methodId, integrationId]) =>
              JSON.stringify({ methodId, integrationId, timestamp: Date.now() })
            ),
        },
      },
      { parent: this, dependsOn: [webhookMethod, webhookIntegration] }
    );

    // API Gateway stage with X-Ray tracing
    const stage = new aws.apigateway.Stage(
      `crypto-alert-api-stage-${environmentSuffix}`,
      {
        restApi: restApi.id,
        deployment: deployment.id,
        stageName: environmentSuffix,
        xrayTracingEnabled: true,
        tags: tags,
      },
      { parent: this, dependsOn: [apiGatewayAccount] }
    );

    // Export outputs
    this.apiEndpoint = pulumi.interpolate`https://${restApi.id}.execute-api.us-east-1.amazonaws.com/${stage.stageName}/webhook`;
    this.alertRulesTableName = alertRulesTable.name;
    this.priceHistoryTableName = priceHistoryTable.name;
    this.snsTopicArn = snsTopic.arn;

    this.registerOutputs({
      apiEndpoint: this.apiEndpoint,
      alertRulesTableName: this.alertRulesTableName,
      priceHistoryTableName: this.priceHistoryTableName,
      snsTopicArn: this.snsTopicArn,
    });
  }
}
