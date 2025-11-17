Hey team,

We need to build a serverless transaction processing system for a financial services company that handles customer transaction data in real-time for fraud detection. The business is dealing with variable loads during peak trading hours and needs something that stays cost-efficient while maintaining reliability. I've been asked to create this using **AWS CDK with TypeScript** and deploy it to the us-east-1 region.

The system needs to process transactions through an API, validate them, store the data, and run asynchronous audit logging. Everything must be PCI DSS compliant, which means we need proper security controls, encryption, and monitoring throughout. The business also wants daily transaction summaries generated automatically.

## What we need to build

Create a serverless transaction processing system using **AWS CDK with TypeScript** for real-time fraud detection and audit logging.

### Core Requirements

1. **API Layer**
   - API Gateway REST API with /transactions POST endpoint
   - 10MB payload limit for transaction data
   - Edge-optimized endpoints with CloudFront distribution
   - Request validation using JSON schema
   - 10,000 requests/second burst limit throttling

2. **Transaction Processing**
   - Lambda function (processTransaction) for validation and database writes
   - ARM-based Graviton2 processors for cost optimization
   - Reserved concurrent executions of 100
   - Write validated transactions to DynamoDB

3. **Data Storage**
   - DynamoDB table (TransactionTable) with partition key 'transactionId' and sort key 'timestamp'
   - On-demand billing mode for variable workloads
   - Point-in-time recovery enabled for compliance

4. **Asynchronous Processing**
   - SQS queue (TransactionQueue) for audit processing
   - Lambda function (auditTransaction) triggered by SQS for audit logging
   - Dead letter queue with 14-day message retention

5. **Shared Dependencies**
   - Lambda layer with AWS SDK v3 and validation libraries
   - Layer shared across all Lambda functions

6. **Monitoring and Alerts**
   - CloudWatch alarms for Lambda errors (>1% error rate over 5 minutes)
   - Comprehensive logging for all components

7. **Report Storage**
   - S3 bucket for transaction reports
   - 90-day lifecycle policy to archive old reports
   - Server-side encryption enabled

8. **Scheduled Processing**
   - EventBridge rule for daily transaction summaries
   - Triggered at 2 AM UTC daily

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **API Gateway** for REST API endpoints
- Use **Lambda** with Graviton2 (ARM architecture) for compute
- Use **DynamoDB** for transaction storage with on-demand billing
- Use **SQS** for asynchronous message processing
- Use **S3** for report storage with lifecycle policies
- Use **EventBridge** for scheduled automation
- Use **CloudWatch** for monitoring and alarms
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-environment-suffix`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies)

### Security and Compliance

- PCI DSS compliance throughout
- Least-privilege IAM roles for all Lambda functions
- Encryption at rest for DynamoDB and S3
- Encryption in transit for all API communications
- API Gateway request validation to prevent malformed data
- Dead letter queues for failed message handling
- Proper error handling and logging for audit trails

### Performance Constraints

- Lambda reserved concurrent executions: 100
- API Gateway burst limit: 10,000 requests/second
- Lambda processors: ARM-based Graviton2
- DynamoDB on-demand billing for auto-scaling
- Point-in-time recovery for data protection

### Cost Optimization

- Serverless architecture throughout
- ARM-based Lambda functions for lower costs
- DynamoDB on-demand billing (no provisioned capacity)
- S3 lifecycle policies for automatic archival
- Lambda layers for shared dependencies (reduce deployment size)

## Success Criteria

- **Functionality**: API accepts POST requests, validates transactions, stores in DynamoDB, processes audit logs via SQS
- **Performance**: System handles 10,000 requests/second burst with reserved concurrency of 100
- **Reliability**: Dead letter queues capture failed messages, point-in-time recovery enabled
- **Security**: PCI DSS compliant with encryption at rest and in transit, least-privilege IAM
- **Monitoring**: CloudWatch alarms trigger on >1% error rate over 5 minutes
- **Automation**: Daily summaries generated at 2 AM UTC via EventBridge
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: TypeScript, well-tested, documented

## What to deliver

- Complete AWS CDK TypeScript implementation
- API Gateway REST API with request validation
- Two Lambda functions: processTransaction and auditTransaction
- Lambda layer with AWS SDK v3 and validation libraries
- DynamoDB table with on-demand billing and PITR
- SQS queue with dead letter queue
- S3 bucket with 90-day lifecycle policy
- EventBridge rule for daily scheduling
- CloudWatch alarms for error monitoring
- Unit tests for all components
- Integration tests for end-to-end workflows
- Documentation and deployment instructions
