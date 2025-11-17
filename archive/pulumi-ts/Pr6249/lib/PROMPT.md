Hey team,

We need to build a serverless transaction processing system for a fintech startup that processes credit card transactions with PCI compliance requirements. The business is expecting peak loads of around 10,000 transactions per minute during busy periods, but things slow down considerably during off-hours. They want the infrastructure to scale automatically to handle these fluctuations while minimizing costs when traffic is low.

The compliance team has been pretty clear about PCI requirements - we need encryption at rest for all data stores, HTTPS endpoints only, and proper IAM controls with least-privilege access. The operations team also wants full visibility into the system with CloudWatch monitoring and X-Ray tracing enabled across all components.

We've been asked to build this using **Pulumi with TypeScript** and deploy it to the ap-southeast-1 region. The architecture needs to be fully serverless to keep operational overhead low and support the auto-scaling requirements. All transaction processing should happen asynchronously through queues to handle the high volume without overwhelming the system.

## What we need to build

Create a serverless transaction processing system using **Pulumi with TypeScript** for a fintech startup handling credit card transactions asynchronously with PCI compliance.

### Core Requirements

1. **API Layer**
   - API Gateway REST API with POST /transactions endpoint
   - HTTPS only for all API endpoints
   - Integrate with Lambda for transaction receiving

2. **Message Queue**
   - SQS queue named transaction-queue-{environmentSuffix}
   - 300 second visibility timeout
   - Server-side encryption enabled
   - Connect Lambda processors to queue

3. **Lambda Functions**
   - transaction-receiver: Receives POST requests from API Gateway
   - transaction-processor: Processes transactions from SQS queue
   - transaction-validator: Validates transaction data
   - All functions use Node.js 18.x runtime
   - All functions allocated 512MB memory
   - X-Ray tracing enabled on all functions

4. **Data Storage**
   - DynamoDB table named transactions-{environmentSuffix}
   - Partition key: transactionId
   - Sort key: timestamp
   - Encryption at rest enabled

5. **Notifications**
   - SNS topic named transaction-notifications-{environmentSuffix}
   - Used for transaction status updates

6. **Monitoring and Logging**
   - CloudWatch Logs with 30-day retention for all Lambda functions
   - CloudWatch Alarms for:
     - SQS queue depth (alert when messages pile up)
     - Lambda error rates (alert on processing failures)
     - API Gateway 4xx/5xx error rates

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **API Gateway** for REST API endpoints
- Use **SQS** for asynchronous message processing
- Use **Lambda** for compute (Node.js 18.x, 512MB memory)
- Use **DynamoDB** for transaction storage
- Use **SNS** for notifications
- Use **CloudWatch** for logging and monitoring
- Use **X-Ray** for distributed tracing
- Deploy to **ap-southeast-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{environmentSuffix}
- IAM roles must follow least-privilege principle for each Lambda

### Security and Compliance (PCI)

- DynamoDB encryption at rest enabled
- SQS queue server-side encryption enabled
- HTTPS endpoints only on API Gateway
- Least-privilege IAM roles for each Lambda function
- No hardcoded credentials or secrets in code

### Performance and Scalability

- System must handle 10,000 transactions per minute at peak load
- Lambda functions should auto-scale based on demand
- SQS queue acts as buffer during traffic spikes
- Asynchronous processing prevents API timeouts

### Infrastructure Best Practices

- All resources must be destroyable (no Retain deletion policies)
- Proper error handling and logging in Lambda functions
- CloudWatch alarms for proactive monitoring
- X-Ray tracing for debugging and performance analysis

## Success Criteria

- **Functionality**: API accepts transactions, queue processes them asynchronously, data persists in DynamoDB
- **Performance**: Handles 10,000 transactions/minute with auto-scaling
- **Reliability**: CloudWatch alarms alert on issues, X-Ray helps debug problems
- **Security**: PCI compliance with encryption, HTTPS, least-privilege IAM
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Code Quality**: TypeScript code, well-structured, documented, with unit tests

## What to deliver

- Complete Pulumi TypeScript implementation
- API Gateway REST API with /transactions endpoint
- Three Lambda functions (receiver, processor, validator) with Node.js 18.x
- SQS queue with encryption and proper timeout
- DynamoDB table with encryption and proper keys
- SNS topic for notifications
- IAM roles with least-privilege for each Lambda
- CloudWatch Logs with 30-day retention
- CloudWatch Alarms for monitoring
- X-Ray tracing configuration
- Unit tests for all Lambda handlers
- Documentation with deployment instructions
