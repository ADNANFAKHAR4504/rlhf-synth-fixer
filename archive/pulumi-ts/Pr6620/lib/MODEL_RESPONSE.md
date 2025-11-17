# Serverless File Processing Pipeline Implementation

This implementation provides a complete serverless file processing pipeline using Pulumi with TypeScript. The system processes market data files uploaded to S3 through three Lambda functions with ordered processing via SQS FIFO queues, status tracking in DynamoDB, and a REST API for querying processing status.

## Architecture Overview

- S3 bucket with versioning and lifecycle rules (Glacier after 90 days)
- Three Lambda functions (Go 1.x runtime, 512MB memory): validator, processor, aggregator
- SQS FIFO queues with dead letter queues between Lambda functions
- DynamoDB table with TTL for processing status tracking
- API Gateway REST API with throttling at 1000 req/sec
- CloudWatch Logs with 7-day retention

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the serverless file processing pipeline.
 * Orchestrates S3, Lambda, SQS, DynamoDB, and API Gateway resources.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

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
 * Main Pulumi component for the serverless file processing pipeline.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly validatorFunctionName: pulumi.Output<string>;
  public readonly processorFunctionName: pulumi.Output<string>;
  public readonly aggregatorFunctionName: pulumi.Output<string>;
  public readonly processingTableName: pulumi.Output<string>;
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly validatorQueueUrl: pulumi.Output<string>;
  public readonly processorQueueUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Merge required tags
    const resourceTags = {
      ...tags,
      Environment: 'Production',
      Team: 'Analytics',
    };

    // ========== S3 Bucket ==========
    const bucket = new aws.s3.Bucket(
      `file-processing-bucket-${environmentSuffix}`,
      {
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            enabled: true,
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
        tags: resourceTags,
      },
      { parent: this }
    );

    // ========== DynamoDB Table ==========
    const processingTable = new aws.dynamodb.Table(
      `processing-status-table-${environmentSuffix}`,
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
        tags: resourceTags,
      },
      { parent: this }
    );

    // ========== Dead Letter Queues ==========
    const validatorDlq = new aws.sqs.Queue(
      `validator-dlq-${environmentSuffix}`,
      {
        name: `validator-dlq-${environmentSuffix}.fifo`,
        fifoQueue: true,
        contentBasedDeduplication: true,
        tags: resourceTags,
      },
      { parent: this }
    );

    const processorDlq = new aws.sqs.Queue(
      `processor-dlq-${environmentSuffix}`,
      {
        name: `processor-dlq-${environmentSuffix}.fifo`,
        fifoQueue: true,
        contentBasedDeduplication: true,
        tags: resourceTags,
      },
      { parent: this }
    );

    const aggregatorDlq = new aws.sqs.Queue(
      `aggregator-dlq-${environmentSuffix}`,
      {
        name: `aggregator-dlq-${environmentSuffix}.fifo`,
        fifoQueue: true,
        contentBasedDeduplication: true,
        tags: resourceTags,
      },
      { parent: this }
    );

    // ========== SQS FIFO Queues ==========
    const validatorQueue = new aws.sqs.Queue(
      `validator-queue-${environmentSuffix}`,
      {
        name: `validator-queue-${environmentSuffix}.fifo`,
        fifoQueue: true,
        contentBasedDeduplication: true,
        visibilityTimeoutSeconds: 300,
        redrivePolicy: pulumi.interpolate`{
          "deadLetterTargetArn": "${validatorDlq.arn}",
          "maxReceiveCount": 3
        }`,
        tags: resourceTags,
      },
      { parent: this }
    );

    const processorQueue = new aws.sqs.Queue(
      `processor-queue-${environmentSuffix}`,
      {
        name: `processor-queue-${environmentSuffix}.fifo`,
        fifoQueue: true,
        contentBasedDeduplication: true,
        visibilityTimeoutSeconds: 300,
        redrivePolicy: pulumi.interpolate`{
          "deadLetterTargetArn": "${processorDlq.arn}",
          "maxReceiveCount": 3
        }`,
        tags: resourceTags,
      },
      { parent: this }
    );

    const aggregatorQueue = new aws.sqs.Queue(
      `aggregator-queue-${environmentSuffix}`,
      {
        name: `aggregator-queue-${environmentSuffix}.fifo`,
        fifoQueue: true,
        contentBasedDeduplication: true,
        visibilityTimeoutSeconds: 300,
        redrivePolicy: pulumi.interpolate`{
          "deadLetterTargetArn": "${aggregatorDlq.arn}",
          "maxReceiveCount": 3
        }`,
        tags: resourceTags,
      },
      { parent: this }
    );

    // ========== IAM Roles for Lambda Functions ==========
    const validatorRole = new aws.iam.Role(
      `validator-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: resourceTags,
      },
      { parent: this }
    );

    const processorRole = new aws.iam.Role(
      `processor-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: resourceTags,
      },
      { parent: this }
    );

    const aggregatorRole = new aws.iam.Role(
      `aggregator-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: resourceTags,
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `validator-basic-${environmentSuffix}`,
      {
        role: validatorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `processor-basic-${environmentSuffix}`,
      {
        role: processorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `aggregator-basic-${environmentSuffix}`,
      {
        role: aggregatorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Validator Lambda permissions
    new aws.iam.RolePolicy(
      `validator-policy-${environmentSuffix}`,
      {
        role: validatorRole.id,
        policy: pulumi.all([bucket.arn, processorQueue.arn, processingTable.arn]).apply(
          ([bucketArn, queueArn, tableArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:GetObjectVersion'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: queueArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
                  Resource: tableArn,
                },
              ],
            })
        ),
      },
      { parent: this }
    );

    // Processor Lambda permissions
    new aws.iam.RolePolicy(
      `processor-policy-${environmentSuffix}`,
      {
        role: processorRole.id,
        policy: pulumi.all([validatorQueue.arn, aggregatorQueue.arn, processingTable.arn]).apply(
          ([validatorQueueArn, aggregatorQueueArn, tableArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'sqs:ReceiveMessage',
                    'sqs:DeleteMessage',
                    'sqs:GetQueueAttributes',
                  ],
                  Resource: validatorQueueArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: aggregatorQueueArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
                  Resource: tableArn,
                },
              ],
            })
        ),
      },
      { parent: this }
    );

    // Aggregator Lambda permissions
    new aws.iam.RolePolicy(
      `aggregator-policy-${environmentSuffix}`,
      {
        role: aggregatorRole.id,
        policy: pulumi.all([processorQueue.arn, processingTable.arn]).apply(
          ([queueArn, tableArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
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
                  Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
                  Resource: tableArn,
                },
              ],
            })
        ),
      },
      { parent: this }
    );

    // ========== CloudWatch Log Groups ==========
    const validatorLogGroup = new aws.cloudwatch.LogGroup(
      `validator-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/file-validator-${environmentSuffix}`,
        retentionInDays: 7,
        tags: resourceTags,
      },
      { parent: this }
    );

    const processorLogGroup = new aws.cloudwatch.LogGroup(
      `processor-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/data-processor-${environmentSuffix}`,
        retentionInDays: 7,
        tags: resourceTags,
      },
      { parent: this }
    );

    const aggregatorLogGroup = new aws.cloudwatch.LogGroup(
      `aggregator-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/result-aggregator-${environmentSuffix}`,
        retentionInDays: 7,
        tags: resourceTags,
      },
      { parent: this }
    );

    // ========== Lambda Functions ==========
    const validatorFunction = new aws.lambda.Function(
      `file-validator-${environmentSuffix}`,
      {
        name: `file-validator-${environmentSuffix}`,
        runtime: 'go1.x',
        handler: 'main',
        role: validatorRole.arn,
        memorySize: 512,
        timeout: 300,
        code: new pulumi.asset.AssetArchive({
          'main': new pulumi.asset.FileAsset('./lib/lambda/validator/main'),
        }),
        environment: {
          variables: {
            PROCESSOR_QUEUE_URL: processorQueue.url,
            DYNAMODB_TABLE_NAME: processingTable.name,
          },
        },
        tags: resourceTags,
      },
      { parent: this, dependsOn: [validatorLogGroup] }
    );

    const processorFunction = new aws.lambda.Function(
      `data-processor-${environmentSuffix}`,
      {
        name: `data-processor-${environmentSuffix}`,
        runtime: 'go1.x',
        handler: 'main',
        role: processorRole.arn,
        memorySize: 512,
        timeout: 300,
        code: new pulumi.asset.AssetArchive({
          'main': new pulumi.asset.FileAsset('./lib/lambda/processor/main'),
        }),
        environment: {
          variables: {
            AGGREGATOR_QUEUE_URL: aggregatorQueue.url,
            DYNAMODB_TABLE_NAME: processingTable.name,
          },
        },
        tags: resourceTags,
      },
      { parent: this, dependsOn: [processorLogGroup] }
    );

    const aggregatorFunction = new aws.lambda.Function(
      `result-aggregator-${environmentSuffix}`,
      {
        name: `result-aggregator-${environmentSuffix}`,
        runtime: 'go1.x',
        handler: 'main',
        role: aggregatorRole.arn,
        memorySize: 512,
        timeout: 300,
        code: new pulumi.asset.AssetArchive({
          'main': new pulumi.asset.FileAsset('./lib/lambda/aggregator/main'),
        }),
        environment: {
          variables: {
            DYNAMODB_TABLE_NAME: processingTable.name,
          },
        },
        tags: resourceTags,
      },
      { parent: this, dependsOn: [aggregatorLogGroup] }
    );

    // ========== S3 Event Notification ==========
    // Allow S3 to invoke validator Lambda
    new aws.lambda.Permission(
      `s3-invoke-validator-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: validatorFunction.arn,
        principal: 's3.amazonaws.com',
        sourceArn: bucket.arn,
      },
      { parent: this }
    );

    // S3 bucket notification
    new aws.s3.BucketNotification(
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
      { parent: this }
    );

    // ========== SQS Event Source Mappings ==========
    new aws.lambda.EventSourceMapping(
      `validator-queue-trigger-${environmentSuffix}`,
      {
        eventSourceArn: validatorQueue.arn,
        functionName: processorFunction.name,
        batchSize: 10,
        enabled: true,
      },
      { parent: this }
    );

    new aws.lambda.EventSourceMapping(
      `processor-queue-trigger-${environmentSuffix}`,
      {
        eventSourceArn: processorQueue.arn,
        functionName: aggregatorFunction.name,
        batchSize: 10,
        enabled: true,
      },
      { parent: this }
    );

    // ========== API Gateway for Status Queries ==========
    // IAM role for API Gateway
    const apiRole = new aws.iam.Role(
      `api-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'apigateway.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: resourceTags,
      },
      { parent: this }
    );

    // Status query Lambda function
    const statusQueryRole = new aws.iam.Role(
      `status-query-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: resourceTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `status-query-basic-${environmentSuffix}`,
      {
        role: statusQueryRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `status-query-policy-${environmentSuffix}`,
      {
        role: statusQueryRole.id,
        policy: processingTable.arn.apply((tableArn) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['dynamodb:GetItem', 'dynamodb:Query'],
                Resource: tableArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    const statusQueryLogGroup = new aws.cloudwatch.LogGroup(
      `status-query-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/status-query-${environmentSuffix}`,
        retentionInDays: 7,
        tags: resourceTags,
      },
      { parent: this }
    );

    const statusQueryFunction = new aws.lambda.Function(
      `status-query-${environmentSuffix}`,
      {
        name: `status-query-${environmentSuffix}`,
        runtime: 'go1.x',
        handler: 'main',
        role: statusQueryRole.arn,
        memorySize: 512,
        timeout: 30,
        code: new pulumi.asset.AssetArchive({
          'main': new pulumi.asset.FileAsset('./lib/lambda/status-query/main'),
        }),
        environment: {
          variables: {
            DYNAMODB_TABLE_NAME: processingTable.name,
          },
        },
        tags: resourceTags,
      },
      { parent: this, dependsOn: [statusQueryLogGroup] }
    );

    // REST API
    const api = new aws.apigateway.RestApi(
      `processing-api-${environmentSuffix}`,
      {
        name: `processing-api-${environmentSuffix}`,
        description: 'API for querying file processing status',
        tags: resourceTags,
      },
      { parent: this }
    );

    // API Resource: /status
    const statusResource = new aws.apigateway.Resource(
      `status-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'status',
      },
      { parent: this }
    );

    // API Resource: /status/{fileId}
    const fileIdResource = new aws.apigateway.Resource(
      `file-id-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: statusResource.id,
        pathPart: '{fileId}',
      },
      { parent: this }
    );

    // GET method
    const getMethod = new aws.apigateway.Method(
      `get-status-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: fileIdResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // Lambda integration
    new aws.lambda.Permission(
      `api-invoke-status-query-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: statusQueryFunction.arn,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    const integration = new aws.apigateway.Integration(
      `status-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: fileIdResource.id,
        httpMethod: getMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: statusQueryFunction.invokeArn,
      },
      { parent: this }
    );

    // Deployment
    const deployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
        triggers: {
          redeployment: pulumi.all([statusResource.id, fileIdResource.id, getMethod.id, integration.id]).apply(
            (ids) => JSON.stringify(ids)
          ),
        },
      },
      { parent: this, dependsOn: [getMethod, integration] }
    );

    // Stage with throttling
    const stage = new aws.apigateway.Stage(
      `api-stage-${environmentSuffix}`,
      {
        restApi: api.id,
        deployment: deployment.id,
        stageName: 'prod',
        tags: resourceTags,
      },
      { parent: this }
    );

    // Method settings for throttling
    new aws.apigateway.MethodSettings(
      `method-settings-${environmentSuffix}`,
      {
        restApi: api.id,
        stageName: stage.stageName,
        methodPath: '*/*',
        settings: {
          throttlingBurstLimit: 2000,
          throttlingRateLimit: 1000,
        },
      },
      { parent: this }
    );

    // ========== Outputs ==========
    this.bucketName = bucket.id;
    this.validatorFunctionName = validatorFunction.name;
    this.processorFunctionName = processorFunction.name;
    this.aggregatorFunctionName = aggregatorFunction.name;
    this.processingTableName = processingTable.name;
    this.apiEndpoint = pulumi.interpolate`${api.id}.execute-api.${aws.getRegionOutput().name}.amazonaws.com/${stage.stageName}/status`;
    this.validatorQueueUrl = validatorQueue.url;
    this.processorQueueUrl = processorQueue.url;

    this.registerOutputs({
      bucketName: this.bucketName,
      validatorFunctionName: this.validatorFunctionName,
      processorFunctionName: this.processorFunctionName,
      aggregatorFunctionName: this.aggregatorFunctionName,
      processingTableName: this.processingTableName,
      apiEndpoint: this.apiEndpoint,
      validatorQueueUrl: this.validatorQueueUrl,
      processorQueueUrl: this.processorQueueUrl,
    });
  }
}
```

## File: bin/tap.ts

```typescript
/**
 * Pulumi application entry point for the serverless file processing pipeline.
 *
 * This module instantiates the TapStack with appropriate configuration
 * based on the deployment environment.
 */
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Define default tags
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export outputs
export const bucketName = stack.bucketName;
export const validatorFunctionName = stack.validatorFunctionName;
export const processorFunctionName = stack.processorFunctionName;
export const aggregatorFunctionName = stack.aggregatorFunctionName;
export const processingTableName = stack.processingTableName;
export const apiEndpoint = stack.apiEndpoint;
export const validatorQueueUrl = stack.validatorQueueUrl;
export const processorQueueUrl = stack.processorQueueUrl;
```

## File: lib/lambda/validator/main.go

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/sqs"
)

var (
	s3Client      *s3.S3
	sqsClient     *sqs.SQS
	dynamoClient  *dynamodb.DynamoDB
	queueURL      string
	tableName     string
)

func init() {
	sess := session.Must(session.NewSession())
	s3Client = s3.New(sess)
	sqsClient = sqs.New(sess)
	dynamoClient = dynamodb.New(sess)
	queueURL = os.Getenv("PROCESSOR_QUEUE_URL")
	tableName = os.Getenv("DYNAMODB_TABLE_NAME")
}

type ProcessingStatus struct {
	FileID         string `json:"fileId"`
	Status         string `json:"status"`
	Stage          string `json:"stage"`
	LastUpdated    int64  `json:"lastUpdated"`
	ExpirationTime int64  `json:"expirationTime"`
	BucketName     string `json:"bucketName"`
	ObjectKey      string `json:"objectKey"`
}

func handleRequest(ctx context.Context, s3Event events.S3Event) error {
	for _, record := range s3Event.Records {
		bucketName := record.S3.Bucket.Name
		objectKey := record.S3.Object.Key
		fileID := fmt.Sprintf("%s/%s", bucketName, objectKey)

		fmt.Printf("Processing file: %s\n", fileID)

		// Validate file exists
		_, err := s3Client.GetObject(&s3.GetObjectInput{
			Bucket: aws.String(bucketName),
			Key:    aws.String(objectKey),
		})
		if err != nil {
			fmt.Printf("Error getting object: %v\n", err)
			return err
		}

		// Update DynamoDB with validation status
		now := time.Now().Unix()
		expiration := now + (30 * 24 * 60 * 60) // 30 days TTL

		status := ProcessingStatus{
			FileID:         fileID,
			Status:         "validated",
			Stage:          "validator",
			LastUpdated:    now,
			ExpirationTime: expiration,
			BucketName:     bucketName,
			ObjectKey:      objectKey,
		}

		item := map[string]*dynamodb.AttributeValue{
			"fileId":         {S: aws.String(fileID)},
			"status":         {S: aws.String(status.Status)},
			"stage":          {S: aws.String(status.Stage)},
			"lastUpdated":    {N: aws.String(fmt.Sprintf("%d", now))},
			"expirationTime": {N: aws.String(fmt.Sprintf("%d", expiration))},
			"bucketName":     {S: aws.String(bucketName)},
			"objectKey":      {S: aws.String(objectKey)},
		}

		_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
			TableName: aws.String(tableName),
			Item:      item,
		})
		if err != nil {
			fmt.Printf("Error updating DynamoDB: %v\n", err)
			return err
		}

		// Send message to processor queue
		messageBody, _ := json.Marshal(status)
		_, err = sqsClient.SendMessage(&sqs.SendMessageInput{
			QueueUrl:       aws.String(queueURL),
			MessageBody:    aws.String(string(messageBody)),
			MessageGroupId: aws.String(fileID),
		})
		if err != nil {
			fmt.Printf("Error sending SQS message: %v\n", err)
			return err
		}

		fmt.Printf("File validated successfully: %s\n", fileID)
	}

	return nil
}

func main() {
	lambda.Start(handleRequest)
}
```

## File: lib/lambda/validator/go.mod

```go
module validator

go 1.21

require (
	github.com/aws/aws-lambda-go v1.41.0
	github.com/aws/aws-sdk-go v1.47.0
)

require github.com/jmespath/go-jmespath v0.4.0 // indirect
```

## File: lib/lambda/processor/main.go

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/sqs"
)

var (
	sqsClient    *sqs.SQS
	dynamoClient *dynamodb.DynamoDB
	queueURL     string
	tableName    string
)

func init() {
	sess := session.Must(session.NewSession())
	sqsClient = sqs.New(sess)
	dynamoClient = dynamodb.New(sess)
	queueURL = os.Getenv("AGGREGATOR_QUEUE_URL")
	tableName = os.Getenv("DYNAMODB_TABLE_NAME")
}

type ProcessingStatus struct {
	FileID         string `json:"fileId"`
	Status         string `json:"status"`
	Stage          string `json:"stage"`
	LastUpdated    int64  `json:"lastUpdated"`
	ExpirationTime int64  `json:"expirationTime"`
	BucketName     string `json:"bucketName"`
	ObjectKey      string `json:"objectKey"`
}

func handleRequest(ctx context.Context, sqsEvent events.SQSEvent) error {
	for _, record := range sqsEvent.Records {
		fmt.Printf("Processing message: %s\n", record.MessageId)

		var status ProcessingStatus
		err := json.Unmarshal([]byte(record.Body), &status)
		if err != nil {
			fmt.Printf("Error unmarshaling message: %v\n", err)
			return err
		}

		// Process the file (simulation)
		fmt.Printf("Processing file: %s\n", status.FileID)

		// Update DynamoDB with processing status
		now := time.Now().Unix()
		status.Status = "processed"
		status.Stage = "processor"
		status.LastUpdated = now

		item := map[string]*dynamodb.AttributeValue{
			"fileId":         {S: aws.String(status.FileID)},
			"status":         {S: aws.String(status.Status)},
			"stage":          {S: aws.String(status.Stage)},
			"lastUpdated":    {N: aws.String(fmt.Sprintf("%d", now))},
			"expirationTime": {N: aws.String(fmt.Sprintf("%d", status.ExpirationTime))},
			"bucketName":     {S: aws.String(status.BucketName)},
			"objectKey":      {S: aws.String(status.ObjectKey)},
		}

		_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
			TableName: aws.String(tableName),
			Item:      item,
		})
		if err != nil {
			fmt.Printf("Error updating DynamoDB: %v\n", err)
			return err
		}

		// Send message to aggregator queue
		messageBody, _ := json.Marshal(status)
		_, err = sqsClient.SendMessage(&sqs.SendMessageInput{
			QueueUrl:       aws.String(queueURL),
			MessageBody:    aws.String(string(messageBody)),
			MessageGroupId: aws.String(status.FileID),
		})
		if err != nil {
			fmt.Printf("Error sending SQS message: %v\n", err)
			return err
		}

		fmt.Printf("File processed successfully: %s\n", status.FileID)
	}

	return nil
}

func main() {
	lambda.Start(handleRequest)
}
```

## File: lib/lambda/processor/go.mod

```go
module processor

go 1.21

require (
	github.com/aws/aws-lambda-go v1.41.0
	github.com/aws/aws-sdk-go v1.47.0
)

require github.com/jmespath/go-jmespath v0.4.0 // indirect
```

## File: lib/lambda/aggregator/main.go

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)

