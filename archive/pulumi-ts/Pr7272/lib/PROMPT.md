# Payment Webhook Processing System

Hey team,

We've been asked by a financial technology startup to build a robust serverless event processing system that can handle real-time payment notifications from multiple payment providers. The business needs a system that can receive webhook events, validate payment signatures, and trigger downstream workflows based on payment status. They're looking for something that's highly available, cost-effective, and can scale automatically with their payment volume.

The challenge here is that payment webhooks can arrive at any time and in high volumes, especially during peak shopping seasons. The system needs to accept these webhooks immediately, validate their authenticity, store the events reliably, and then process them asynchronously through a workflow that can retry failed payments intelligently. The startup is particularly concerned about security, given they're handling financial data, and they want complete observability into the system's behavior.

I've been asked to create this using **Pulumi with TypeScript** for our infrastructure as code approach. The team has specifically requested we use ARM-based processors for cost optimization, implement proper encryption for sensitive data, and ensure we have distributed tracing across all components so they can troubleshoot issues quickly.

## What we need to build

Create a serverless payment webhook processing pipeline using **Pulumi with TypeScript** that receives payment notifications via API Gateway, validates them with Lambda, stores events in DynamoDB, and processes them through a Step Functions workflow.

### Core Requirements

1. **API Gateway REST API**
   - Create a REST API with a /webhooks endpoint accepting POST requests
   - Deploy the API to a stage with proper configuration
   - Enable X-Ray tracing on the API Gateway stage for observability

2. **Webhook Validation Lambda**
   - Deploy a Lambda function using Node.js 18 runtime on ARM64 architecture
   - Function must validate webhook signatures and store events in DynamoDB
   - Configure reserved concurrent executions to prevent throttling
   - Enable X-Ray tracing for distributed tracing
   - Encrypt environment variables using customer-managed KMS key

3. **DynamoDB Event Storage**
   - Create a DynamoDB table with partition key 'paymentId' and sort key 'timestamp'
   - Enable point-in-time recovery for disaster recovery
   - Enable encryption at rest for data protection
   - Enable DynamoDB Streams to trigger downstream processing

4. **Step Functions State Machine**
   - Implement a state machine that processes payment events with business logic
   - Include exponential backoff retry logic for failed payments
   - Define proper error handling for various failure scenarios
   - Integrate with Lambda for payment processing logic

5. **Payment Processor Lambda**
   - Deploy a Lambda function to execute payment processing within Step Functions
   - Use Node.js 18 runtime on ARM64 architecture
   - Configure reserved concurrent executions
   - Enable X-Ray tracing
   - Encrypt environment variables with customer-managed KMS key

6. **EventBridge Integration**
   - Create an EventBridge rule that monitors DynamoDB Streams
   - Configure the rule to trigger Step Functions execution on new items
   - Set up proper event pattern matching

7. **KMS Encryption**
   - Create a customer-managed KMS key for encrypting Lambda environment variables
   - Configure proper key policies for Lambda service access
   - Enable key rotation for security best practices

8. **IAM Security**
   - Create IAM roles following least privilege principle
   - Define specific permissions without wildcard actions
   - Grant only necessary permissions for each service

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **API Gateway** for webhook endpoint
- Use **Lambda** (2 functions: webhook validator and payment processor)
- Use **DynamoDB** with streams enabled for event storage
- Use **Step Functions** for orchestration with retry logic
- Use **EventBridge** for event-driven triggering
- Use **KMS** for customer-managed encryption keys
- Use **X-Ray** for distributed tracing across all components
- Use **IAM** for role-based access control
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies) - use RemovalPolicy.DESTROY or equivalent
- All Lambda functions must use ARM64 architecture (Graviton2 processors)
- All Lambda functions must have reserved concurrent executions configured
- DynamoDB table must have point-in-time recovery enabled
- Lambda environment variables must be encrypted with customer-managed KMS key
- X-Ray tracing must be enabled on all Lambda functions and API Gateway
- Step Functions must implement exponential backoff retry logic
- All IAM policies must follow least privilege with NO wildcard actions

### Constraints

- Lambda functions must use ARM-based Graviton2 processors for cost optimization
- DynamoDB tables must use point-in-time recovery and encryption at rest
- All Lambda functions must have reserved concurrent executions configured
- Use Pulumi's native AWS provider without AWS SDK imports in infrastructure code
- Lambda environment variables must be encrypted with a customer-managed KMS key
- Enable X-Ray tracing on all Lambda functions and API Gateway stages
- Implement exponential backoff retry logic in Step Functions state machine
- All IAM policies must follow least privilege principle with no wildcard actions
- All resources must be destroyable for testing purposes
- Include proper error handling and logging in Lambda functions

## Success Criteria

- **Functionality**: API Gateway endpoint accepts webhooks, Lambda validates and stores them, Step Functions processes events with retry logic
- **Architecture**: Serverless architecture using ARM64 Lambda functions for cost efficiency
- **Security**: Customer-managed KMS encryption, least privilege IAM policies, DynamoDB encryption at rest
- **Observability**: X-Ray tracing enabled across all components for distributed tracing
- **Reliability**: DynamoDB point-in-time recovery, Step Functions retry logic, reserved Lambda concurrency
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Clean TypeScript, well-tested, comprehensive documentation

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- API Gateway REST API with /webhooks endpoint
- Lambda webhook validator function code (Node.js 18, ARM64)
- Lambda payment processor function code (Node.js 18, ARM64)
- DynamoDB table with partition key, sort key, streams, PITR, and encryption
- Step Functions state machine with exponential backoff retry logic
- EventBridge rule connecting DynamoDB Streams to Step Functions
- Customer-managed KMS key for Lambda environment variable encryption
- IAM roles and policies following least privilege principle
- Pulumi exports for API Gateway endpoint URL and Step Functions ARN
- Unit tests for all components
- Documentation with deployment instructions
