/**
 * tap-stack.ts
 *
 * Serverless File Processing Pipeline using Pulumi TypeScript
 *
 * This module deploys a complete serverless file processing pipeline with:
 * - S3 bucket with versioning and lifecycle rules
 * - Three Lambda functions (validator, processor, aggregator)
 * - SQS FIFO queues for ordered message processing
 * - DynamoDB table with TTL for processing status
 * - API Gateway REST API with throttling
 * - CloudWatch Logs with 7-day retention
 * - Dead Letter Queues for error handling
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

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
 * Main Pulumi component resource for the serverless file processing pipeline.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly validatorFunctionName: pulumi.Output<string>;
  public readonly processorFunctionName: pulumi.Output<string>;
  public readonly aggregatorFunctionName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const defaultTags = {
      Environment: 'Production',
      Team: 'Analytics',
      ...(args.tags || {}),
    };

    // ========================================
    // 1. S3 Bucket with Versioning and Lifecycle Rules
    // ========================================
    const bucket = new aws.s3.Bucket(
      `file-processing-bucket-${environmentSuffix}`,
      {
        bucket: `file-processing-bucket-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            enabled: true,
            id: 'glacier-transition',
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        forceDestroy: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    // ========================================
    // 2. DynamoDB Table with TTL
    // ========================================
    const table = new aws.dynamodb.Table(
      `processing-status-${environmentSuffix}`,
      {
        name: `processing-status-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'fileId',
        attributes: [
          {
            name: 'fileId',
            type: 'S',
          },
        ],
        ttl: {
          enabled: true,
          attributeName: 'expirationTime',
        },
        pointInTimeRecovery: {
          enabled: true,
        },
        serverSideEncryption: {
          enabled: true,
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // ========================================
    // 3. Dead Letter Queues (Standard Queues)
    // ========================================
    const validatorDlq = new aws.sqs.Queue(
      `validator-dlq-${environmentSuffix}`,
      {
        name: `validator-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: defaultTags,
      },
      { parent: this }
    );

    const processorDlq = new aws.sqs.Queue(
      `processor-dlq-${environmentSuffix}`,
      {
        name: `processor-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600,
        tags: defaultTags,
      },
      { parent: this }
    );

    const aggregatorDlq = new aws.sqs.Queue(
      `aggregator-dlq-${environmentSuffix}`,
      {
        name: `aggregator-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600,
        tags: defaultTags,
      },
      { parent: this }
    );

    // ========================================
    // 4. SQS FIFO Queues for Ordered Processing
    // ========================================
    const validatorToProcessorQueue = new aws.sqs.Queue(
      `validator-to-processor-${environmentSuffix}`,
      {
        name: `validator-to-processor-${environmentSuffix}.fifo`,
        fifoQueue: true,
        contentBasedDeduplication: true,
        messageRetentionSeconds: 345600, // 4 days
        visibilityTimeoutSeconds: 300,
        tags: defaultTags,
      },
      { parent: this }
    );

    const processorToAggregatorQueue = new aws.sqs.Queue(
      `processor-to-aggregator-${environmentSuffix}`,
      {
        name: `processor-to-aggregator-${environmentSuffix}.fifo`,
        fifoQueue: true,
        contentBasedDeduplication: true,
        messageRetentionSeconds: 345600,
        visibilityTimeoutSeconds: 300,
        tags: defaultTags,
      },
      { parent: this }
    );

    // ========================================
    // 5. IAM Role for Lambda Functions
    // ========================================
    const lambdaRole = new aws.iam.Role(
      `lambda-execution-role-${environmentSuffix}`,
      {
        name: `lambda-execution-role-${environmentSuffix}`,
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

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `lambda-basic-execution-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Custom policy for S3, DynamoDB, and SQS access
    const lambdaPolicy = new aws.iam.Policy(
      `lambda-custom-policy-${environmentSuffix}`,
      {
        name: `lambda-custom-policy-${environmentSuffix}`,
        policy: pulumi
          .all([
            bucket.arn,
            table.arn,
            validatorToProcessorQueue.arn,
            processorToAggregatorQueue.arn,
            validatorDlq.arn,
            processorDlq.arn,
            aggregatorDlq.arn,
          ])
          .apply(
            ([
              bucketArn,
              tableArn,
              queue1Arn,
              queue2Arn,
              dlq1Arn,
              dlq2Arn,
              dlq3Arn,
            ]) =>
              JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
                    Resource: [bucketArn, `${bucketArn}/*`],
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'dynamodb:PutItem',
                      'dynamodb:GetItem',
                      'dynamodb:UpdateItem',
                      'dynamodb:Query',
                      'dynamodb:Scan',
                    ],
                    Resource: tableArn,
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'sqs:SendMessage',
                      'sqs:ReceiveMessage',
                      'sqs:DeleteMessage',
                      'sqs:GetQueueAttributes',
                    ],
                    Resource: [queue1Arn, queue2Arn, dlq1Arn, dlq2Arn, dlq3Arn],
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'logs:CreateLogGroup',
                      'logs:CreateLogStream',
                      'logs:PutLogEvents',
                    ],
                    Resource: 'arn:aws:logs:*:*:*',
                  },
                ],
              })
          ),
        tags: defaultTags,
      },
      { parent: this }
    );

    const lambdaPolicyAttachment = new aws.iam.RolePolicyAttachment(
      `lambda-custom-policy-attachment-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: lambdaPolicy.arn,
      },
      { parent: this }
    );

    // ========================================
    // 6. Lambda Functions
    // ========================================

    // CloudWatch Log Groups with 7-day retention
    const validatorLogGroup = new aws.cloudwatch.LogGroup(
      `validator-log-group-${environmentSuffix}`,
      {
        name: `/aws/lambda/validator-function-${environmentSuffix}`,
        retentionInDays: 7,
        tags: defaultTags,
      },
      { parent: this }
    );

    const processorLogGroup = new aws.cloudwatch.LogGroup(
      `processor-log-group-${environmentSuffix}`,
      {
        name: `/aws/lambda/processor-function-${environmentSuffix}`,
        retentionInDays: 7,
        tags: defaultTags,
      },
      { parent: this }
    );

    const aggregatorLogGroup = new aws.cloudwatch.LogGroup(
      `aggregator-log-group-${environmentSuffix}`,
      {
        name: `/aws/lambda/aggregator-function-${environmentSuffix}`,
        retentionInDays: 7,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Validator Lambda Function
    const validatorFunction = new aws.lambda.Function(
      `validator-function-${environmentSuffix}`,
      {
        name: `validator-function-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        memorySize: 512,
        timeout: 60,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
            const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
            const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

            const dynamodb = new DynamoDBClient({});
            const sqs = new SQSClient({});

            exports.handler = async (event) => {
              console.log('Validator Lambda invoked', JSON.stringify(event));

              for (const record of event.Records) {
                const bucket = record.s3.bucket.name;
                const key = record.s3.object.key;
                const fileId = key.split('/').pop();

                // Update DynamoDB
                await dynamodb.send(new PutItemCommand({
                  TableName: process.env.TABLE_NAME,
                  Item: {
                    fileId: { S: fileId },
                    status: { S: 'validated' },
                    timestamp: { N: String(Date.now()) },
                    expirationTime: { N: String(Math.floor(Date.now() / 1000) + 86400 * 30) }
                  }
                }));

                // Send to next queue
                await sqs.send(new SendMessageCommand({
                  QueueUrl: process.env.NEXT_QUEUE_URL,
                  MessageBody: JSON.stringify({ fileId, bucket, key, status: 'validated' }),
                  MessageGroupId: 'file-processing',
                  MessageDeduplicationId: fileId + Date.now()
                }));
              }

              return { statusCode: 200, body: 'Validation complete' };
            };
          `),
        }),
        environment: {
          variables: {
            TABLE_NAME: table.name,
            NEXT_QUEUE_URL: validatorToProcessorQueue.url,
          },
        },
        deadLetterConfig: {
          targetArn: validatorDlq.arn,
        },
        tags: defaultTags,
      },
      {
        parent: this,
        dependsOn: [validatorLogGroup, lambdaPolicyAttachment],
      }
    );

    // Processor Lambda Function
    const processorFunction = new aws.lambda.Function(
      `processor-function-${environmentSuffix}`,
      {
        name: `processor-function-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        memorySize: 512,
        timeout: 60,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
            const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
            const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

            const dynamodb = new DynamoDBClient({});
            const sqs = new SQSClient({});

            exports.handler = async (event) => {
              console.log('Processor Lambda invoked', JSON.stringify(event));

              for (const record of event.Records) {
                const message = JSON.parse(record.body);
                const { fileId } = message;

                // Update DynamoDB
                await dynamodb.send(new UpdateItemCommand({
                  TableName: process.env.TABLE_NAME,
                  Key: { fileId: { S: fileId } },
                  UpdateExpression: 'SET #status = :status, #timestamp = :timestamp',
                  ExpressionAttributeNames: {
                    '#status': 'status',
                    '#timestamp': 'timestamp'
                  },
                  ExpressionAttributeValues: {
                    ':status': { S: 'processed' },
                    ':timestamp': { N: String(Date.now()) }
                  }
                }));

                // Send to next queue
                await sqs.send(new SendMessageCommand({
                  QueueUrl: process.env.NEXT_QUEUE_URL,
                  MessageBody: JSON.stringify({ ...message, status: 'processed' }),
                  MessageGroupId: 'file-processing',
                  MessageDeduplicationId: fileId + Date.now()
                }));
              }

              return { statusCode: 200, body: 'Processing complete' };
            };
          `),
        }),
        environment: {
          variables: {
            TABLE_NAME: table.name,
            NEXT_QUEUE_URL: processorToAggregatorQueue.url,
          },
        },
        deadLetterConfig: {
          targetArn: processorDlq.arn,
        },
        tags: defaultTags,
      },
      {
        parent: this,
        dependsOn: [processorLogGroup, lambdaPolicyAttachment],
      }
    );

    // Aggregator Lambda Function
    const aggregatorFunction = new aws.lambda.Function(
      `aggregator-function-${environmentSuffix}`,
      {
        name: `aggregator-function-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        memorySize: 512,
        timeout: 60,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
            const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

            const dynamodb = new DynamoDBClient({});

            exports.handler = async (event) => {
              console.log('Aggregator Lambda invoked', JSON.stringify(event));

              for (const record of event.Records) {
                const message = JSON.parse(record.body);
                const { fileId } = message;

                // Final update to DynamoDB
                await dynamodb.send(new UpdateItemCommand({
                  TableName: process.env.TABLE_NAME,
                  Key: { fileId: { S: fileId } },
                  UpdateExpression: 'SET #status = :status, #timestamp = :timestamp',
                  ExpressionAttributeNames: {
                    '#status': 'status',
                    '#timestamp': 'timestamp'
                  },
                  ExpressionAttributeValues: {
                    ':status': { S: 'aggregated' },
                    ':timestamp': { N: String(Date.now()) }
                  }
                }));
              }

              return { statusCode: 200, body: 'Aggregation complete' };
            };
          `),
        }),
        environment: {
          variables: {
            TABLE_NAME: table.name,
          },
        },
        deadLetterConfig: {
          targetArn: aggregatorDlq.arn,
        },
        tags: defaultTags,
      },
      {
        parent: this,
        dependsOn: [aggregatorLogGroup, lambdaPolicyAttachment],
      }
    );

    // ========================================
    // 7. S3 Event Notification to Trigger Validator Lambda
    // ========================================
    const bucketNotificationPermission = new aws.lambda.Permission(
      `bucket-invoke-validator-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: validatorFunction.name,
        principal: 's3.amazonaws.com',
        sourceArn: bucket.arn,
      },
      { parent: this }
    );

    const _bucketNotification = new aws.s3.BucketNotification(
      `bucket-notification-${environmentSuffix}`,
      {
        bucket: bucket.id,
        lambdaFunctions: [
          {
            lambdaFunctionArn: validatorFunction.arn,
            events: ['s3:ObjectCreated:*'],
          },
        ],
      },
      { parent: this, dependsOn: [bucketNotificationPermission] }
    );
    void _bucketNotification; // Intentionally unused - resource must be created

    // ========================================
    // 8. SQS Event Source Mappings for Lambda Functions
    // ========================================
    new aws.lambda.EventSourceMapping(
      `processor-queue-trigger-${environmentSuffix}`,
      {
        eventSourceArn: validatorToProcessorQueue.arn,
        functionName: processorFunction.name,
        batchSize: 10,
        functionResponseTypes: ['ReportBatchItemFailures'],
      },
      { parent: this }
    );

    new aws.lambda.EventSourceMapping(
      `aggregator-queue-trigger-${environmentSuffix}`,
      {
        eventSourceArn: processorToAggregatorQueue.arn,
        functionName: aggregatorFunction.name,
        batchSize: 10,
        functionResponseTypes: ['ReportBatchItemFailures'],
      },
      { parent: this }
    );

    // ========================================
    // 9. API Gateway REST API
    // ========================================
    const api = new aws.apigateway.RestApi(
      `processing-api-${environmentSuffix}`,
      {
        name: `processing-api-${environmentSuffix}`,
        description: 'API for querying file processing status',
        endpointConfiguration: {
          types: 'REGIONAL',
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // API Gateway Lambda Function for GET /status
    const apiFunction = new aws.lambda.Function(
      `api-function-${environmentSuffix}`,
      {
        name: `api-function-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        memorySize: 256,
        timeout: 30,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
            const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
            const { unmarshall } = require('@aws-sdk/util-dynamodb');

            const dynamodb = new DynamoDBClient({});

            exports.handler = async (event) => {
              console.log('API Lambda invoked', JSON.stringify(event));

              const fileId = event.queryStringParameters?.fileId;

              if (!fileId) {
                return {
                  statusCode: 400,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ error: 'fileId query parameter is required' })
                };
              }

              try {
                const result = await dynamodb.send(new GetItemCommand({
                  TableName: process.env.TABLE_NAME,
                  Key: { fileId: { S: fileId } }
                }));

                if (!result.Item) {
                  return {
                    statusCode: 404,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'File not found' })
                  };
                }

                return {
                  statusCode: 200,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(unmarshall(result.Item))
                };
              } catch (error) {
                console.error('Error:', error);
                return {
                  statusCode: 500,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ error: 'Internal server error' })
                };
              }
            };
          `),
        }),
        environment: {
          variables: {
            TABLE_NAME: table.name,
          },
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // API Gateway Lambda Permission
    const _apiLambdaPermission = new aws.lambda.Permission(
      `api-invoke-lambda-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: apiFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*`,
      },
      { parent: this }
    );
    void _apiLambdaPermission; // Intentionally unused - resource must be created

    // API Gateway Resource
    const statusResource = new aws.apigateway.Resource(
      `status-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'status',
      },
      { parent: this }
    );

    // API Gateway Method
    const statusMethod = new aws.apigateway.Method(
      `status-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: statusResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // API Gateway Integration
    const statusIntegration = new aws.apigateway.Integration(
      `status-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: statusResource.id,
        httpMethod: statusMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: apiFunction.invokeArn,
      },
      { parent: this }
    );

    // API Gateway Deployment
    const deployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
      },
      { parent: this, dependsOn: [statusIntegration] }
    );

    // API Gateway Stage
    const stage = new aws.apigateway.Stage(
      `api-stage-${environmentSuffix}`,
      {
        restApi: api.id,
        deployment: deployment.id,
        stageName: 'prod',
        tags: defaultTags,
      },
      { parent: this }
    );

    // API Gateway Usage Plan with Throttling
    const _usagePlan = new aws.apigateway.UsagePlan(
      `api-usage-plan-${environmentSuffix}`,
      {
        name: `api-usage-plan-${environmentSuffix}`,
        apiStages: [
          {
            apiId: api.id,
            stage: stage.stageName,
          },
        ],
        throttleSettings: {
          rateLimit: 1000,
          burstLimit: 2000,
        },
        tags: defaultTags,
      },
      { parent: this }
    );
    void _usagePlan; // Intentionally unused - resource must be created

    // ========================================
    // Outputs
    // ========================================
    this.bucketName = bucket.bucket;
    this.tableName = table.name;
    this.apiEndpoint = pulumi.interpolate`https://${api.id}.execute-api.${aws.config.region}.amazonaws.com/prod/status`;
    this.validatorFunctionName = validatorFunction.name;
    this.processorFunctionName = processorFunction.name;
    this.aggregatorFunctionName = aggregatorFunction.name;

    this.registerOutputs({
      bucketName: this.bucketName,
      tableName: this.tableName,
      apiEndpoint: this.apiEndpoint,
      validatorFunctionName: this.validatorFunctionName,
      processorFunctionName: this.processorFunctionName,
      aggregatorFunctionName: this.aggregatorFunctionName,
    });
  }
}