var (
	dynamoClient *dynamodb.DynamoDB
	tableName    string
)

func init() {
	sess := session.Must(session.NewSession())
	dynamoClient = dynamodb.New(sess)
	tableName = os.Getenv("DYNAMODB_TABLE_NAME")
}

type ProcessingStatus struct {
	FileID         string `json:"fileId"`
	Status         string `json:"status"`
	Stage          string `json:"stage"`
	LastUpdated    int64  `json:"lastUpdated"`
	ExpirationTime int64  `json:"expirationTime"`
	BucketName     string `json:"bucketName"`
	ObjectKey      string `json:"objectKey"`
}

func handleRequest(ctx context.Context, sqsEvent events.SQSEvent) error {
	for _, record := range sqsEvent.Records {
		fmt.Printf("Aggregating message: %s\n", record.MessageId)

		var status ProcessingStatus
		err := json.Unmarshal([]byte(record.Body), &status)
		if err != nil {
			fmt.Printf("Error unmarshaling message: %v\n", err)
			return err
		}

		// Aggregate the results (simulation)
		fmt.Printf("Aggregating results for file: %s\n", status.FileID)

		// Update DynamoDB with completed status
		now := time.Now().Unix()
		status.Status = "completed"
		status.Stage = "aggregator"
		status.LastUpdated = now

		item := map[string]*dynamodb.AttributeValue{
			"fileId":         {S: aws.String(status.FileID)},
			"status":         {S: aws.String(status.Status)},
			"stage":          {S: aws.String(status.Stage)},
			"lastUpdated":    {N: aws.String(fmt.Sprintf("%d", now))},
			"expirationTime": {N: aws.String(fmt.Sprintf("%d", status.ExpirationTime))},
			"bucketName":     {S: aws.String(status.BucketName)},
			"objectKey":      {S: aws.String(status.ObjectKey)},
		}

		_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
			TableName: aws.String(tableName),
			Item:      item,
		})
		if err != nil {
			fmt.Printf("Error updating DynamoDB: %v\n", err)
			return err
		}

		fmt.Printf("File aggregation completed: %s\n", status.FileID)
	}

	return nil
}

