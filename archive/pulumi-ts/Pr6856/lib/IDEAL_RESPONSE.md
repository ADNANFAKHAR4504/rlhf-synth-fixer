# Serverless Transaction Processing System

## Overview

This document provides the complete implementation of a serverless transaction processing system using **Pulumi with TypeScript**. The system processes credit card transactions in real-time, validates them against fraud patterns, and stores results for compliance auditing while handling variable loads during peak shopping seasons.

## Architecture

### Components

- **API Gateway REST API**: Validates incoming requests against OpenAPI 3.0 schema
- **Transaction Validator Lambda**: Processes requests and writes to DynamoDB (Go runtime)
- **DynamoDB Table**: Stores transactions with partition key 'transactionId' and sort key 'timestamp'
- **Fraud Detection Lambda**: Analyzes transaction patterns triggered by DynamoDB streams (Go runtime)
- **SQS FIFO Queue**: Maintains transaction order with 30-second visibility timeout
- **Notification Lambda**: Reads from SQS and publishes to SNS topic (Go runtime)
- **SNS Topic**: Sends notifications for processed transactions
- **Dead Letter Queues**: Captures failed Lambda executions for retry/analysis
- **KMS Key**: Encrypts Lambda environment variables
- **CloudWatch Logs**: Monitors all Lambda functions with 30-day retention
- **API Gateway Usage Plan**: Enforces 10,000 requests/day limit with throttling

### Architecture Pattern

Single-stack architecture with all resources deployed in one Pulumi stack to ensure atomic deployments and simplified state management.

## Complete Source Code

### File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: Record<string, string>;
}

export class TapStack {
  public readonly apiUrl: pulumi.Output<string>;
  public readonly apiKey: pulumi.Output<string>;
  public readonly transactionTableName: pulumi.Output<string>;
  public readonly transactionQueueUrl: pulumi.Output<string>;
  public readonly notificationTopicArn: pulumi.Output<string>;
  public readonly validatorFunctionName: pulumi.Output<string>;
  public readonly fraudDetectionFunctionName: pulumi.Output<string>;
  public readonly notificationFunctionName: pulumi.Output<string>;
  public readonly validatorLogGroup: pulumi.Output<string>;
  public readonly fraudDetectionLogGroup: pulumi.Output<string>;
  public readonly notificationLogGroup: pulumi.Output<string>;
  public readonly fraudDlqUrl: pulumi.Output<string>;
  public readonly notificationDlqUrl: pulumi.Output<string>;
  public readonly apiId: pulumi.Output<string>;
  public readonly stageName: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;

