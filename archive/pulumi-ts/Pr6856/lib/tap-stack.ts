/**
 * tap-stack.ts
 *
 * Serverless Transaction Processing System
 *
 * This Pulumi stack implements a complete serverless transaction processing system with:
 * - API Gateway REST API with request validation
 * - Three Lambda functions (validator, fraud detection, notification)
 * - DynamoDB table with streams
 * - SQS FIFO queue with dead letter queues
 * - SNS topic for notifications
 * - KMS key for Lambda environment variable encryption
 * - CloudWatch Log Groups with retention
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
 * Represents the main Pulumi component resource for the TAP project.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;
  public readonly apiKey: pulumi.Output<string>;
  public readonly transactionTableName: pulumi.Output<string>;
  public readonly transactionQueueUrl: pulumi.Output<string>;
  public readonly notificationTopicArn: pulumi.Output<string>;
  public readonly validatorFunctionName: pulumi.Output<string>;
  public readonly fraudDetectionFunctionName: pulumi.Output<string>;
  public readonly notificationFunctionName: pulumi.Output<string>;
  public readonly apiId: pulumi.Output<string>;
  public readonly stageName: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly validatorLogGroup: pulumi.Output<string>;
  public readonly fraudDetectionLogGroup: pulumi.Output<string>;
  public readonly notificationLogGroup: pulumi.Output<string>;
  public readonly fraudDlqUrl: pulumi.Output<string>;
  public readonly notificationDlqUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix =
      args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const tags = args.tags || {};

    // 1. Create Custom KMS Key for Lambda environment variable encryption
    const kmsKey = new aws.kms.Key(
      `transaction-kms-${environmentSuffix}`,
      {
        description: `KMS key for Lambda environment variables and CloudWatch Logs - ${environmentSuffix}`,
        deletionWindowInDays: 7,
        enableKeyRotation: true,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": "arn:aws:iam::${aws.getCallerIdentityOutput().accountId}:root"
              },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow CloudWatch Logs",
              "Effect": "Allow",
              "Principal": {
                "Service": "logs.${aws.getRegionOutput().name}.amazonaws.com"
              },
              "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:CreateGrant",
                "kms:DescribeKey"
              ],
              "Resource": "*",
              "Condition": {
                "ArnLike": {
                  "kms:EncryptionContext:aws:logs:arn": "arn:aws:logs:${aws.getRegionOutput().name}:${aws.getCallerIdentityOutput().accountId}:log-group:*"
                }
              }
            }
          ]
        }`,
        tags: tags,
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `transaction-kms-alias-${environmentSuffix}`,
      {
        name: pulumi.interpolate`alias/transaction-processing-${environmentSuffix}`,
        targetKeyId: kmsKey.id,
      },
      { parent: this }
    );

    // 2. Create DynamoDB Table with streams
    const transactionTable = new aws.dynamodb.Table(
      `transaction-table-${environmentSuffix}`,
      {
        name: pulumi.interpolate`transaction-table-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'transactionId',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'transactionId', type: 'S' },
          { name: 'timestamp', type: 'N' },
        ],
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',
        tags: tags,
      },
      { parent: this }
    );

    // 3. Create CloudWatch Log Groups (30 day retention)
    const validatorLogGroup = new aws.cloudwatch.LogGroup(
      `validator-logs-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/transaction-validator-${environmentSuffix}`,
        retentionInDays: 30,
        kmsKeyId: kmsKey.arn,
        tags: tags,
      },
      { parent: this }
    );

    const fraudDetectionLogGroup = new aws.cloudwatch.LogGroup(
      `fraud-detection-logs-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/fraud-detection-${environmentSuffix}`,
        retentionInDays: 30,
        kmsKeyId: kmsKey.arn,
        tags: tags,
      },
      { parent: this }
    );

    const notificationLogGroup = new aws.cloudwatch.LogGroup(
      `notification-logs-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/notification-${environmentSuffix}`,
        retentionInDays: 30,
        kmsKeyId: kmsKey.arn,
        tags: tags,
      },
      { parent: this }
    );

    // 4. Create Dead Letter Queues (14 day retention)
    const fraudDLQ = new aws.sqs.Queue(
      `fraud-dlq-${environmentSuffix}`,
      {
        name: pulumi.interpolate`fraud-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 14 * 24 * 60 * 60, // 14 days
        tags: tags,
      },
      { parent: this }
    );

    const notificationDLQ = new aws.sqs.Queue(
      `notification-dlq-${environmentSuffix}`,
      {
        name: pulumi.interpolate`notification-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 14 * 24 * 60 * 60, // 14 days
        tags: tags,
      },
      { parent: this }
    );

    // 5. Create SQS FIFO Queue
    const transactionQueue = new aws.sqs.Queue(
      `transaction-queue-${environmentSuffix}`,
      {
        name: pulumi.interpolate`transaction-queue-${environmentSuffix}.fifo`,
        fifoQueue: true,
        contentBasedDeduplication: true,
        visibilityTimeoutSeconds: 30,
        tags: tags,
      },
      { parent: this }
    );

    // 6. Create SNS Topic
    const notificationTopic = new aws.sns.Topic(
      `notification-topic-${environmentSuffix}`,
      {
        name: pulumi.interpolate`notification-topic-${environmentSuffix}`,
        kmsMasterKeyId: kmsKey.id,
        tags: tags,
      },
      { parent: this }
    );

    // 7. Create IAM Role for Transaction Validator Lambda
    const validatorRole = new aws.iam.Role(
      `validator-role-${environmentSuffix}`,
      {
        name: pulumi.interpolate`validator-role-${environmentSuffix}`,
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
        tags: tags,
      },
      { parent: this }
    );

    // Attach policies to validator role
    new aws.iam.RolePolicyAttachment(
      `validator-basic-${environmentSuffix}`,
      {
        role: validatorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `validator-policy-${environmentSuffix}`,
      {
        role: validatorRole.id,
        policy: pulumi
          .all([transactionTable.arn, kmsKey.arn])
          .apply(([tableArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
                  Resource: tableArn,
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

    // 8. Create IAM Role for Fraud Detection Lambda
    const fraudDetectionRole = new aws.iam.Role(
      `fraud-detection-role-${environmentSuffix}`,
      {
        name: pulumi.interpolate`fraud-detection-role-${environmentSuffix}`,
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
        tags: tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `fraud-detection-basic-${environmentSuffix}`,
      {
        role: fraudDetectionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `fraud-detection-policy-${environmentSuffix}`,
      {
        role: fraudDetectionRole.id,
        policy: pulumi
          .all([
            transactionTable.streamArn,
            transactionQueue.arn,
            fraudDLQ.arn,
            kmsKey.arn,
          ])
          .apply(([streamArn, queueArn, dlqArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:GetRecords',
                    'dynamodb:GetShardIterator',
                    'dynamodb:DescribeStream',
                    'dynamodb:ListStreams',
                  ],
                  Resource: streamArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage', 'sqs:GetQueueAttributes'],
                  Resource: [queueArn, dlqArn],
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

    // 9. Create IAM Role for Notification Lambda
    const notificationRole = new aws.iam.Role(
      `notification-role-${environmentSuffix}`,
      {
        name: pulumi.interpolate`notification-role-${environmentSuffix}`,
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
        tags: tags,
      },
      { parent: this }
    );

    const notificationBasicPolicy = new aws.iam.RolePolicyAttachment(
      `notification-basic-${environmentSuffix}`,
      {
        role: notificationRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    const notificationSQSPolicy = new aws.iam.RolePolicyAttachment(
      `notification-sqs-${environmentSuffix}`,
      {
        role: notificationRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole',
      },
      { parent: this }
    );

    const notificationRolePolicy = new aws.iam.RolePolicy(
      `notification-policy-${environmentSuffix}`,
      {
        role: notificationRole.id,
        policy: pulumi
          .all([
            transactionQueue.arn,
            notificationTopic.arn,
            notificationDLQ.arn,
            kmsKey.arn,
          ])
          .apply(([queueArn, topicArn, dlqArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'sqs:ReceiveMessage',
                    'sqs:DeleteMessage',
                    'sqs:GetQueueAttributes',
                    'sqs:SendMessage',
                  ],
                  Resource: [queueArn, dlqArn],
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: topicArn,
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

    // 10. Create Transaction Validator Lambda Function (Go 1.x)
    const validatorFunction = new aws.lambda.Function(
      `transaction-validator-${environmentSuffix}`,
      {
        name: pulumi.interpolate`transaction-validator-${environmentSuffix}`,
        role: validatorRole.arn,
        runtime: 'provided.al2023',
        handler: 'main',
        code: new pulumi.asset.AssetArchive({
          main: new pulumi.asset.StringAsset(`
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

type TransactionRequest struct {
	Amount      float64 \`json:"amount"\`
	CardNumber  string  \`json:"cardNumber"\`
	Description string  \`json:"description"\`
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var txnReq TransactionRequest
	if err := json.Unmarshal([]byte(request.Body), &txnReq); err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       fmt.Sprintf("Invalid request: %v", err),
		}, nil
	}

	tableName := os.Getenv("TABLE_NAME")
	sess := session.Must(session.NewSession())
	svc := dynamodb.New(sess)

	transactionID := fmt.Sprintf("txn-%d", time.Now().UnixNano())
	timestamp := time.Now().Unix()

	input := &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item: map[string]*dynamodb.AttributeValue{
			"transactionId": {S: aws.String(transactionID)},
			"timestamp":     {N: aws.String(fmt.Sprintf("%d", timestamp))},
			"amount":        {N: aws.String(fmt.Sprintf("%f", txnReq.Amount))},
			"cardNumber":    {S: aws.String(txnReq.CardNumber)},
			"description":   {S: aws.String(txnReq.Description)},
		},
	}

	if _, err := svc.PutItem(input); err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       fmt.Sprintf("Failed to store transaction: %v", err),
		}, nil
	}

	response := map[string]string{
		"transactionId": transactionID,
		"status":        "pending",
	}
	responseBody, _ := json.Marshal(response)

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(responseBody),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

func main() {
	lambda.Start(handler)
}
`),
          'go.mod': new pulumi.asset.StringAsset(`module validator

go 1.19

require (
	github.com/aws/aws-lambda-go v1.41.0
	github.com/aws/aws-sdk-go v1.44.200
)
`),
        }),
        environment: {
          variables: {
            TABLE_NAME: transactionTable.name,
            KMS_KEY_ID: kmsKey.id,
          },
        },
        kmsKeyArn: kmsKey.arn,
        reservedConcurrentExecutions: 10,
        timeout: 30,
        tags: tags,
      },
      { parent: this, dependsOn: [validatorLogGroup] }
    );

    // 11. Create Fraud Detection Lambda Function (Go 1.x)
    const fraudDetectionFunction = new aws.lambda.Function(
      `fraud-detection-${environmentSuffix}`,
      {
        name: pulumi.interpolate`fraud-detection-${environmentSuffix}`,
        role: fraudDetectionRole.arn,
        runtime: 'provided.al2023',
        handler: 'main',
        code: new pulumi.asset.AssetArchive({
          main: new pulumi.asset.StringAsset(`
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
	"github.com/aws/aws-sdk-go/service/sqs"
)

type FraudAnalysisResult struct {
	TransactionID string  \`json:"transactionId"\`
	Score         float64 \`json:"score"\`
	Status        string  \`json:"status"\`
	Reason        string  \`json:"reason"\`
}

func handler(ctx context.Context, event events.DynamoDBEvent) error {
	queueURL := os.Getenv("QUEUE_URL")
	sess := session.Must(session.NewSession())
	sqsClient := sqs.New(sess)

	for _, record := range event.Records {
		if record.EventName != "INSERT" && record.EventName != "MODIFY" {
			continue
		}

		transactionID := record.Change.NewImage["transactionId"].String()
		amount := 0.0
		if amountAttr, ok := record.Change.NewImage["amount"]; ok {
			fmt.Sscanf(amountAttr.Number(), "%f", &amount)
		}

		// Simple fraud detection logic
		fraudScore := 0.0
		status := "approved"
		reason := "Transaction appears legitimate"

		if amount > 10000 {
			fraudScore = 0.95
			status = "flagged"
			reason = "High transaction amount"
		} else if amount > 5000 {
			fraudScore = 0.65
			status = "review"
			reason = "Medium-high transaction amount"
		} else {
			fraudScore = 0.1
		}

		result := FraudAnalysisResult{
			TransactionID: transactionID,
			Score:         fraudScore,
			Status:        status,
			Reason:        reason,
		}

		messageBody, _ := json.Marshal(result)
		_, err := sqsClient.SendMessage(&sqs.SendMessageInput{
			QueueUrl:       aws.String(queueURL),
			MessageBody:    aws.String(string(messageBody)),
			MessageGroupId: aws.String("fraud-analysis"),
		})

		if err != nil {
			fmt.Printf("Failed to send message to SQS: %v\n", err)
			return err
		}
	}

	return nil
}

func main() {
	lambda.Start(handler)
}
`),
          'go.mod': new pulumi.asset.StringAsset(`module fraud-detection

go 1.19

require (
	github.com/aws/aws-lambda-go v1.41.0
	github.com/aws/aws-sdk-go v1.44.200
)
`),
        }),
        environment: {
          variables: {
            QUEUE_URL: transactionQueue.url,
            KMS_KEY_ID: kmsKey.id,
          },
        },
        kmsKeyArn: kmsKey.arn,
        reservedConcurrentExecutions: 10,
        deadLetterConfig: {
          targetArn: fraudDLQ.arn,
        },
        timeout: 60,
        tags: tags,
      },
      { parent: this, dependsOn: [fraudDetectionLogGroup] }
    );

    // 12. Create DynamoDB Stream Event Source Mapping for Fraud Detection
    new aws.lambda.EventSourceMapping(
      `fraud-detection-stream-${environmentSuffix}`,
      {
        eventSourceArn: transactionTable.streamArn,
        functionName: fraudDetectionFunction.name,
        startingPosition: 'LATEST',
        batchSize: 10,
        maximumBatchingWindowInSeconds: 1,
      },
      { parent: this }
    );

    // 13. Create Notification Lambda Function (Go 1.x)
    const notificationFunction = new aws.lambda.Function(
      `notification-${environmentSuffix}`,
      {
        name: pulumi.interpolate`notification-${environmentSuffix}`,
        role: notificationRole.arn,
        runtime: 'provided.al2023',
        handler: 'main',
        code: new pulumi.asset.AssetArchive({
          main: new pulumi.asset.StringAsset(`
package main

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sns"
)

func handler(ctx context.Context, event events.SQSEvent) error {
	topicARN := os.Getenv("TOPIC_ARN")
	sess := session.Must(session.NewSession())
	snsClient := sns.New(sess)

	for _, record := range event.Records {
		message := fmt.Sprintf("Fraud Analysis Result: %s", record.Body)

		_, err := snsClient.Publish(&sns.PublishInput{
			TopicArn: aws.String(topicARN),
			Message:  aws.String(message),
			Subject:  aws.String("Transaction Fraud Analysis"),
		})

		if err != nil {
			fmt.Printf("Failed to publish to SNS: %v\n", err)
			return err
		}
	}

	return nil
}

func main() {
	lambda.Start(handler)
}
`),
          'go.mod': new pulumi.asset.StringAsset(`module notification

go 1.19

require (
	github.com/aws/aws-lambda-go v1.41.0
	github.com/aws/aws-sdk-go v1.44.200
)
`),
        }),
        environment: {
          variables: {
            TOPIC_ARN: notificationTopic.arn,
            KMS_KEY_ID: kmsKey.id,
          },
        },
        kmsKeyArn: kmsKey.arn,
        reservedConcurrentExecutions: 10,
        deadLetterConfig: {
          targetArn: notificationDLQ.arn,
        },
        timeout: 30,
        tags: tags,
      },
      {
        parent: this,
        dependsOn: [
          notificationLogGroup,
          notificationBasicPolicy,
          notificationSQSPolicy,
          notificationRolePolicy,
        ],
      }
    );

    // 14. Create SQS Event Source Mapping for Notification Lambda
    new aws.lambda.EventSourceMapping(
      `notification-sqs-${environmentSuffix}`,
      {
        eventSourceArn: transactionQueue.arn,
        functionName: notificationFunction.name,
        batchSize: 10,
      },
      { parent: this }
    );

    // 15. Create IAM Role for API Gateway
    const apiGatewayRole = new aws.iam.Role(
      `api-gateway-role-${environmentSuffix}`,
      {
        name: pulumi.interpolate`api-gateway-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'apigateway.amazonaws.com' },
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `api-gateway-policy-${environmentSuffix}`,
      {
        role: apiGatewayRole.id,
        policy: validatorFunction.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'lambda:InvokeFunction',
                Resource: arn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // 16. Create API Gateway REST API with request validation
    const api = new aws.apigateway.RestApi(
      `transaction-api-${environmentSuffix}`,
      {
        name: pulumi.interpolate`transaction-api-${environmentSuffix}`,
        description: 'Transaction Processing API',
        body: pulumi
          .all([validatorFunction.arn, validatorFunction.invokeArn])
          .apply(([_functionArn, invokeArn]) =>
            JSON.stringify({
              openapi: '3.0.0',
              info: {
                title: 'Transaction Processing API',
                version: '1.0',
              },
              paths: {
                '/transaction': {
                  post: {
                    requestBody: {
                      required: true,
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            required: ['amount', 'cardNumber', 'description'],
                            properties: {
                              amount: {
                                type: 'number',
                                minimum: 0,
                              },
                              cardNumber: {
                                type: 'string',
                                pattern: '^[0-9]{16}$',
                              },
                              description: {
                                type: 'string',
                                minLength: 1,
                                maxLength: 500,
                              },
                            },
                          },
                        },
                      },
                    },
                    'x-amazon-apigateway-request-validator': 'validateBody',
                    'x-amazon-apigateway-integration': {
                      type: 'aws_proxy',
                      httpMethod: 'POST',
                      uri: invokeArn,
                    },
                    responses: {
                      '200': {
                        description: 'Successful transaction',
                      },
                    },
                    security: [
                      {
                        api_key: [],
                      },
                    ],
                  },
                },
              },
              components: {
                securitySchemes: {
                  api_key: {
                    type: 'apiKey',
                    name: 'x-api-key',
                    in: 'header',
                  },
                },
              },
              'x-amazon-apigateway-request-validators': {
                validateBody: {
                  validateRequestBody: true,
                  validateRequestParameters: false,
                },
              },
            })
          ),
        tags: tags,
      },
      { parent: this }
    );

    // 17. Give API Gateway permission to invoke Lambda
    const apiExecutionArn = pulumi.interpolate`arn:aws:execute-api:${aws.getRegionOutput().name}:${aws.getCallerIdentityOutput().accountId}:${api.id}/*/*/*`;

    new aws.lambda.Permission(
      `api-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: validatorFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: apiExecutionArn,
      },
      { parent: this }
    );

    // 18. Create API Gateway Deployment
    const deployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
        description: 'Initial deployment',
      },
      { parent: this }
    );

    // 19. Create API Gateway Stage with throttling
    const stage = new aws.apigateway.Stage(
      `api-stage-${environmentSuffix}`,
      {
        restApi: api.id,
        deployment: deployment.id,
        stageName: 'prod',
        description: 'Production stage',
        tags: tags,
      },
      { parent: this }
    );

    // 20. Create API Key
    const apiKey = new aws.apigateway.ApiKey(
      `api-key-${environmentSuffix}`,
      {
        name: pulumi.interpolate`transaction-api-key-${environmentSuffix}`,
        description: 'API Key for transaction processing',
        enabled: true,
        tags: tags,
      },
      { parent: this }
    );

    // 21. Create Usage Plan with 10,000 requests/day limit
    const usagePlan = new aws.apigateway.UsagePlan(
      `usage-plan-${environmentSuffix}`,
      {
        name: pulumi.interpolate`transaction-usage-plan-${environmentSuffix}`,
        description: 'Usage plan with 10,000 requests per day limit',
        apiStages: [
          {
            apiId: api.id,
            stage: stage.stageName,
          },
        ],
        quotaSettings: {
          limit: 10000,
          period: 'DAY',
        },
        throttleSettings: {
          burstLimit: 100,
          rateLimit: 50,
        },
        tags: tags,
      },
      { parent: this }
    );

    // 22. Associate API Key with Usage Plan
    new aws.apigateway.UsagePlanKey(
      `usage-plan-key-${environmentSuffix}`,
      {
        keyId: apiKey.id,
        keyType: 'API_KEY',
        usagePlanId: usagePlan.id,
      },
      { parent: this }
    );

    // Export outputs
    this.apiUrl = pulumi.interpolate`https://${api.id}.execute-api.${aws.getRegionOutput().name}.amazonaws.com/${stage.stageName}/transaction`;
    this.apiKey = apiKey.value;
    this.transactionTableName = transactionTable.name;
    this.transactionQueueUrl = transactionQueue.url;
    this.notificationTopicArn = notificationTopic.arn;
    this.validatorFunctionName = validatorFunction.name;
    this.fraudDetectionFunctionName = fraudDetectionFunction.name;
    this.notificationFunctionName = notificationFunction.name;
    this.apiId = api.id;
    this.stageName = stage.stageName;
    this.kmsKeyId = kmsKey.id;
    this.validatorLogGroup = validatorLogGroup.name;
    this.fraudDetectionLogGroup = fraudDetectionLogGroup.name;
    this.notificationLogGroup = notificationLogGroup.name;
    this.fraudDlqUrl = fraudDLQ.url;
    this.notificationDlqUrl = notificationDLQ.url;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      apiKey: this.apiKey,
      transactionTableName: this.transactionTableName,
      transactionQueueUrl: this.transactionQueueUrl,
      notificationTopicArn: this.notificationTopicArn,
      validatorFunctionName: this.validatorFunctionName,
      fraudDetectionFunctionName: this.fraudDetectionFunctionName,
      notificationFunctionName: this.notificationFunctionName,
      apiId: this.apiId,
      stageName: this.stageName,
      kmsKeyId: this.kmsKeyId,
      validatorLogGroup: this.validatorLogGroup,
      fraudDetectionLogGroup: this.fraudDetectionLogGroup,
      notificationLogGroup: this.notificationLogGroup,
      fraudDlqUrl: this.fraudDlqUrl,
      notificationDlqUrl: this.notificationDlqUrl,
    });
  }
}