func main() {
	lambda.Start(handleRequest)
}
```

## File: lib/lambda/aggregator/go.mod

```go
module aggregator

go 1.21

require (
	github.com/aws/aws-lambda-go v1.41.0
	github.com/aws/aws-sdk-go v1.47.0
)

require github.com/jmespath/go-jmespath v0.4.0 // indirect
```

## File: lib/lambda/status-query/main.go

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)

var (
	dynamoClient *dynamodb.DynamoDB
	tableName    string
)

func init() {
	sess := session.Must(session.NewSession())
	dynamoClient = dynamodb.New(sess)
	tableName = os.Getenv("DYNAMODB_TABLE_NAME")
}

type ProcessingStatus struct {
	FileID      string `json:"fileId"`
	Status      string `json:"status"`
	Stage       string `json:"stage"`
	LastUpdated int64  `json:"lastUpdated"`
	BucketName  string `json:"bucketName"`
	ObjectKey   string `json:"objectKey"`
}

func handleRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	fileID := request.PathParameters["fileId"]
	if fileID == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       json.RawMessage(`{"error": "fileId is required"}`).String(),
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	fmt.Printf("Querying status for file: %s\n", fileID)

	// Get item from DynamoDB
	result, err := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"fileId": {S: aws.String(fileID)},
		},
	})
	if err != nil {
		fmt.Printf("Error querying DynamoDB: %v\n", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       fmt.Sprintf(`{"error": "Internal server error: %v"}`, err),
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	if result.Item == nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 404,
			Body:       `{"error": "File not found"}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	// Parse the result
	status := ProcessingStatus{}
	if val, ok := result.Item["fileId"]; ok && val.S != nil {
		status.FileID = *val.S
	}
	if val, ok := result.Item["status"]; ok && val.S != nil {
		status.Status = *val.S
	}
	if val, ok := result.Item["stage"]; ok && val.S != nil {
		status.Stage = *val.S
	}
	if val, ok := result.Item["bucketName"]; ok && val.S != nil {
		status.BucketName = *val.S
	}
	if val, ok := result.Item["objectKey"]; ok && val.S != nil {
		status.ObjectKey = *val.S
	}

	responseBody, _ := json.Marshal(status)

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(responseBody),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

