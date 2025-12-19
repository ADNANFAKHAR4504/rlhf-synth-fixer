Hey team,

We need to build a real-time market data processing system for our trading platform. The business team wants a serverless solution that can handle incoming market data streams, process them in real-time, store alerts, and notify traders when certain conditions are met. I've been asked to create this infrastructure using **CDKTF with Python** to leverage infrastructure as code best practices.

The system needs to handle high-throughput market data efficiently. When market prices hit certain thresholds, we need to store these alerts and notify our trading team immediately. The architecture should be resilient, with proper retry logic and error handling to ensure no critical trading signals are missed.

## What we need to build

Create a serverless real-time market data processing system using **CDKTF with Python** for AWS. The system will process market data from a queue, identify trading opportunities, store alerts in a database, and send notifications to traders.

### Core Requirements

1. **Data Processing Lambda Function**
   - Function name: data-processor
   - Memory: 3GB
   - Timeout: 60 seconds
   - Architecture: ARM64 (Graviton2)
   - Implement exponential backoff retry logic in the function code
   - Process messages from SQS queue in batches

2. **Data Storage**
   - DynamoDB table: market-alerts
   - Partition key: symbol (string)
   - Sort key: timestamp (string)
   - Enable point-in-time recovery for data protection
   - Must be fully destroyable (no RETAIN policies)

3. **Message Queue**
   - SQS queue: market-data-queue
   - Message retention: 14 days
   - Integrate with Lambda using event source mapping
   - Batch size: 25 messages per invocation

4. **Notification System**
   - SNS topic: trading-alerts
   - Used for sending notifications when alerts are created

5. **Security and Encryption**
   - KMS customer managed key for Lambda environment variables
   - IAM role with precise permissions:
     - SQS read permissions
     - DynamoDB write permissions
     - SNS publish permissions
     - KMS decrypt permissions

6. **Monitoring**
   - CloudWatch alarm monitoring Lambda error rate
   - Alert threshold: error rate greater than 1% over 5 minutes
   - Alarm should trigger notifications

7. **Concurrency Control**
   - Reserved concurrency: 5 concurrent executions
   - Prevents runaway costs and rate limiting issues

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **Lambda** for serverless compute
- Use **DynamoDB** for alert storage
- Use **SNS** for notifications
- Use **SQS** for message queuing
- Use **KMS** for encryption
- Use **IAM** for access control
- Use **CloudWatch** for monitoring
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-name}-{environmentSuffix}`
- All resources must be fully destroyable (no RETAIN policies)

### Deployment Requirements (CRITICAL)

- **Resource Naming**: All resources MUST include environmentSuffix parameter for unique naming across environments
- **Destroyability**: All resources MUST be fully destroyable. Do NOT use RETAIN deletion policies on any resources (DynamoDB, KMS, etc.)
- **Backend Configuration**: Do NOT add Terraform backend configuration with use_lockfile option - this causes deployment failures
- **Lambda Runtime**: Use Python 3.11 or 3.12 runtime
- **Proper Resource Tagging**: All resources must have Environment, Team, and CostCenter tags

### Constraints

- Must use serverless components only (no EC2 instances)
- All data must be encrypted at rest and in transit
- Lambda function must implement proper error handling
- CloudWatch logs must be enabled for debugging
- SQS queue must have dead-letter queue for failed messages
- All resources must support environment-specific deployment
- Infrastructure must be reproducible and idempotent

## Success Criteria

- **Functionality**: Messages processed from SQS trigger Lambda, write to DynamoDB, publish to SNS
- **Performance**: Lambda can process batches of 25 messages within 60 second timeout
- **Reliability**: Exponential backoff retry logic handles transient failures
- **Security**: All data encrypted, IAM permissions follow least privilege
- **Monitoring**: CloudWatch alarms detect error rates above 1%
- **Resource Naming**: All resources include environmentSuffix in their names
- **Destroyability**: All resources can be destroyed without manual intervention
- **Code Quality**: Well-structured Python code, properly tested

## What to deliver

- Complete CDKTF Python implementation in lib/tap_stack.py
- Lambda function code in lib/lambda/index.py with exponential backoff logic
- Lambda deployment package (lambda_function.zip)
- Unit tests for Lambda function (tests/unit/test_lambda_function.py) with proper mocking
- Unit tests for infrastructure (tests/unit/test_tap_stack.py) with stack synthesis tests
- Integration tests (tests/integration/test_deployment.py) for end-to-end validation
- Stack outputs including: SQS queue URL, SNS topic ARN, DynamoDB table name
- Documentation in lib/README.md with deployment instructions
- All tests must achieve 100% code coverage
