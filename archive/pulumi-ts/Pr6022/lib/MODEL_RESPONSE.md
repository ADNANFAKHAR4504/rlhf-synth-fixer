# Transaction Processing System - Pulumi TypeScript Implementation

This implementation provides a complete serverless transaction processing system using Pulumi with TypeScript. The system includes API Gateway, Lambda functions with Go runtime, DynamoDB, S3, SQS dead letter queues, and proper IAM roles.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';

export interface TapStackProps {
  tags?: Record<string, string>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;

  constructor(name: string, props?: TapStackProps) {
    super('custom:TapStack', name, {}, {});

    const config = new pulumi.Config();
    const environmentSuffix =
      process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

    // S3 Bucket for audit logs
    const auditBucket = new aws.s3.Bucket(
      `audit-bucket-${environmentSuffix}`,
      {
        bucket: `audit-logs-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            id: 'glacier-transition',
            enabled: true,
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
        tags: {
          ...props?.tags,
          Name: `audit-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // DynamoDB Table for transactions
    const transactionsTable = new aws.dynamodb.Table(
      `transactions-${environmentSuffix}`,
      {
        name: `transactions-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'transactionId',
        rangeKey: 'timestamp',
        attributes: [
          {
            name: 'transactionId',
            type: 'S',
          },
          {
            name: 'timestamp',
            type: 'N',
          },
        ],
        pointInTimeRecovery: {
          enabled: true,
        },
        serverSideEncryption: {
          enabled: true,
        },
        tags: {
          ...props?.tags,
          Name: `transactions-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Dead Letter Queues for Lambda functions
    const validatorDlq = new aws.sqs.Queue(
      `validator-dlq-${environmentSuffix}`,
      {
        name: `validator-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: {
          ...props?.tags,
          Name: `validator-dlq-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const processorDlq = new aws.sqs.Queue(
      `processor-dlq-${environmentSuffix}`,
      {
        name: `processor-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600,
        tags: {
          ...props?.tags,
          Name: `processor-dlq-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const notifierDlq = new aws.sqs.Queue(
      `notifier-dlq-${environmentSuffix}`,
      {
        name: `notifier-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600,
        tags: {
          ...props?.tags,
          Name: `notifier-dlq-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch Log Groups
    const validatorLogGroup = new aws.cloudwatch.LogGroup(
      `validator-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/validator-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...props?.tags,
          Name: `validator-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const processorLogGroup = new aws.cloudwatch.LogGroup(
      `processor-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/processor-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...props?.tags,
          Name: `processor-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const notifierLogGroup = new aws.cloudwatch.LogGroup(
      `notifier-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/notifier-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...props?.tags,
          Name: `notifier-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // IAM Role for Validator Lambda
    const validatorRole = new aws.iam.Role(
      `validator-role-${environmentSuffix}`,
      {
        name: `validator-role-${environmentSuffix}`,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: {
          ...props?.tags,
          Name: `validator-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

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
      `validator-xray-${environmentSuffix}`,
      {
        role: validatorRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    const validatorPolicy = new aws.iam.RolePolicy(
      `validator-policy-${environmentSuffix}`,
      {
        role: validatorRole.id,
        policy: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['sqs:SendMessage'],
              Resource: [validatorDlq.arn],
            },
            {
              Effect: 'Allow',
              Action: ['lambda:InvokeFunction'],
              Resource: ['*'],
            },
          ],
        },
      },
      { parent: this }
    );

    // IAM Role for Processor Lambda
    const processorRole = new aws.iam.Role(
      `processor-role-${environmentSuffix}`,
      {
        name: `processor-role-${environmentSuffix}`,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: {
          ...props?.tags,
          Name: `processor-role-${environmentSuffix}`,
        },
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
      `processor-xray-${environmentSuffix}`,
      {
        role: processorRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    const processorPolicy = new aws.iam.RolePolicy(
      `processor-policy-${environmentSuffix}`,
      {
        role: processorRole.id,
        policy: pulumi.all([transactionsTable.arn, auditBucket.arn]).apply(
          ([tableArn, bucketArn]) => ({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'dynamodb:PutItem',
                  'dynamodb:UpdateItem',
                  'dynamodb:GetItem',
                ],
                Resource: [tableArn],
              },
              {
                Effect: 'Allow',
                Action: ['s3:PutObject', 's3:PutObjectAcl'],
                Resource: [`${bucketArn}/*`],
              },
              {
                Effect: 'Allow',
                Action: ['sqs:SendMessage'],
                Resource: [processorDlq.arn],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // IAM Role for Notifier Lambda
    const notifierRole = new aws.iam.Role(
      `notifier-role-${environmentSuffix}`,
      {
        name: `notifier-role-${environmentSuffix}`,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: {
          ...props?.tags,
          Name: `notifier-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `notifier-basic-${environmentSuffix}`,
      {
        role: notifierRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `notifier-xray-${environmentSuffix}`,
      {
        role: notifierRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    const notifierPolicy = new aws.iam.RolePolicy(
      `notifier-policy-${environmentSuffix}`,
      {
        role: notifierRole.id,
        policy: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['sqs:SendMessage'],
              Resource: [notifierDlq.arn],
            },
          ],
        },
      },
      { parent: this }
    );

    // Lambda Functions
    const validatorFunction = new aws.lambda.Function(
      `validator-${environmentSuffix}`,
      {
        name: `validator-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.Go1dx,
        handler: 'main',
        role: validatorRole.arn,
        code: new pulumi.asset.AssetArchive({
          'main': new pulumi.asset.FileAsset(
            path.join(__dirname, 'lambda/validator/main')
          ),
        }),
        memorySize: 512,
        timeout: 60,
        reservedConcurrentExecutions: 100,
        deadLetterConfig: {
          targetArn: validatorDlq.arn,
        },
        tracingConfig: {
          mode: 'Active',
        },
        environment: {
          variables: {
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tags: {
          ...props?.tags,
          Name: `validator-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [validatorLogGroup] }
    );

    const processorFunction = new aws.lambda.Function(
      `processor-${environmentSuffix}`,
      {
        name: `processor-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.Go1dx,
        handler: 'main',
        role: processorRole.arn,
        code: new pulumi.asset.AssetArchive({
          'main': new pulumi.asset.FileAsset(
            path.join(__dirname, 'lambda/processor/main')
          ),
        }),
        memorySize: 512,
        timeout: 60,
        reservedConcurrentExecutions: 100,
        deadLetterConfig: {
          targetArn: processorDlq.arn,
        },
        tracingConfig: {
          mode: 'Active',
        },
        environment: {
          variables: {
            DYNAMODB_TABLE: transactionsTable.name,
            S3_BUCKET: auditBucket.bucket,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tags: {
          ...props?.tags,
          Name: `processor-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [processorLogGroup] }
    );

    const notifierFunction = new aws.lambda.Function(
      `notifier-${environmentSuffix}`,
      {
        name: `notifier-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.Go1dx,
        handler: 'main',
        role: notifierRole.arn,
        code: new pulumi.asset.AssetArchive({
          'main': new pulumi.asset.FileAsset(
            path.join(__dirname, 'lambda/notifier/main')
          ),
        }),
        memorySize: 512,
        timeout: 60,
        reservedConcurrentExecutions: 100,
        deadLetterConfig: {
          targetArn: notifierDlq.arn,
        },
        tracingConfig: {
          mode: 'Active',
        },
        environment: {
          variables: {
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tags: {
          ...props?.tags,
          Name: `notifier-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [notifierLogGroup] }
    );

    // Lambda Event Invoke Config for Destinations
    const validatorDestination = new aws.lambda.EventInvokeConfig(
      `validator-destination-${environmentSuffix}`,
      {
        functionName: validatorFunction.name,
        destinationConfig: {
          onSuccess: {
            destination: processorFunction.arn,
          },
        },
      },
      { parent: this }
    );

    // Permission for validator to invoke processor
    const processorInvokePermission = new aws.lambda.Permission(
      `processor-invoke-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: processorFunction.name,
        principal: 'lambda.amazonaws.com',
        sourceArn: validatorFunction.arn,
      },
      { parent: this }
    );

    // API Gateway REST API
    const api = new aws.apigateway.RestApi(
      `transaction-api-${environmentSuffix}`,
      {
        name: `transaction-api-${environmentSuffix}`,
        description: 'Transaction Processing API',
        endpointConfiguration: {
          types: 'REGIONAL',
        },
        tags: {
          ...props?.tags,
          Name: `transaction-api-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // API Gateway Resource
    const transactionResource = new aws.apigateway.Resource(
      `transaction-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'transaction',
      },
      { parent: this }
    );

    // Request Validator
    const requestValidator = new aws.apigateway.RequestValidator(
      `request-validator-${environmentSuffix}`,
      {
        restApi: api.id,
        name: `transaction-validator-${environmentSuffix}`,
        validateRequestBody: true,
        validateRequestParameters: true,
      },
      { parent: this }
    );

    // API Gateway Method
    const postMethod = new aws.apigateway.Method(
      `post-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: transactionResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
        apiKeyRequired: true,
        requestValidatorId: requestValidator.id,
      },
      { parent: this }
    );

    // Lambda Integration
    const lambdaIntegration = new aws.apigateway.Integration(
      `validator-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: transactionResource.id,
        httpMethod: postMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: validatorFunction.invokeArn,
      },
      { parent: this }
    );

    // Method Response
    const methodResponse200 = new aws.apigateway.MethodResponse(
      `method-response-200-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: transactionResource.id,
        httpMethod: postMethod.httpMethod,
        statusCode: '200',
        responseModels: {
          'application/json': 'Empty',
        },
      },
      { parent: this }
    );

    const methodResponse400 = new aws.apigateway.MethodResponse(
      `method-response-400-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: transactionResource.id,
        httpMethod: postMethod.httpMethod,
        statusCode: '400',
        responseModels: {
          'application/json': 'Error',
        },
      },
      { parent: this }
    );

    const methodResponse500 = new aws.apigateway.MethodResponse(
      `method-response-500-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: transactionResource.id,
        httpMethod: postMethod.httpMethod,
        statusCode: '500',
        responseModels: {
          'application/json': 'Error',
        },
      },
      { parent: this }
    );

    // Lambda Permission for API Gateway
    const apiLambdaPermission = new aws.lambda.Permission(
      `api-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: validatorFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // API Deployment
    const deployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
        stageName: '',
      },
      {
        parent: this,
        dependsOn: [postMethod, lambdaIntegration],
      }
    );

    // API Stage
    const stage = new aws.apigateway.Stage(
      `api-stage-${environmentSuffix}`,
      {
        restApi: api.id,
        deployment: deployment.id,
        stageName: 'prod',
        xrayTracingEnabled: true,
        tags: {
          ...props?.tags,
          Name: `api-stage-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Usage Plan
    const usagePlan = new aws.apigateway.UsagePlan(
      `usage-plan-${environmentSuffix}`,
      {
        name: `transaction-usage-plan-${environmentSuffix}`,
        description: 'Usage plan for transaction API',
        apiStages: [
          {
            apiId: api.id,
            stage: stage.stageName,
          },
        ],
        throttleSettings: {
          burstLimit: 1000,
          rateLimit: 500,
        },
        quotaSettings: {
          limit: 100000,
          period: 'DAY',
        },
        tags: {
          ...props?.tags,
          Name: `usage-plan-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // API Key
    const apiKey = new aws.apigateway.ApiKey(
      `api-key-${environmentSuffix}`,
      {
        name: `transaction-api-key-${environmentSuffix}`,
        enabled: true,
        tags: {
          ...props?.tags,
          Name: `api-key-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Usage Plan Key
    const usagePlanKey = new aws.apigateway.UsagePlanKey(
      `usage-plan-key-${environmentSuffix}`,
      {
        keyId: apiKey.id,
        keyType: 'API_KEY',
        usagePlanId: usagePlan.id,
      },
      { parent: this }
    );

    // Exports
    this.apiUrl = pulumi.interpolate`${api.id}.execute-api.${aws.getRegionOutput().name}.amazonaws.com/${stage.stageName}`;
    this.tableName = transactionsTable.name;
    this.bucketName = auditBucket.bucket;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      tableName: this.tableName,
      bucketName: this.bucketName,
      apiKeyId: apiKey.id,
    });
  }
}
```

## File: lib/lambda/validator/main.go

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type TransactionRequest struct {
	TransactionID string  `json:"transactionId"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"`
	Source        string  `json:"source"`
}

type TransactionResponse struct {
	Message       string `json:"message"`
	TransactionID string `json:"transactionId,omitempty"`
	Valid         bool   `json:"valid"`
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var transaction TransactionRequest

	// Parse request body
	if err := json.Unmarshal([]byte(request.Body), &transaction); err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       `{"message": "Invalid request body", "valid": false}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	// Validate transaction
	if transaction.TransactionID == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       `{"message": "TransactionID is required", "valid": false}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	if transaction.Amount <= 0 {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       `{"message": "Amount must be greater than zero", "valid": false}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	if transaction.Currency == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       `{"message": "Currency is required", "valid": false}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	if transaction.Source == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       `{"message": "Source is required", "valid": false}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	// Validation successful
	response := TransactionResponse{
		Message:       "Transaction validated successfully",
		TransactionID: transaction.TransactionID,
		Valid:         true,
	}

	responseBody, err := json.Marshal(response)
	if err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       `{"message": "Internal server error", "valid": false}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

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
```

## File: lib/lambda/validator/go.mod

```go
module validator

go 1.19

require github.com/aws/aws-lambda-go v1.41.0
```

## File: lib/lambda/processor/main.go

```go
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/s3"
)

type LambdaInvokePayload struct {
	RequestPayload  string `json:"requestPayload"`
	ResponsePayload string `json:"responsePayload"`
}

type TransactionData struct {
	TransactionID string  `json:"transactionId"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"`
	Source        string  `json:"source"`
}

type DynamoDBRecord struct {
	TransactionID string  `json:"transactionId"`
	Timestamp     int64   `json:"timestamp"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"`
	Source        string  `json:"source"`
	Status        string  `json:"status"`
	ProcessedAt   string  `json:"processedAt"`
}

func handler(ctx context.Context, event LambdaInvokePayload) error {
	tableName := os.Getenv("DYNAMODB_TABLE")
	bucketName := os.Getenv("S3_BUCKET")

	// Parse the request payload
	var transaction TransactionData
	if err := json.Unmarshal([]byte(event.RequestPayload), &transaction); err != nil {
		return fmt.Errorf("failed to parse request payload: %w", err)
	}

	// Create AWS session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(os.Getenv("AWS_REGION")),
	})
	if err != nil {
		return fmt.Errorf("failed to create AWS session: %w", err)
	}

	dynamodbSvc := dynamodb.New(sess)
	s3Svc := s3.New(sess)

	// Prepare DynamoDB record
	now := time.Now()
	record := DynamoDBRecord{
		TransactionID: transaction.TransactionID,
		Timestamp:     now.Unix(),
		Amount:        transaction.Amount,
		Currency:      transaction.Currency,
		Source:        transaction.Source,
		Status:        "processed",
		ProcessedAt:   now.Format(time.RFC3339),
	}

	// Marshal record for DynamoDB
	av, err := dynamodbattribute.MarshalMap(record)
	if err != nil {
		return fmt.Errorf("failed to marshal DynamoDB record: %w", err)
	}

	// Write to DynamoDB
	_, err = dynamodbSvc.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      av,
	})
	if err != nil {
		return fmt.Errorf("failed to write to DynamoDB: %w", err)
	}

	// Prepare audit log for S3
	auditLog := map[string]interface{}{
		"transactionId": transaction.TransactionID,
		"timestamp":     now.Unix(),
		"amount":        transaction.Amount,
		"currency":      transaction.Currency,
		"source":        transaction.Source,
		"status":        "processed",
		"processedAt":   now.Format(time.RFC3339),
		"auditTime":     time.Now().Format(time.RFC3339),
	}

	auditLogJSON, err := json.Marshal(auditLog)
	if err != nil {
		return fmt.Errorf("failed to marshal audit log: %w", err)
	}

	// Write to S3
	key := fmt.Sprintf("audit-logs/%s/%s.json",
		now.Format("2006-01-02"),
		transaction.TransactionID)

	_, err = s3Svc.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(key),
		Body:        aws.ReadSeekCloser(bytes.NewReader(auditLogJSON)),
		ContentType: aws.String("application/json"),
	})
	if err != nil {
		return fmt.Errorf("failed to write to S3: %w", err)
	}

	fmt.Printf("Successfully processed transaction %s\n", transaction.TransactionID)
	return nil
}

func main() {
	lambda.Start(handler)
}
```

## File: lib/lambda/processor/go.mod

```go
module processor

go 1.19

require (
	github.com/aws/aws-lambda-go v1.41.0
	github.com/aws/aws-sdk-go v1.44.284
)
```

## File: lib/lambda/notifier/main.go

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
)

type NotificationEvent struct {
	TransactionID string `json:"transactionId"`
	Status        string `json:"status"`
	Message       string `json:"message"`
}

func handler(ctx context.Context, event NotificationEvent) error {
	// In a real implementation, this would send notifications via SNS, SES, or other services
	// For this example, we'll just log the notification

	notification := map[string]interface{}{
		"transactionId": event.TransactionID,
		"status":        event.Status,
		"message":       event.Message,
		"notifiedAt":    time.Now().Format(time.RFC3339),
	}

	notificationJSON, err := json.Marshal(notification)
	if err != nil {
		return fmt.Errorf("failed to marshal notification: %w", err)
	}

	fmt.Printf("Notification sent: %s\n", string(notificationJSON))
	return nil
}

func main() {
	lambda.Start(handler)
}
```

## File: lib/lambda/notifier/go.mod

```go
module notifier

go 1.19

require github.com/aws/aws-lambda-go v1.41.0
```

## File: lib/README.md

```markdown
# Transaction Processing System

A serverless transaction processing system built with Pulumi and TypeScript, deployed on AWS.

## Architecture

This system implements a complete serverless transaction processing pipeline:

- **API Gateway**: REST API with POST endpoint `/transaction`
- **Lambda Functions**:
  - `validator`: Validates incoming transaction requests (Go 1.x runtime)
  - `processor`: Processes valid transactions, writes to DynamoDB and S3 (Go 1.x runtime)
  - `notifier`: Sends notifications (Go 1.x runtime)
- **DynamoDB**: Stores transaction records with partition key `transactionId` and sort key `timestamp`
- **S3**: Stores audit logs with lifecycle policy (90 days to Glacier)
- **SQS**: Dead letter queues for all Lambda functions
- **CloudWatch**: Log groups with 7-day retention

## Features

- Request validation at API Gateway level
- Lambda destinations for asynchronous invocation (validator -> processor)
- Dead letter queues for failed Lambda executions
- X-Ray tracing enabled on all Lambda functions
- Reserved concurrent executions (100) per function
- Point-in-time recovery for DynamoDB
- Server-side encryption for S3 and DynamoDB
- S3 versioning enabled
- API key authentication via usage plans
- IAM least-privilege roles for each Lambda function

## Deployment

```bash
# Install dependencies
npm install

# Configure Pulumi
pulumi config set aws:region ap-southeast-1

# Deploy
pulumi up

# Get outputs
pulumi stack output apiUrl
pulumi stack output tableName
pulumi stack output bucketName
```

## Testing the API

```bash
# Get API URL and Key
API_URL=$(pulumi stack output apiUrl)
API_KEY=$(aws apigateway get-api-keys --query 'items[0].value' --output text)

# Send transaction
curl -X POST "https://${API_URL}/transaction" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "transactionId": "txn-12345",
    "amount": 100.50,
    "currency": "USD",
    "source": "payment-gateway"
  }'
```

## Outputs

- `apiUrl`: API Gateway invoke URL
- `tableName`: DynamoDB table name
- `bucketName`: S3 bucket name for audit logs
- `apiKeyId`: API Gateway API key ID

## Lambda Functions

All Lambda functions use Go 1.x runtime for performance and cost efficiency. The functions are located in `lib/lambda/`:

- `validator/`: Input validation logic
- `processor/`: Transaction processing logic
- `notifier/`: Notification logic

## Monitoring

- CloudWatch Logs: 7-day retention for all functions
- X-Ray: Distributed tracing enabled
- CloudWatch Metrics: Available for all Lambda functions and API Gateway

## Security

- IAM roles with least-privilege permissions
- Server-side encryption (AES256) for S3
- DynamoDB encryption at rest
- API key authentication required
- Request validation enabled
- VPC deployment (optional - not implemented in this version)

## Cleanup

```bash
pulumi destroy
```

Note: S3 bucket must be empty before destruction. Run this first if needed:

```bash
BUCKET_NAME=$(pulumi stack output bucketName)
aws s3 rm s3://${BUCKET_NAME} --recursive
```
```