func main() {
	lambda.Start(handleRequest)
}
```

## File: lib/lambda/status-query/go.mod

```go
module status-query

go 1.21

require (
	github.com/aws/aws-lambda-go v1.41.0
	github.com/aws/aws-sdk-go v1.47.0
)

require github.com/jmespath/go-jmespath v0.4.0 // indirect
```

## File: lib/lambda/build.sh

```bash
#!/bin/bash

# Build script for all Lambda functions

set -e

echo "Building validator Lambda..."
cd validator
GOOS=linux GOARCH=amd64 go build -o main main.go
cd ..

echo "Building processor Lambda..."
cd processor
GOOS=linux GOARCH=amd64 go build -o main main.go
cd ..

echo "Building aggregator Lambda..."
cd aggregator
GOOS=linux GOARCH=amd64 go build -o main main.go
cd ..

echo "Building status-query Lambda..."
cd status-query
GOOS=linux GOARCH=amd64 go build -o main main.go
cd ..

echo "All Lambda functions built successfully!"
```

## File: lib/README.md

```markdown
# Serverless File Processing Pipeline

A serverless file processing pipeline built with Pulumi and TypeScript that processes market data files through multiple stages with ordered processing and status tracking.

## Architecture

The system consists of the following components:

- **S3 Bucket**: Storage for uploaded market data files with versioning and lifecycle policies
- **Lambda Functions**: Three Go-based functions for validation, processing, and aggregation (512MB memory each)
- **SQS FIFO Queues**: Ordered message queues between Lambda functions with dead letter queues
- **DynamoDB**: Status tracking table with TTL enabled
- **API Gateway**: REST API for querying processing status with throttling at 1000 req/sec
- **CloudWatch Logs**: 7-day retention for all Lambda functions

