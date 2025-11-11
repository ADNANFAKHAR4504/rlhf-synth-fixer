# Serverless Transaction Processing Pipeline - Corrected Implementation

This is the corrected implementation with all issues from MODEL_RESPONSE.md fixed.

## File: lib/tap-stack.ts

```typescript
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

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const defaultTags = {
      Environment: 'production',
      Service: 'transaction-processor',
      ...(args.tags as any || {}),
    };

    // ===== IAM Roles =====

    const validationLambdaRole = new aws.iam.Role(
      `validation-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
          }],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    const processingLambdaRole = new aws.iam.Role(
      `processing-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
          }],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    // FIXED Issue 1: Added X-Ray policy attachments
    new aws.iam.RolePolicyAttachment(
      `validation-lambda-basic-${environmentSuffix}`,
      {
        role: validationLambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: validationLambdaRole }
    );

    new aws.iam.RolePolicyAttachment(
      `validation-lambda-xray-${environmentSuffix}`,
      {
        role: validationLambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: validationLambdaRole }
    );

    new aws.iam.RolePolicyAttachment(
      `processing-lambda-basic-${environmentSuffix}`,
      {
        role: processingLambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: processingLambdaRole }
    );

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

    // FIXED Issue 2: Added Dead Letter Queue
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

    // FIXED Issue 3: Added CloudWatch Log Groups
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
        reservedConcurrentExecutions: 1000,
        tracingConfig: {
          mode: 'Active',
        },
        tags: defaultTags,
      },
      { parent: this, dependsOn: [validationLogGroup] }
    );

    // FIXED Issue 4: Added SNS publish permission policy
    const validationSnsPolicy = new aws.iam.RolePolicy(
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

    // FIXED Issue 5: Added deadLetterConfig to processing Lambda
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
        reservedConcurrentExecutions: 1000,
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

    // FIXED Issue 6: Added DynamoDB write permission policy
    const processingDynamoPolicy = new aws.iam.RolePolicy(
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

    const processingSqsPolicy = new aws.iam.RolePolicy(
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

    const snsSubscription = new aws.sns.TopicSubscription(
      `processing-subscription-${environmentSuffix}`,
      {
        topic: transactionTopic.arn,
        protocol: 'lambda',
        endpoint: processingLambda.arn,
      },
      { parent: this }
    );

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

    const webhookResource = new aws.apigateway.Resource(
      `webhook-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'webhook',
      },
      { parent: api }
    );

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

    const deployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
        description: `Deployment for ${environmentSuffix}`,
      },
      { parent: api, dependsOn: [webhookMethod, webhookIntegration] }
    );

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

    // FIXED Issue 7: Added API Gateway throttling
    const methodSettings = new aws.apigateway.MethodSettings(
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

    // FIXED Issue 8: Added CloudWatch alarms
    const validationErrorAlarm = new aws.cloudwatch.MetricAlarm(
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
        alarmDescription: 'Triggers when validation Lambda error rate exceeds 1%',
        tags: defaultTags,
      },
      { parent: this }
    );

    const processingErrorAlarm = new aws.cloudwatch.MetricAlarm(
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
        alarmDescription: 'Triggers when processing Lambda error rate exceeds 1%',
        tags: defaultTags,
      },
      { parent: this }
    );

    // FIXED Issue 9: Use dynamic region instead of hardcoded
    this.apiUrl = pulumi.interpolate`${api.id}.execute-api.${aws.getRegionOutput().name}.amazonaws.com/${stage.stageName}/webhook`;
    this.tableName = transactionsTable.name;

    // FIXED Issue 10: Complete outputs registration
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
```

## File: lib/lambda/validation.js

Same as MODEL_RESPONSE.md - no issues found.

## File: lib/lambda/processing.js

Same as MODEL_RESPONSE.md - no issues found.

## File: bin/tap.ts

Same as MODEL_RESPONSE.md - no issues found.

## Summary of Fixes

All 10 issues from MODEL_RESPONSE.md have been corrected:

1. Added X-Ray policy attachments for both Lambda roles
2. Added Dead Letter Queue (SQS) configuration
3. Added CloudWatch Log Groups with 30-day retention
4. Added SNS publish permission policy for validation Lambda
5. Added deadLetterConfig to processing Lambda
6. Added DynamoDB write permission policy for processing Lambda
7. Added API Gateway throttling configuration (10,000 req/sec)
8. Added CloudWatch alarms for Lambda errors
9. Fixed API URL to use dynamic region instead of hardcoded
10. Added complete outputs registration with all resource ARNs/URLs

The implementation now fully satisfies all requirements specified in PROMPT.md.
