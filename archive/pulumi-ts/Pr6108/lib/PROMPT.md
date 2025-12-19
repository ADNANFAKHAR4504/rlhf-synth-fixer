# Serverless Fraud Detection System

## Business Context

A financial services company needs to process millions of daily transaction events for fraud detection. They require a serverless architecture that can handle variable loads efficiently while maintaining low latency and cost-effectiveness.

## Infrastructure Requirements

Create a **Pulumi TypeScript** program to deploy a serverless fraud detection system with the following specifications:

### 1. Data Storage

- DynamoDB table named 'fraud-transactions'
  - Partition key: 'transactionId' (string)
  - Sort key: 'timestamp' (number)
  - On-demand pricing mode
  - Point-in-time recovery enabled for compliance

### 2. Lambda Functions

Deploy three Lambda functions with the following specifications:

- **transaction-ingestion**: Processes incoming transactions
  - Reserved concurrent executions: 50
  - ARM-based Graviton2 processor
  - Deployed in private subnets with VPC endpoints

- **fraud-detector**: Analyzes transactions
  - Reserved concurrent executions: 30
  - ARM-based Graviton2 processor
  - Deployed in private subnets with VPC endpoints

- **alert-dispatcher**: Sends notifications
  - Reserved concurrent executions: 20
  - ARM-based Graviton2 processor
  - Deployed in private subnets with VPC endpoints

All Lambda functions must:
- Use Node.js 18+ runtime
- Have environment variables encrypted with customer-managed KMS key
- Have concurrent execution limit set to 100 per function
- Be deployed in private subnets with VPC endpoints for AWS services

### 3. Message Queuing

- **fraud-analysis-queue**: SQS queue connecting ingestion and detector functions
  - Dead letter queue configured with 14-day retention

- **alert-queue**: SQS queue for alert dispatcher
  - Visibility timeout: 300 seconds
  - Dead letter queue configured with 14-day retention

### 4. API Gateway

- REST API with POST endpoint '/transactions'
- Triggers the transaction-ingestion Lambda function
- Request throttling at 1000 requests per second

### 5. Event Processing

- EventBridge rule triggering fraud detector every 5 minutes for batch processing

### 6. Notifications

- SNS topic 'fraud-alerts' for critical fraud notifications

### 7. Logging and Monitoring

- CloudWatch Log Groups for each Lambda function
- 7-day retention period

### 8. Security and IAM

- IAM roles with least-privilege permissions for each Lambda function
- Customer-managed KMS keys for encryption at rest
- All Lambda environment variables encrypted with KMS

### 9. Network Architecture

- VPC with private subnets across 3 availability zones (us-east-2)
- VPC endpoints for AWS services to avoid NAT Gateway costs
- Lambda functions deployed in private subnets

## Performance Requirements

- Handle 100,000 transactions per hour
- Sub-second ingestion latency
- Process incoming transactions through API Gateway
- Queue transactions for fraud analysis
- Run periodic batch fraud detection
- Dispatch alerts for suspicious activities

## Technical Constraints

- Region: us-east-2
- Availability Zones: 3
- Pulumi version: 3.x
- Node.js version: 18+
- AWS CLI configured with appropriate credentials
- All resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `resource-name-${environmentSuffix}`
- All resources must be destroyable (no Retain deletion policies)

## Expected Outputs

The infrastructure should provide a complete serverless fraud detection pipeline that:
1. Accepts transactions via API Gateway
2. Ingests and stores them in DynamoDB
3. Queues transactions for analysis
4. Runs fraud detection algorithms periodically
5. Dispatches alerts for suspicious activities
6. Maintains high availability and cost-effectiveness