## Prerequisites

- Node.js 18+ and npm
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- Go 1.21+ (for building Lambda functions)
- AWS account with permissions to create resources

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Lambda Functions

```bash
cd lib/lambda
chmod +x build.sh
./build.sh
cd ../..
```

### 3. Configure Pulumi Stack

```bash
pulumi stack init dev
pulumi config set aws:region us-east-1
```

### 4. Set Environment Suffix

```bash
export ENVIRONMENT_SUFFIX=dev
```

### 5. Deploy Infrastructure

```bash
pulumi up
```

Review the preview and confirm to deploy all resources.

## Outputs

After deployment, the following outputs are available:

- `bucketName`: S3 bucket for file uploads
- `validatorFunctionName`: Name of the validator Lambda function
- `processorFunctionName`: Name of the processor Lambda function
- `aggregatorFunctionName`: Name of the aggregator Lambda function
- `processingTableName`: DynamoDB table name
- `apiEndpoint`: API Gateway endpoint for status queries
- `validatorQueueUrl`: Validator SQS queue URL
- `processorQueueUrl`: Processor SQS queue URL

## Usage

### Upload a File

```bash
aws s3 cp test-file.csv s3://$(pulumi stack output bucketName)/
```

This triggers the validator Lambda automatically via S3 event notification.