  constructor(name: string, args?: TapStackArgs) {
    // Use environmentSuffix from args, environment variable, or default to 'dev'
    const environmentSuffix =
      args?.environmentSuffix ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    const tags = {
      Environment: environmentSuffix,
      ManagedBy: 'Pulumi',
      Stack: name,
      ...args?.tags,
    };

    // KMS Key for encrypting Lambda environment variables
    const kmsKey = new aws.kms.Key(`kms-key-${environmentSuffix}`, {
      description: 'KMS key for encrypting Lambda environment variables',
      deletionWindowInDays: 10,
      tags,
    });

    const kmsKeyAlias = new aws.kms.Alias(`kms-alias-${environmentSuffix}`, {
      name: `alias/transaction-processing-${environmentSuffix}`,
      targetKeyId: kmsKey.id,
    });

    // DynamoDB Table with streams enabled
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
        pointInTimeRecovery: {
          enabled: true,
        },
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: kmsKey.arn,
        },
        tags,
      },
    );

    // SQS FIFO Queue for transaction ordering
    const fraudDlq = new aws.sqs.Queue(`fraud-dlq-${environmentSuffix}`, {
      name: pulumi.interpolate`fraud-dlq-${environmentSuffix}`,
      messageRetentionSeconds: 1209600, // 14 days
      tags,
    });

    const notificationDlq = new aws.sqs.Queue(
      `notification-dlq-${environmentSuffix}`,
      {
        name: pulumi.interpolate`notification-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags,
      },
    );

    const transactionQueue = new aws.sqs.Queue(
      `transaction-queue-${environmentSuffix}`,
      {
        name: pulumi.interpolate`transaction-queue-${environmentSuffix}.fifo`,
        fifoQueue: true,
        contentBasedDeduplication: true,
        visibilityTimeoutSeconds: 30,
        messageRetentionSeconds: 345600, // 4 days
        tags,
      },
    );

    // SNS Topic for notifications
    const notificationTopic = new aws.sns.Topic(
      `notification-topic-${environmentSuffix}`,
      {
        name: pulumi.interpolate`notification-topic-${environmentSuffix}`,
        kmsMasterKeyId: kmsKey.id,
        tags,
      },
    );

    // CloudWatch Log Groups
    const validatorLogGroup = new aws.cloudwatch.LogGroup(
      `validator-log-group-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/transaction-validator-${environmentSuffix}`,
        retentionInDays: 30,
        kmsKeyId: kmsKey.arn,
        tags,
      },
    );

    const fraudDetectionLogGroup = new aws.cloudwatch.LogGroup(
      `fraud-detection-log-group-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/fraud-detection-${environmentSuffix}`,
        retentionInDays: 30,
        kmsKeyId: kmsKey.arn,
        tags,
      },
    );

    const notificationLogGroup = new aws.cloudwatch.LogGroup(
      `notification-log-group-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/notification-${environmentSuffix}`,
        retentionInDays: 30,
        kmsKeyId: kmsKey.arn,
        tags,
      },
    );

    // IAM Roles for Lambda functions
    const validatorRole = new aws.iam.Role(
      `validator-role-${environmentSuffix}`,
      {
        name: pulumi.interpolate`transaction-validator-role-${environmentSuffix}`,
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
        tags,
      },
    );

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
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags,
      },
    );

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
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags,
      },
    );

    // IAM Policy Attachments for Lambda execution
    new aws.iam.RolePolicyAttachment(
      `validator-basic-${environmentSuffix}`,
      {
        role: validatorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
    );

    new aws.iam.RolePolicyAttachment(
      `fraud-detection-basic-${environmentSuffix}`,
      {
        role: fraudDetectionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
    );

    new aws.iam.RolePolicyAttachment(
      `notification-basic-${environmentSuffix}`,
      {
        role: notificationRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
    );

    // IAM Policies for Lambda functions
    new aws.iam.RolePolicy(`validator-policy-${environmentSuffix}`, {
      role: validatorRole.id,
      policy: pulumi
        .all([transactionTable.arn, kmsKey.arn])
        .apply(([tableArn, keyArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'dynamodb:PutItem',
                  'dynamodb:GetItem',
                  'dynamodb:UpdateItem',
                ],
                Resource: tableArn,
              },
              {
                Effect: 'Allow',
                Action: ['kms:Decrypt'],
                Resource: keyArn,
              },
            ],
          }),
        ),
    });

    new aws.iam.RolePolicy(`fraud-detection-policy-${environmentSuffix}`, {
      role: fraudDetectionRole.id,
      policy: pulumi
        .all([
          transactionTable.streamArn,
          transactionQueue.arn,
          fraudDlq.arn,
          kmsKey.arn,
        ])
        .apply(([streamArn, queueArn, dlqArn, keyArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'dynamodb:DescribeStream',
                  'dynamodb:GetRecords',
                  'dynamodb:GetShardIterator',
                  'dynamodb:ListStreams',
                ],
                Resource: streamArn!,
              },
              {
                Effect: 'Allow',
                Action: ['sqs:SendMessage', 'sqs:GetQueueAttributes'],
                Resource: queueArn,
              },
              {
                Effect: 'Allow',
                Action: ['sqs:SendMessage'],
                Resource: dlqArn,
              },
              {
                Effect: 'Allow',
                Action: ['kms:Decrypt'],
                Resource: keyArn,
              },
            ],
          }),
        ),
    });

    new aws.iam.RolePolicy(`notification-policy-${environmentSuffix}`, {
      role: notificationRole.id,
      policy: pulumi
        .all([
          transactionQueue.arn,
          notificationDlq.arn,
          notificationTopic.arn,
          kmsKey.arn,
        ])
        .apply(([queueArn, dlqArn, topicArn, keyArn]) =>
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
          }),
        ),
    });

    // Lambda Functions with Go runtime
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
    "github.com/google/uuid"
)

type Transaction struct {
    Amount      float64 \`json:"amount"\`
    CardNumber  string  \`json:"cardNumber"\`
    Description string  \`json:"description"\`
}

var (
    dynamoClient *dynamodb.DynamoDB
    tableName    string
)

func init() {
    sess := session.Must(session.NewSession())
    dynamoClient = dynamodb.New(sess)
    tableName = os.Getenv("TABLE_NAME")
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
    var transaction Transaction
    if err := json.Unmarshal([]byte(request.Body), &transaction); err != nil {
        return events.APIGatewayProxyResponse{
            StatusCode: 400,
            Body:       fmt.Sprintf("Invalid request body: %v", err),
        }, nil
    }

    transactionID := uuid.New().String()
    timestamp := time.Now().Unix()

    item := map[string]*dynamodb.AttributeValue{
        "transactionId": {S: aws.String(transactionID)},
        "timestamp":     {N: aws.String(fmt.Sprintf("%d", timestamp))},
        "amount":        {N: aws.String(fmt.Sprintf("%.2f", transaction.Amount))},
        "cardNumber":    {S: aws.String(transaction.CardNumber)},
        "description":   {S: aws.String(transaction.Description)},
        "status":        {S: aws.String("PENDING")},
    }

    _, err := dynamoClient.PutItem(&dynamodb.PutItemInput{
        TableName: aws.String(tableName),
        Item:      item,
    })

    if err != nil {
        return events.APIGatewayProxyResponse{
            StatusCode: 500,
            Body:       fmt.Sprintf("Failed to store transaction: %v", err),
        }, nil
    }

    response := map[string]interface{}{
        "transactionId": transactionID,
        "status":        "PENDING",
        "message":       "Transaction received and will be processed",
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
        }),
        environment: {
          variables: {
            TABLE_NAME: transactionTable.name,
          },
        },
        kmsKeyArn: kmsKey.arn,
        reservedConcurrentExecutions: 100,
        timeout: 30,
        tags,
        dependsOn: [validatorLogGroup],
      },
    );

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
    "strconv"

    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/sqs"
)

type FraudAnalysis struct {
    TransactionID string  \`json:"transactionId"\`
    RiskScore     float64 \`json:"riskScore"\`
    IsFraudulent  bool    \`json:"isFraudulent"\`
    Reason        string  \`json:"reason"\`
}

var (
    sqsClient *sqs.SQS
    queueURL  string
)

func init() {
    sess := session.Must(session.NewSession())
    sqsClient = sqs.New(sess)
    queueURL = os.Getenv("QUEUE_URL")
}

func handler(ctx context.Context, event events.DynamoDBEvent) error {
    for _, record := range event.Records {
        if record.EventName != "INSERT" && record.EventName != "MODIFY" {
            continue
        }

        transactionID := record.Change.NewImage["transactionId"].String()
        amount, _ := strconv.ParseFloat(record.Change.NewImage["amount"].Number(), 64)
        cardNumber := record.Change.NewImage["cardNumber"].String()

        // Simple fraud detection logic (placeholder)
        riskScore := 0.0
        isFraudulent := false
        reason := "Normal transaction"

        if amount > 10000 {
            riskScore = 0.8
            isFraudulent = true
            reason = "High amount transaction"
        } else if amount > 5000 {
            riskScore = 0.5
            reason = "Medium-high amount transaction"
        }

        // Check for test card numbers (simplified)
        if cardNumber == "1234567890123456" {
            riskScore = 0.9
            isFraudulent = true
            reason = "Test card number detected"
        }

        analysis := FraudAnalysis{
            TransactionID: transactionID,
            RiskScore:     riskScore,
            IsFraudulent:  isFraudulent,
            Reason:        reason,
        }

        messageBody, err := json.Marshal(analysis)
        if err != nil {
            fmt.Printf("Failed to marshal analysis: %v\n", err)
            continue
        }

        // Send to SQS FIFO queue
        _, err = sqsClient.SendMessage(&sqs.SendMessageInput{
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
        }),
        environment: {
          variables: {
            QUEUE_URL: transactionQueue.url,
          },
        },
        kmsKeyArn: kmsKey.arn,
        reservedConcurrentExecutions: 100,
        deadLetterConfig: {
          targetArn: fraudDlq.arn,
        },
        timeout: 30,
        tags,
        dependsOn: [fraudDetectionLogGroup],
      },
    );

    // DynamoDB Stream trigger for fraud detection
    new aws.lambda.EventSourceMapping(
      `fraud-detection-stream-${environmentSuffix}`,
      {
        eventSourceArn: transactionTable.streamArn,
        functionName: fraudDetectionFunction.name,
        startingPosition: 'LATEST',
        maximumBatchingWindowInSeconds: 5,
        parallelizationFactor: 1,
        maximumRetryAttempts: 3,
      },
    );

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
    "encoding/json"
    "fmt"
    "os"

    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/sns"
)

type FraudAnalysis struct {
    TransactionID string  \`json:"transactionId"\`
    RiskScore     float64 \`json:"riskScore"\`
    IsFraudulent  bool    \`json:"isFraudulent"\`
    Reason        string  \`json:"reason"\`
}

var (
    snsClient *sns.SNS
    topicArn  string
)

func init() {
    sess := session.Must(session.NewSession())
    snsClient = sns.New(sess)
    topicArn = os.Getenv("TOPIC_ARN")
}

func handler(ctx context.Context, event events.SQSEvent) error {
    for _, record := range event.Records {
        var analysis FraudAnalysis
        if err := json.Unmarshal([]byte(record.Body), &analysis); err != nil {
            fmt.Printf("Failed to unmarshal message: %v\n", err)
            continue
        }

        // Create notification message
        subject := fmt.Sprintf("Transaction %s - Fraud Analysis Complete", analysis.TransactionID)

        var message string
        if analysis.IsFraudulent {
            message = fmt.Sprintf(
                "ALERT: Fraudulent transaction detected!\n\n"+
                "Transaction ID: %s\n"+
                "Risk Score: %.2f\n"+
                "Reason: %s\n"+
                "Action Required: Review and block if necessary",
                analysis.TransactionID, analysis.RiskScore, analysis.Reason,
            )
        } else {
            message = fmt.Sprintf(
                "Transaction approved.\n\n"+
                "Transaction ID: %s\n"+
                "Risk Score: %.2f\n"+
                "Status: %s",
                analysis.TransactionID, analysis.RiskScore, analysis.Reason,
            )
        }

        // Publish to SNS
        _, err := snsClient.Publish(&sns.PublishInput{
            TopicArn: aws.String(topicArn),
            Subject:  aws.String(subject),
            Message:  aws.String(message),
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
        }),
        environment: {
          variables: {
            TOPIC_ARN: notificationTopic.arn,
          },
        },
        kmsKeyArn: kmsKey.arn,
        reservedConcurrentExecutions: 100,
        deadLetterConfig: {
          targetArn: notificationDlq.arn,
        },
        timeout: 30,
        tags,
        dependsOn: [notificationLogGroup],
      },
    );

    // SQS trigger for notification function
    new aws.lambda.EventSourceMapping(
      `notification-sqs-${environmentSuffix}`,
      {
        eventSourceArn: transactionQueue.arn,
        functionName: notificationFunction.name,
        batchSize: 10,
        maximumBatchingWindowInSeconds: 5,
      },
    );

    // API Gateway
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
              Principal: {
                Service: 'apigateway.amazonaws.com',
              },
            },
          ],
        }),
        tags,
      },
    );

    new aws.iam.RolePolicy(`api-gateway-policy-${environmentSuffix}`, {
      role: apiGatewayRole.id,
      policy: validatorFunction.arn.apply((arn) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: 'lambda:InvokeFunction',
              Resource: arn,
            },
          ],
        }),
      ),
    });

    const api = new aws.apigateway.RestApi(
      `transaction-api-${environmentSuffix}`,
      {
        name: pulumi.interpolate`transaction-api-${environmentSuffix}`,
        description: 'Transaction Processing API',
        endpointConfiguration: {
          types: 'REGIONAL',
        },
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
                    summary: 'Submit a new transaction',
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
                                minimum: 0.01,
                                maximum: 1000000,
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
                    'x-amazon-apigateway-request-validator':
                      'Validate body, query string parameters, and headers',
                    'x-amazon-apigateway-integration': {
                      type: 'aws_proxy',
                      httpMethod: 'POST',
                      uri: invokeArn,
                      credentials: apiGatewayRole.arn,
                    },
                    responses: {
                      '200': {
                        description: 'Transaction accepted',
                      },
                      '400': {
                        description: 'Invalid request',
                      },
                      '500': {
                        description: 'Internal server error',
                      },
                    },
                    security: [
                      {
                        ApiKeyAuth: [],
                      },
                    ],
                  },
                },
              },
              'x-amazon-apigateway-request-validators': {
                'Validate body, query string parameters, and headers': {
                  validateRequestBody: true,
                  validateRequestParameters: true,
                },
              },
              components: {
                securitySchemes: {
                  ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-api-key',
                  },
                },
              },
            }),
          ),
        tags,
      },
    );

    const deployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
        triggers: {
          redeployment: pulumi.interpolate`${Date.now()}`,
        },
      },
    );

    const stage = new aws.apigateway.Stage(
      `api-stage-${environmentSuffix}`,
      {
        deployment: deployment.id,
        restApi: api.id,
        stageName: 'prod',
        xrayTracingEnabled: true,
        tags,
      },
    );

    const apiKey = new aws.apigateway.ApiKey(
      `api-key-${environmentSuffix}`,
      {
        name: pulumi.interpolate`transaction-api-key-${environmentSuffix}`,
        description: 'API key for transaction processing',
        tags,
      },
    );

    const usagePlan = new aws.apigateway.UsagePlan(
      `usage-plan-${environmentSuffix}`,
      {
        name: pulumi.interpolate`transaction-usage-plan-${environmentSuffix}`,
        description: 'Usage plan for transaction processing API',
        apiStages: [
          {
            apiId: api.id,
            stage: stage.stageName,
          },
        ],
        quota: {
          limit: 10000,
          period: 'DAY',
        },
        throttle: {
          burstLimit: 100,
          rateLimit: 50,
        },
        tags,
      },
    );

    new aws.apigateway.UsagePlanKey(
      `usage-plan-key-${environmentSuffix}`,
      {
        keyId: apiKey.id,
        keyType: 'API_KEY',
        usagePlanId: usagePlan.id,
      },
    );

    // Lambda permission for API Gateway
    new aws.lambda.Permission(
      `api-gateway-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: validatorFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
    );

    // Outputs
    this.apiUrl = pulumi.interpolate`${api.id}.execute-api.${aws.getRegion().then(r => r.name)}.amazonaws.com/prod/transaction`;
    this.apiKey = apiKey.value;
    this.transactionTableName = transactionTable.name;
    this.transactionQueueUrl = transactionQueue.url;
    this.notificationTopicArn = notificationTopic.arn;
    this.validatorFunctionName = validatorFunction.name;
    this.fraudDetectionFunctionName = fraudDetectionFunction.name;
    this.notificationFunctionName = notificationFunction.name;
    this.validatorLogGroup = validatorLogGroup.name;
    this.fraudDetectionLogGroup = fraudDetectionLogGroup.name;
    this.notificationLogGroup = notificationLogGroup.name;
    this.fraudDlqUrl = fraudDlq.url;
    this.notificationDlqUrl = notificationDlq.url;
    this.apiId = api.id;
    this.stageName = pulumi.output('prod');
    this.kmsKeyId = kmsKey.id;
  }
}
```

## Implementation Details

### Resource Naming Strategy

All resources use an `environmentSuffix` variable to ensure unique naming across multiple deployments. The suffix is determined in this order:
1. Constructor argument `args.environmentSuffix`
2. Environment variable `ENVIRONMENT_SUFFIX`
3. Default value `'dev'`

This pattern enables multiple PR environments without resource name conflicts.

### Security Implementation

- **KMS Encryption**: Custom KMS key encrypts Lambda environment variables and CloudWatch logs
- **IAM Roles**: Separate roles for each Lambda function following least-privilege principle
- **API Gateway**: API key authentication required for all requests
- **DynamoDB**: Server-side encryption enabled with KMS
- **SNS**: Topic encrypted with KMS master key
- **Point-in-Time Recovery**: Enabled for DynamoDB table

### Monitoring and Observability

- **CloudWatch Logs**: Separate log groups for each Lambda with 30-day retention
- **X-Ray Tracing**: Enabled on API Gateway stage
- **Dead Letter Queues**: Capture failed Lambda executions for analysis
- **Message Retention**: DLQs retain messages for 14 days

### Key Design Decisions

1. **Go Runtime**: Using `provided.al2023` custom runtime for Go Lambda functions as AWS deprecated managed Go runtimes
2. **Reserved Concurrency**: Set to 100 per Lambda function as required
3. **FIFO Queue**: Ensures transaction processing order with content-based deduplication
4. **OpenAPI Validation**: Request body validation at API Gateway level reduces invalid Lambda invocations
5. **Inline Lambda Code**: Go code embedded as StringAssets for simplicity in this implementation

## Testing

### Unit Tests

Unit tests cover:
- Stack instantiation with different environment suffix patterns
- Output generation and validation
- Resource naming patterns
- Environment variable configuration

### Integration Tests

Integration tests validate:
- DynamoDB table configuration (partition key, sort key, streams)
- SQS FIFO queue attributes (content deduplication, visibility timeout)
- Lambda function runtime and concurrency settings
- API Gateway OpenAPI validation
- SNS topic encryption
- KMS key configuration
- CloudWatch log group retention
- Dead letter queue message retention
- End-to-end transaction flow

## CloudFormation Outputs

The stack exports the following outputs for integration testing and client access:

- `apiUrl`: API Gateway endpoint URL for transaction submission
- `apiKey`: API key value for authentication
- `transactionTableName`: DynamoDB table name
- `transactionQueueUrl`: SQS FIFO queue URL
- `notificationTopicArn`: SNS topic ARN
- `validatorFunctionName`: Transaction validator Lambda function name
- `fraudDetectionFunctionName`: Fraud detection Lambda function name
- `notificationFunctionName`: Notification Lambda function name
- `validatorLogGroup`: Validator Lambda CloudWatch log group name
- `fraudDetectionLogGroup`: Fraud detection Lambda CloudWatch log group name
- `notificationLogGroup`: Notification Lambda CloudWatch log group name
- `fraudDlqUrl`: Fraud detection DLQ URL
- `notificationDlqUrl`: Notification DLQ URL
- `apiId`: API Gateway REST API ID
- `stageName`: API Gateway stage name (prod)
- `kmsKeyId`: KMS key ID

## Deployment Instructions

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
export PULUMI_CONFIG_PASSPHRASE=<your-passphrase>
```

3. Initialize Pulumi stack:
```bash
pulumi stack init
```

4. Deploy infrastructure:
```bash
pulumi up --yes
```

5. Test the deployment:
```bash
# Get outputs
pulumi stack output apiUrl
pulumi stack output apiKey

# Test transaction submission
curl -X POST https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/transaction \
  -H "x-api-key: <api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500.00,
    "cardNumber": "1234567890123456",
    "description": "Test transaction"
  }'
```

## Validation

To verify successful deployment:

1. Check Lambda functions are created with Go runtime (`provided.al2023`)
2. Verify DynamoDB table has streams enabled
3. Confirm SQS FIFO queue has content-based deduplication
4. Test API Gateway endpoint with valid and invalid requests
5. Monitor CloudWatch logs for Lambda executions
6. Check SNS topic for notifications
7. Verify DLQ captures any failed executions