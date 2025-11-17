Hey team,

We need to build a serverless transaction processing system for a fintech startup that needs to handle real-time credit card transactions at scale. The business wants to process transactions through an API, validate them against fraud patterns, and maintain detailed audit trails for compliance. They're expecting variable loads during peak shopping seasons but need sub-second response times.

I've been asked to create this infrastructure using **Pulumi with TypeScript**. The solution needs to be fully serverless to handle the variable load efficiently and keep costs manageable during off-peak times.

The system needs to process transactions through a REST API, store them in a database with stream processing for fraud detection, maintain transaction ordering through queuing, and send notifications when transactions are processed. All of this needs proper encryption, monitoring, and throttling controls to meet security and compliance requirements.

## What we need to build

Create a serverless transaction processing system using **Pulumi with TypeScript** that handles credit card transactions with real-time validation and fraud detection.

### Core Requirements

1. **API Gateway Configuration**
   - REST API with /transaction POST endpoint
   - OpenAPI 3.0 schema validation for request body
   - Usage plan with API key requirement
   - Throttling limit of 10000 requests per day
   - Export invoke URL and API key

2. **Transaction Validator Lambda**
   - Node.js 18.x runtime
   - Processes incoming API requests
   - Writes validated transactions to DynamoDB
   - Reserved concurrent executions of 100

3. **DynamoDB Table**
   - Partition key: transactionId
   - Sort key: timestamp
   - On-demand billing mode
   - Streams enabled for fraud detection

4. **Fraud Detection Lambda**
   - Node.js 18.x runtime
   - Triggered by DynamoDB streams
   - Analyzes transaction patterns asynchronously
   - Reserved concurrent executions of 100
   - Dead letter queue for failed processing

5. **SQS FIFO Queue**
   - Maintains transaction order
   - 30 second visibility timeout
   - Connected to notification system

6. **Notification Lambda**
   - Node.js 18.x runtime
   - Reads from SQS FIFO queue
   - Publishes results to SNS topic
   - Reserved concurrent executions of 100
   - Dead letter queue for failed processing

7. **Security and Encryption**
   - Custom KMS key for Lambda environment variables
   - Dead letter queues retain messages for 14 days
   - IAM roles with least-privilege principle

8. **Monitoring and Logging**
   - CloudWatch Log groups for all Lambda functions
   - 30-day retention period

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **API Gateway REST API** for transaction endpoint
- Use **Lambda** functions with Node.js 18.x runtime
- Use **DynamoDB** for transaction storage with streams
- Use **SQS FIFO** queues for maintaining transaction order
- Use **SNS** for notifications
- Use **KMS** for encryption
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Constraints

- All Lambda functions must use Node.js 18.x runtime
- Reserved concurrent executions must be exactly 100 for each Lambda
- SQS FIFO queues required for transaction sequencing
- DynamoDB must use on-demand billing
- DynamoDB streams must trigger fraud detection asynchronously
- Lambda environment variables must be encrypted with custom KMS key
- API Gateway must use OpenAPI 3.0 request validation
- API Gateway usage plan limit is 10000 requests per day
- Dead letter queues must retain messages for 14 days
- CloudWatch logs must have 30-day retention
- All resources must be destroyable with no Retain policies
- Include proper error handling and logging

## Success Criteria

- **Functionality**: API accepts transactions, validates them, stores in DynamoDB, performs fraud detection, and sends notifications
- **Performance**: Sub-second response times for API requests
- **Reliability**: Failed messages are captured in dead letter queues for retry
- **Security**: All Lambda environment variables encrypted with KMS, IAM roles follow least-privilege
- **Resource Naming**: All resources include environmentSuffix for unique identification
- **Code Quality**: TypeScript code is well-structured, tested, and documented
- **Compliance**: Transaction audit trail maintained in DynamoDB with proper retention

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- API Gateway REST API with /transaction endpoint and OpenAPI validation
- Three Lambda functions: transaction validator, fraud detector, notification sender
- DynamoDB table with streams enabled
- SQS FIFO queue for transaction ordering
- SNS topic for notifications
- Custom KMS key for encryption
- Dead letter queues for both fraud detection and notification Lambdas
- CloudWatch Log groups with 30-day retention
- IAM roles with least-privilege access
- Exported outputs: API Gateway invoke URL and API key
- Unit tests for all components
- Documentation and deployment instructions