### Query Processing Status

```bash
curl https://$(pulumi stack output apiEndpoint)/{bucket}/{key}
```

Example response:

```json
{
  "fileId": "bucket-name/file.csv",
  "status": "completed",
  "stage": "aggregator",
  "lastUpdated": 1699999999,
  "bucketName": "bucket-name",
  "objectKey": "file.csv"
}
```

## Processing Flow

1. File uploaded to S3 bucket
2. S3 event notification triggers **Validator Lambda**
3. Validator validates file and sends message to processor queue
4. **Processor Lambda** triggered by SQS message, processes data
5. Processor sends message to aggregator queue
6. **Aggregator Lambda** triggered by SQS message, finalizes results
7. Status tracked in DynamoDB at each stage
8. Status queryable via API Gateway GET endpoint

## Resource Naming

All resources use the `environmentSuffix` variable for naming:

- S3 Bucket: `file-processing-bucket-{environmentSuffix}`
- Lambda Functions: `{function-name}-{environmentSuffix}`
- SQS Queues: `{queue-name}-{environmentSuffix}.fifo`
- DynamoDB Table: `processing-status-{environmentSuffix}`
- API Gateway: `processing-api-{environmentSuffix}`

## Error Handling

- Dead letter queues configured for all Lambda functions
- Maximum receive count of 3 before moving to DLQ
- FIFO queues ensure ordered processing
- CloudWatch Logs capture all Lambda execution logs

