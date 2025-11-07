# Serverless Payment Processing Infrastructure

Hey team,

We need to build a serverless payment processing system for a fintech startup that handles credit card transactions asynchronously while maintaining PCI compliance. The business is focused on processing transactions without storing sensitive card data, and they need a robust system that can handle transaction validation, fraud detection webhooks, and merchant notifications reliably.

The architecture needs to be fully serverless to minimize operational overhead and costs. We've been asked to create this using **Pulumi with Python** to provision the entire infrastructure on AWS. The system will handle high transaction volumes with proper error handling, monitoring, and compliance features built in from day one.

The key challenge here is building a system that can process payments asynchronously through queues, respond to fraud detection webhooks in real-time, and send notifications to merchants reliably. Everything needs proper monitoring, error handling with dead letter queues, and compliance features like X-Ray tracing for audit trails.

## What we need to build

Create a serverless payment processing infrastructure using **Pulumi with Python** for handling credit card transactions with fraud detection and notifications.

### Core Requirements

1. **API Gateway REST API Configuration**
   - Create REST API with three endpoints: POST /transactions, POST /fraud-webhook, and GET /transaction/{id}
   - Configure API Gateway stages with throttling limits of 1000 requests/second
   - Enable request validation and API keys for all endpoints
   - Set up API Gateway to trigger transaction_processor Lambda for POST /transactions
   - Enable X-Ray tracing on API Gateway stages

2. **Lambda Functions Deployment**
   - Deploy three Lambda functions: transaction_processor, fraud_handler, and notification_sender
   - Use Python 3.11 runtime with arm64 architecture for all functions
   - Configure 3GB memory allocation and 5 minute timeout for each function
   - Set reserved concurrency of 50 for the transaction processor
   - Enable X-Ray tracing on all Lambda functions
   - Enable CloudWatch Logs with 7-day retention for all functions
   - Set up Lambda event source mappings from SQS queues to respective Lambda functions

3. **DynamoDB Tables Setup**
   - Create transactions table with partition key: transaction_id
   - Create fraud_alerts table with partition key: alert_id and sort key: timestamp
   - Use on-demand billing mode for both tables
   - Enable point-in-time recovery for both tables

4. **SQS Queue Configuration**
   - Set up two SQS FIFO queues: transaction-processing.fifo and notifications.fifo
   - Configure 4-day message retention (345600 seconds)
   - Enable content-based deduplication for both FIFO queues
   - Create Dead Letter Queues for both SQS queues with max receive count of 3

5. **IAM Security and Permissions**
   - Create IAM roles with least-privilege policies for each Lambda function
   - Ensure Lambda functions can write to CloudWatch Logs
   - Grant appropriate permissions for DynamoDB access, SQS operations, and X-Ray tracing

6. **Configuration and Monitoring**
   - Create SSM parameters for storing webhook URLs and API keys
   - Export the API Gateway invoke URL and all Lambda function ARNs
   - Enable distributed tracing with X-Ray across all components

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **API Gateway** REST API for HTTP endpoints
- Use **Lambda** with Python 3.11 runtime and arm64 architecture for compute
- Use **DynamoDB** for transaction and fraud alert storage
- Use **SQS** FIFO queues for reliable message processing
- Use **IAM** for security and access control
- Use **CloudWatch Logs** for centralized logging
- Use **SSM Parameter Store** for configuration management
- Use **X-Ray** for distributed tracing
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{purpose}-environment-suffix
- Deploy to **us-east-2** region

### Constraints

- Lambda reserved concurrency of 50 for transaction processor
- API Gateway must use request validation and API keys for all endpoints
- DynamoDB tables must use on-demand billing and point-in-point recovery
- All Lambda functions must have 3GB memory allocation and 5 minute timeout
- SQS FIFO queues with content-based deduplication enabled
- Lambda functions must use Python 3.11 runtime with arm64 architecture
- Enable X-Ray tracing on all Lambda functions and API Gateway stages
- Use SSM Parameter Store for storing API keys and webhook URLs
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: All three API endpoints operational and properly integrated with Lambda functions
- **Performance**: API Gateway throttling configured at 1000 req/sec, Lambda functions with 3GB memory and 5 min timeout
- **Reliability**: SQS FIFO queues with DLQs configured, 4-day retention, max receive count of 3
- **Security**: IAM roles with least-privilege policies, API keys required for all endpoints
- **Monitoring**: CloudWatch Logs with 7-day retention, X-Ray tracing enabled on all components
- **Data Persistence**: DynamoDB tables with on-demand billing and point-in-time recovery
- **Configuration**: SSM parameters created for webhook URLs and API keys
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Python code, well-structured, fully documented

## What to deliver

- Complete Pulumi Python implementation
- API Gateway REST API with three endpoints and request validation
- Three Lambda functions with Python 3.11 runtime and arm64 architecture
- Two DynamoDB tables with proper key schemas
- Two SQS FIFO queues with Dead Letter Queues
- IAM roles and policies for each Lambda function
- CloudWatch Logs configuration with 7-day retention
- SSM parameters for configuration storage
- X-Ray tracing enabled across all components
- Lambda event source mappings for queue processing
- Exported outputs for API Gateway URL and Lambda ARNs
- Deployment documentation
