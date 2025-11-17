Hey team,

We need to build a serverless fraud detection system for processing financial transactions in real-time. Our fintech startup is handling credit card transaction events and needs to detect fraudulent patterns as quickly as possible. The business requirements are pretty clear: we need a solution that can scale automatically during high transaction volumes, maintain low latency for fraud detection, and keep security compliance at the forefront. I've been asked to create this infrastructure using **CDKTF with Python** for the us-east-1 region.

The existing setup requires us to process incoming transactions through a REST API, store them in DynamoDB, and trigger alerts when suspicious patterns are detected. The system also needs periodic analysis of transaction patterns to catch fraud that might not be obvious from a single transaction. All of this needs to be serverless to keep costs down during low traffic periods while still handling spikes efficiently.

## What we need to build

Create a serverless fraud detection infrastructure using **CDKTF with Python** to process financial transactions and detect fraudulent patterns.

### Core Requirements

1. **API Gateway and Transaction Processing**
   - REST API with /transactions POST endpoint
   - Request body schema validation at the API level
   - Lambda function (Python 3.11 runtime) to process incoming transactions
   - Store all transactions in DynamoDB table
   - API Gateway usage plan with 1000 requests per day limit and API key requirement

2. **Data Storage**
   - DynamoDB table with partition key 'transaction_id' and sort key 'timestamp'
   - Global secondary index on 'user_id' for user-based pattern analysis
   - On-demand billing mode with point-in-time recovery enabled

3. **Alert System**
   - SNS topic for publishing fraud alerts when suspicious patterns detected
   - SQS queue subscribed to the SNS topic for downstream alert processing
   - Lambda destinations to send failed invocations to dedicated SQS dead letter queue
   - SNS topics must have server-side encryption and delivery status logging enabled

4. **Pattern Analysis**
   - Scheduled Lambda function running every 5 minutes to analyze transaction patterns
   - Function identifies anomalies and triggers alerts

5. **Monitoring and Logging**
   - CloudWatch Log groups for all Lambda functions with 30-day retention period
   - CloudWatch alarms for Lambda errors exceeding 1% error rate over 5 minutes
   - X-Ray tracing for all Lambda functions and API Gateway for distributed tracing

6. **Security and Configuration**
   - Lambda environment variables using Systems Manager Parameter Store for sensitive data
   - KMS customer-managed keys for encrypting data in transit
   - IAM roles with least privilege principle (separate role per Lambda function)

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use Lambda for serverless compute
- Use API Gateway for REST endpoints
- Use DynamoDB for transaction storage
- Use SNS and SQS for messaging
- Use CloudWatch for logging and monitoring
- Use Systems Manager Parameter Store for configuration
- Use KMS for encryption keys
- Use X-Ray for distributed tracing
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-environment-suffix`
- Deploy to us-east-1 region

### Constraints

- Lambda functions MUST use ARM-based Graviton2 processors (ARM64 architecture) for cost optimization
- Lambda functions MUST have reserved concurrent executions (use low values 1-5 to avoid account limits)
- API Gateway MUST implement request validation and rate limiting per API key
- All data in transit MUST be encrypted using AWS KMS customer-managed keys
- DynamoDB tables MUST use on-demand billing with point-in-time recovery enabled
- All resources MUST be tagged with Environment, Project, and CostCenter tags
- All resources must be destroyable (no Retain policies, use deletion_protection=false)
- Include proper error handling and logging in Lambda functions

### Deployment Requirements (CRITICAL)

1. **Resource Naming**: ALL named resources MUST include environmentSuffix variable for uniqueness
   - Pattern: `{resource-name}-${environmentSuffix}` in Python string formatting
   - Example: `f"fraud-detection-api-{environment_suffix}"`

2. **Resource Lifecycle**: ALL resources MUST be completely destroyable
   - Use `removal_policy = RemovalPolicy.DESTROY` (not RETAIN)
   - Set `deletion_protection = False` for databases
   - Do not use any retention or protection policies that prevent deletion

3. **Lambda Concurrency**: Use low reserved concurrency values (1-5) to prevent hitting AWS account-level Lambda concurrency limits during deployment

4. **Service-Specific Requirements**:
   - Lambda Node.js 18+: If using Node.js runtime, import AWS SDK v3 explicitly (not included by default)
   - KMS Keys: Ensure proper key policies for all services that need encryption access
   - X-Ray: Enable active tracing on both Lambda and API Gateway resources

## Success Criteria

- **Functionality**: API successfully receives transactions, stores in DynamoDB, triggers fraud detection logic
- **Performance**: Transaction processing latency under 200ms, scheduled analysis completes within 30 seconds
- **Reliability**: Dead letter queues capture failed messages, CloudWatch alarms alert on error rate spikes
- **Security**: All data encrypted in transit with KMS, IAM roles follow least privilege, sensitive config in Parameter Store
- **Resource Naming**: All resources include environmentSuffix for deployment uniqueness
- **Code Quality**: Clean Python code, modular CDKTF constructs, well-documented, includes deployment instructions

## What to deliver

- Complete CDKTF Python implementation with modular constructs
- Lambda functions for transaction processing and pattern analysis
- API Gateway REST API with request validation
- DynamoDB table with GSI for user lookups
- SNS topic and SQS queue for alert distribution
- CloudWatch Log groups, alarms, and X-Ray tracing configuration
- KMS encryption keys and IAM roles
- Systems Manager parameters for Lambda configuration
- Unit tests for infrastructure validation
- Documentation including deployment instructions and architecture overview