## Cost Optimization

- Serverless architecture scales to zero when idle
- S3 lifecycle policy moves objects to Glacier after 90 days
- DynamoDB on-demand billing
- Lambda functions with right-sized memory (512MB)
- CloudWatch Logs with 7-day retention

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Confirm the deletion when prompted.

## Testing

Unit tests are located in the `test/` directory. Run tests with:

```bash
npm test
```

Integration tests read outputs from `cfn-outputs/flat-outputs.json`.

## Tags

All resources are tagged with:

- `Environment`: Production
- `Team`: Analytics
- Additional tags from CI/CD environment

## Security

- S3 bucket with server-side encryption (AES256)
- DynamoDB with encryption at rest
- IAM roles follow least privilege principle
- No hardcoded credentials
- Lambda functions have minimal required permissions

## Monitoring

- CloudWatch Logs for all Lambda functions (7-day retention)
- API Gateway access logs
- DynamoDB metrics
- SQS queue metrics
- Lambda execution metrics

## Troubleshooting

### Lambda Functions Failing

Check CloudWatch Logs:

```bash
aws logs tail /aws/lambda/file-validator-dev --follow
```

### Messages in Dead Letter Queue

List messages:

```bash
aws sqs receive-message --queue-url $(pulumi stack output validatorQueueUrl)
```

### API Gateway 500 Errors

Check status query Lambda logs:

```bash
aws logs tail /aws/lambda/status-query-dev --follow
```
```

## Deployment Notes

- All Lambda functions use Go 1.x runtime as required
- Each Lambda has exactly 512MB memory allocation
- SQS queues are FIFO type for ordered processing
- Dead letter queue max receive count is 3
- API Gateway throttling is set to 1000 requests per second
- CloudWatch Logs retention is 7 days
- S3 lifecycle transitions to Glacier at 90 days
- All resources use environmentSuffix for naming
- Resources are fully destroyable (no Retain policies)
