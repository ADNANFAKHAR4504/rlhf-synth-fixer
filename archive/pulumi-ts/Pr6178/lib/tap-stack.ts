/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the serverless transaction processing pipeline.
 * This stack creates a complete event-driven architecture for processing webhook-based
 * transaction data with validation, enrichment, storage, and failure handling.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import * as path from 'path';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Main Pulumi component resource for the serverless transaction processing pipeline.
 *
 * Creates:
 * - API Gateway REST API with /webhook endpoint
 * - Lambda functions for validation and processing
 * - DynamoDB table for transaction storage
 * - SNS topic for event notifications
 * - SQS dead letter queue for failed messages
 * - CloudWatch alarms and log groups
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const defaultTags = {
      Environment: 'production',
      Service: 'transaction-processor',
      ...((args.tags as any) || {}),
    };

    // ===== IAM Roles =====

    // IAM role for validation Lambda
    const validationLambdaRole = new aws.iam.Role(
      `validation-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    // IAM role for processing Lambda
    const processingLambdaRole = new aws.iam.Role(
      `processing-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy to validation role
    new aws.iam.RolePolicyAttachment(
      `validation-lambda-basic-${environmentSuffix}`,
      {
        role: validationLambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: validationLambdaRole }
    );

    // Attach X-Ray write policy to validation role
    new aws.iam.RolePolicyAttachment(
      `validation-lambda-xray-${environmentSuffix}`,
      {
        role: validationLambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: validationLambdaRole }
    );

    // Attach basic Lambda execution policy to processing role
    new aws.iam.RolePolicyAttachment(
      `processing-lambda-basic-${environmentSuffix}`,
      {
        role: processingLambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: processingLambdaRole }
    );

    // Attach X-Ray write policy to processing role
    new aws.iam.RolePolicyAttachment(
      `processing-lambda-xray-${environmentSuffix}`,
      {
        role: processingLambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: processingLambdaRole }
    );

    // ===== DynamoDB Table =====

    const transactionsTable = new aws.dynamodb.Table(
      `transactions-table-${environmentSuffix}`,
      {
        name: `transactions-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'transactionId',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'transactionId', type: 'S' },
          { name: 'timestamp', type: 'S' },
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    // ===== SNS Topic =====

    const transactionTopic = new aws.sns.Topic(
      `transaction-topic-${environmentSuffix}`,
      {
        name: `transaction-events-${environmentSuffix}`,
        tags: defaultTags,
      },
      { parent: this }
    );

    // ===== SQS Dead Letter Queue =====

    const deadLetterQueue = new aws.sqs.Queue(
      `dlq-${environmentSuffix}`,
      {
        name: `transaction-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        visibilityTimeoutSeconds: 300, // 5 minutes
        tags: defaultTags,
      },
      { parent: this }
    );

    // ===== CloudWatch Log Groups =====

    const validationLogGroup = new aws.cloudwatch.LogGroup(
      `validation-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/validation-lambda-${environmentSuffix}`,
        retentionInDays: 30,
        tags: defaultTags,
      },
      { parent: this }
    );

    const processingLogGroup = new aws.cloudwatch.LogGroup(
      `processing-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/processing-lambda-${environmentSuffix}`,
        retentionInDays: 30,
        tags: defaultTags,
      },
      { parent: this }
    );

    // ===== Lambda Functions =====

    // Validation Lambda
    const validationLambda = new aws.lambda.Function(
      `validation-lambda-${environmentSuffix}`,
      {
        name: `validation-lambda-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'validation.handler',
        role: validationLambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(path.join(__dirname, 'lambda')),
        }),
        environment: {
          variables: {
            SNS_TOPIC_ARN: transactionTopic.arn,
          },
        },
        timeout: 30,
        tracingConfig: {
          mode: 'Active',
        },
        tags: defaultTags,
      },
      { parent: this, dependsOn: [validationLogGroup] }
    );

    // Grant SNS publish permissions to validation Lambda
    new aws.iam.RolePolicy(
      `validation-sns-policy-${environmentSuffix}`,
      {
        role: validationLambdaRole.id,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": "sns:Publish",
              "Resource": "${transactionTopic.arn}"
            }
          ]
        }`,
      },
      { parent: validationLambdaRole }
    );

    // Processing Lambda
    const processingLambda = new aws.lambda.Function(
      `processing-lambda-${environmentSuffix}`,
      {
        name: `processing-lambda-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'processing.handler',
        role: processingLambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(path.join(__dirname, 'lambda')),
        }),
        environment: {
          variables: {
            DYNAMODB_TABLE_NAME: transactionsTable.name,
            SNS_TOPIC_ARN: transactionTopic.arn,
          },
        },
        timeout: 60,
        tracingConfig: {
          mode: 'Active',
        },
        deadLetterConfig: {
          targetArn: deadLetterQueue.arn,
        },
        tags: defaultTags,
      },
      { parent: this, dependsOn: [processingLogGroup] }
    );

    // Grant DynamoDB write permissions to processing Lambda
    new aws.iam.RolePolicy(
      `processing-dynamodb-policy-${environmentSuffix}`,
      {
        role: processingLambdaRole.id,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "dynamodb:PutItem",
                "dynamodb:UpdateItem"
              ],
              "Resource": "${transactionsTable.arn}"
            }
          ]
        }`,
      },
      { parent: processingLambdaRole }
    );

    // Grant SQS permissions to processing Lambda for DLQ
    new aws.iam.RolePolicy(
      `processing-sqs-policy-${environmentSuffix}`,
      {
        role: processingLambdaRole.id,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": "sqs:SendMessage",
              "Resource": "${deadLetterQueue.arn}"
            }
          ]
        }`,
      },
      { parent: processingLambdaRole }
    );

    // SNS subscription for processing Lambda
    new aws.sns.TopicSubscription(
      `processing-subscription-${environmentSuffix}`,
      {
        topic: transactionTopic.arn,
        protocol: 'lambda',
        endpoint: processingLambda.arn,
      },
      { parent: this }
    );

    // Grant SNS permission to invoke processing Lambda
    new aws.lambda.Permission(
      `sns-invoke-processing-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: processingLambda.name,
        principal: 'sns.amazonaws.com',
        sourceArn: transactionTopic.arn,
      },
      { parent: processingLambda }
    );

    // ===== API Gateway =====

    const api = new aws.apigateway.RestApi(
      `transaction-api-${environmentSuffix}`,
      {
        name: `transaction-api-${environmentSuffix}`,
        description: 'Transaction processing webhook API',
        tags: defaultTags,
      },
      { parent: this }
    );

    // Create /webhook resource
    const webhookResource = new aws.apigateway.Resource(
      `webhook-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'webhook',
      },
      { parent: api }
    );

    // POST method for /webhook
    const webhookMethod = new aws.apigateway.Method(
      `webhook-post-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: webhookResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { parent: webhookResource }
    );

    // Lambda integration for POST /webhook
    const webhookIntegration = new aws.apigateway.Integration(
      `webhook-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: webhookResource.id,
        httpMethod: webhookMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: validationLambda.invokeArn,
      },
      { parent: webhookMethod }
    );

    // Grant API Gateway permission to invoke validation Lambda
    new aws.lambda.Permission(
      `api-invoke-validation-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: validationLambda.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: validationLambda }
    );

    // Deploy the API
    const deployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
        description: `Deployment for ${environmentSuffix}`,
      },
      {
        parent: api,
        dependsOn: [webhookMethod, webhookIntegration],
      }
    );

    // Create stage with throttling settings
    const stage = new aws.apigateway.Stage(
      `api-stage-${environmentSuffix}`,
      {
        restApi: api.id,
        deployment: deployment.id,
        stageName: environmentSuffix,
        description: `${environmentSuffix} stage`,
        tags: defaultTags,
      },
      { parent: deployment }
    );

    // Configure throttling at method level
    new aws.apigateway.MethodSettings(
      `webhook-throttling-${environmentSuffix}`,
      {
        restApi: api.id,
        stageName: stage.stageName,
        methodPath: '*/*',
        settings: {
          throttlingRateLimit: 10000,
          throttlingBurstLimit: 5000,
        },
      },
      { parent: stage }
    );

    // ===== CloudWatch Alarms =====

    // Alarm for validation Lambda errors
    new aws.cloudwatch.MetricAlarm(
      `validation-error-alarm-${environmentSuffix}`,
      {
        name: `validation-lambda-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 1,
        treatMissingData: 'notBreaching',
        dimensions: {
          FunctionName: validationLambda.name,
        },
        alarmDescription:
          'Triggers when validation Lambda error rate exceeds 1%',
        tags: defaultTags,
      },
      { parent: this }
    );

    // Alarm for processing Lambda errors
    new aws.cloudwatch.MetricAlarm(
      `processing-error-alarm-${environmentSuffix}`,
      {
        name: `processing-lambda-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 1,
        treatMissingData: 'notBreaching',
        dimensions: {
          FunctionName: processingLambda.name,
        },
        alarmDescription:
          'Triggers when processing Lambda error rate exceeds 1%',
        tags: defaultTags,
      },
      { parent: this }
    );

    // ===== Outputs =====

    this.apiUrl = pulumi.interpolate`${api.id}.execute-api.${aws.getRegionOutput().name}.amazonaws.com/${stage.stageName}/webhook`;
    this.tableName = transactionsTable.name;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      tableName: this.tableName,
      apiGatewayId: api.id,
      snsTopicArn: transactionTopic.arn,
      dlqUrl: deadLetterQueue.url,
      validationLambdaArn: validationLambda.arn,
      processingLambdaArn: processingLambda.arn,
    });
  }
}
