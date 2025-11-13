# Serverless Payment Webhook Processing System

Hey team,

We need to build a serverless payment webhook processing system for a fintech startup. They're receiving high-volume transaction notifications from multiple payment providers and need a robust infrastructure that can handle these webhooks asynchronously, store transaction records securely, and provide real-time analytics. The whole setup needs to meet PCI compliance standards which means encryption, proper IAM controls, and audit trails. I've been asked to create this infrastructure using **Pulumi with Python** for the us-east-2 region.

The business has been dealing with webhook timeouts and lost transactions because they don't have a proper processing pipeline. They need something that can scale automatically, handle failures gracefully with retry mechanisms, and give them visibility into what's happening with their payment data. Since this is payment processing, every transaction needs to be logged and auditable.

## What we need to build

Create a serverless webhook processing system using **Pulumi with Python** that handles payment notifications from multiple providers with built-in analytics and audit capabilities.

### Core Requirements

1. **API Gateway Setup**
   - Create REST API with /webhook POST endpoint
   - Implement API key validation for security
   - Enable request logging to CloudWatch

2. **Webhook Processing**
   - Deploy Lambda function to process incoming webhooks
   - Write transaction records to DynamoDB
   - Python 3.9 runtime with 512MB memory

3. **Data Storage**
   - DynamoDB table with partition key 'transaction_id' and sort key 'timestamp'
   - On-demand billing mode with point-in-time recovery
   - Enable DynamoDB Streams for change data capture.

4. **Analytics Pipeline**
   - Lambda function triggered by DynamoDB Streams
   - Process transaction analytics in real-time
   - Batch size of exactly 100 records per invocation

5. **Audit Logging**
   - S3 bucket with encryption for transaction audit logs
   - Versioning enabled for compliance
   - Lifecycle policy for 90-day retention

6. **Error Handling**
   - SQS dead letter queues for failed Lambda invocations
   - CloudWatch alarms when Lambda errors exceed 1% error rate
   - Proper retry mechanisms

7. **Archival Process**
   - Lambda function for daily archival of old transactions
   - Move processed transactions from DynamoDB to S3
   - Reduce storage costs while maintaining audit trail

8. **IAM Security**
   - Separate execution roles for each Lambda function
   - Least privilege principle with explicit resource ARNs
   - No wildcard permissions

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Deploy to **us-east-2** region
- Resource names must include **environment_suffix** for uniqueness across deployments
- Follow naming convention: `f"{resource_type}_{environment_suffix}"`
- All Lambda functions use Python 3.9 runtime with 512MB memory allocation
- API Gateway throttling at 10,000 requests per second
- CloudWatch Log Groups with 30-day retention
- All resources must be destroyable (no Retain policies)

### Constraints

- Lambda reserved concurrent executions: Set conservatively (1-5) to avoid account limit issues
- DynamoDB must use on-demand billing for cost efficiency
- S3 buckets require server-side encryption
- All resources tagged with Environment, Project, and CostCenter
- PCI compliance requirements for payment data handling
- Include proper error handling and logging throughout
- CloudWatch monitoring for all Lambda functions

## Success Criteria

- **Functionality**: All 10 infrastructure requirements implemented and working
- **Performance**: API Gateway can handle 10,000 req/sec, Lambda processes efficiently
- **Reliability**: Dead letter queues capture failures, alarms notify on errors
- **Security**: Encryption at rest, IAM least privilege, API key authentication
- **Resource Naming**: All resources include environment_suffix for deployment isolation
- **Code Quality**: Clean Python code, well-tested, documented, follows AWS best practices
- **Compliance**: Audit logging, versioning, retention policies meet PCI standards

## What to deliver

- Complete Pulumi Python implementation in lib/tap_stack.py
- Lambda function code:
  - webhook_processor.py for processing incoming webhooks
  - analytics_processor.py for DynamoDB Stream processing
  - archival_function.py for daily archival to S3
- IAM roles and policies for Lambda execution
- API Gateway with /webhook endpoint
- DynamoDB table with Streams enabled
- S3 bucket with encryption and lifecycle
- SQS dead letter queues
- CloudWatch alarms and log groups
- Stack outputs: API endpoint URL, DynamoDB table name, S3 bucket name
- Unit tests with 90%+ coverage
- Documentation and deployment instructions
