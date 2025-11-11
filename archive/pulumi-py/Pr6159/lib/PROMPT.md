# Real-Time Fraud Detection Pipeline

Hey team,

We have a fintech startup that needs to process customer transaction data in real-time to catch fraud before it becomes a major issue. The business is seeing variable traffic patterns throughout the day, so we need something that can scale on demand without breaking the bank. They're also serious about data privacy and audit compliance, which makes sense given they're handling financial transactions.

I've been asked to build this using Pulumi with Python since that's what our team is comfortable with. The goal is to create a fully serverless pipeline that takes transactions through validation, storage, fraud analysis, and alerting, all while keeping response times under a second for the API.

The architecture is pretty straightforward - transactions come in through an API Gateway, get validated and stored in DynamoDB, then flow through a fraud detection system that uses DynamoDB streams to trigger analysis. If something looks suspicious, we queue it up and send notifications to the fraud team via SNS.

## What we need to build

Create a serverless fraud detection pipeline using **Pulumi with Python** for processing real-time transaction data.

### Core Requirements

1. **API Entry Point**
   - API Gateway REST API (not HTTP API) with POST endpoint at /transactions
   - Request validation must be enabled
   - Trigger Lambda function for transaction processing

2. **Transaction Processing**
   - Lambda function (process-transaction) validates incoming data
   - Stores validated transactions in DynamoDB table
   - Table schema: partition key 'transaction_id' (string), sort key 'timestamp' (number)

3. **Data Storage and Streaming**
   - DynamoDB table named 'transactions'
   - DynamoDB Streams enabled with NEW_AND_OLD_IMAGES view type
   - On-demand billing mode for cost optimization

4. **Fraud Detection**
   - Lambda function (detect-fraud) triggered by DynamoDB streams
   - Performs fraud analysis on transaction data
   - Sends suspicious transactions to SQS queue

5. **Alert Queueing**
   - SQS queue (fraud-alerts) receives suspicious transactions
   - Visibility timeout set to exactly 300 seconds
   - Decouples fraud detection from notification system

6. **Notification System**
   - Lambda function (notify-team) polls SQS queue
   - Sends alerts via SNS topic
   - SNS topic (fraud-notifications) with email subscription endpoint

7. **Security and Access Control**
   - IAM roles for each Lambda function with least privilege
   - Custom KMS key for encrypting Lambda environment variables
   - KMS encryption for sensitive data at rest and in transit

8. **Logging and Monitoring**
   - CloudWatch log groups for each Lambda function
   - 7-day retention policy for all logs

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **API Gateway** (REST API) for transaction ingestion
- Use **Lambda** (Python 3.9 runtime) for all processing functions
- Use **DynamoDB** with streams for transaction storage
- Use **SQS** for decoupling processing stages
- Use **SNS** for alert notifications
- Use **KMS** for encryption
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
- Deploy to **us-east-1** region

### Mandatory Constraints (ALL MUST BE SATISFIED EXACTLY)

- Lambda functions: reserved concurrency of exactly 50
- Lambda functions: 512MB memory allocation
- Lambda functions: Python 3.9 runtime
- Lambda environment variables: encrypted with custom KMS key
- DynamoDB: on-demand billing mode
- DynamoDB streams: NEW_AND_OLD_IMAGES view type
- API Gateway: REST API (not HTTP API)
- API Gateway: request validation enabled
- SQS: visibility timeout of 300 seconds
- All resources: tagged with 'Environment': 'production' and 'CostCenter': 'fraud-detection'
- All resources: must be destroyable (no Retain policies)
- Resource naming: all resources must include environmentSuffix parameter

### Constraints

- No VPC required (fully managed services only)
- Handle burst traffic with sub-second API response times
- Cost-optimized for variable workloads
- Proper error handling and logging in all Lambda functions
- Least privilege IAM policies for each component

## Success Criteria

- **Functionality**: API accepts POST requests and processes transactions through entire pipeline
- **Performance**: Sub-second response time for API Gateway endpoint
- **Reliability**: DynamoDB streams reliably trigger fraud detection Lambda
- **Security**: All sensitive data encrypted at rest and in transit with KMS
- **Resource Naming**: All resources include environmentSuffix for deployment uniqueness
- **Monitoring**: CloudWatch logs capture all Lambda execution details with 7-day retention
- **Compliance**: All 10 mandatory constraints satisfied exactly as specified
- **Cost Optimization**: Serverless architecture with on-demand billing handles variable loads efficiently

## What to deliver

- Complete Pulumi Python implementation in lib/tap_stack.py
- Lambda function code for process-transaction in lib/lambda/ or lib/functions/
- Lambda function code for detect-fraud in lib/lambda/ or lib/functions/
- Lambda function code for notify-team in lib/lambda/ or lib/functions/
- IAM roles and policies with least privilege access
- KMS key configuration for encryption
- CloudWatch log groups with 7-day retention
- API Gateway REST API with request validation
- DynamoDB table with streams configuration
- SQS queue with proper timeout settings
- SNS topic with subscription configuration
- All resources properly tagged
- Documentation and deployment instructions
