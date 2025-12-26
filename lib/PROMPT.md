Create an AWS CloudFormation YAML template for an serverless transaction processing pipeline. The template must include and configure all required aws resources with proper integration and security.

Requirements:

Deploy a REST API using API Gateway that connects to Lambda functions with: Request validation, Throttling limit of 10,000 requests per second, AWS_IAM authorization, CORS enabled for specific allowed domains only, CloudWatch Logs retention: 30 days, X-Ray tracing enabled

Implement three Lambda functions using Python 3.11 runtime and arm64 architecture:

- TransactionValidatorLambda - 256MB memory, reserved concurrency 100

- FraudDetectorLambda - 512MB memory, reserved concurrency 50

- AuditLoggerLambda - 128MB memory, reserved concurrency 25

All of these should have the environment variables encrypted with a customer-managed KMS key

X-Ray tracing should be enabled

Each Lambda should have a dedicated least-privilege IAM role

Each Lambda should use an SQS Dead Letter Queue for failed processing

CloudWatch Logs retention: 7 days

Create DynamoDB tables:

TransactionsTable - ondemand billing

FraudPatternsTable - provisioned with 100 RCU and 100 WCU

Both must have point-in-time recovery and aes256 encryption enabled

Set up an AWS Step Functions state machine to orchestrate the workflow that invokes the Lambda functions:

Include validation, fraud detection, and audit logging steps

Run fraud detection in parallel

Include error handling with exponential backoff retry logic

The Lambda functions should write to DynamoDB tables for transaction storage and fraud pattern tracking.

Configure an EventBridge rule to trigger the audit logging Lambda when a transaction completes.

Ensure the entire system supports sub-second response times and integrates all components correctly.

Output:
Generate a single CloudFormation YAML template that deploys the complete secure and cost-optimized serverless infrastructure, with all the mentioned resources and security concerns.
