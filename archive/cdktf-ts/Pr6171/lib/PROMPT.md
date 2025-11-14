Hey team,

We need to build a serverless payment processing system for a fintech startup that handles credit card transactions in real-time while maintaining PCI compliance. The business has asked us to create this infrastructure to support variable transaction volumes throughout the day, with peaks during business hours. All sensitive data must be encrypted at rest and in transit, with proper audit logging in place.

I've been tasked with setting up the infrastructure for this payment processing platform. We need to handle real-time credit card transactions with high reliability, security, and compliance standards. The system needs to scale automatically based on load and provide comprehensive monitoring and alerting capabilities.

The business requirements are pretty clear - we need a REST API for transaction processing, asynchronous message queuing for reliability, persistent storage for transaction records, and notification capabilities for payment events. Everything needs to be serverless to handle the variable load efficiently while keeping costs under control.

## What we need to build

Create a serverless payment processing infrastructure using **CDKTF with TypeScript** for a production fintech application.

### Core Requirements

1. **API Gateway REST API**
   - Configure /transactions and /status endpoints
   - Enable CORS with wildcard origin (*) for maximum compatibility
   - Set up API Gateway stage variables for prod environment
   - Disable caching on the prod stage
   - Configure request throttling at 10,000 requests per second
   - Enable X-Ray tracing on all API Gateway stages
   - Default region fallback should be eu-central-1 for API Gateway configuration

2. **Lambda Functions**
   - Create transaction processing Lambda function
   - Create status checking Lambda function
   - Configure environment variables for all Lambda functions
   - Set minimum 512MB memory allocation for all functions
   - Use reserved concurrent executions to ensure consistent performance
   - Enable X-Ray tracing on all Lambda functions
   - All Lambda functions must be deployed in private subnets within a VPC

3. **DynamoDB Table**
   - Create table named 'payment-transactions'
   - Configure partition key as 'transaction_id'
   - Configure sort key as 'timestamp'
   - Use on-demand billing mode
   - Enable point-in-time recovery
   - Enable encryption at rest using AWS KMS customer-managed keys

4. **SQS FIFO Queue**
   - Create FIFO queue named 'transaction-queue.fifo'
   - Set message retention to 14 days
   - Enable message deduplication for transaction processing
   - Queue is used for audit trail and asynchronous logging (no consumer required)

5. **SNS Topic**
   - Implement SNS topic for payment notifications
   - Configure email subscription endpoint (admin@example.com is acceptable for development)

6. **IAM Roles and Policies**
   - Create IAM roles with least-privilege policies for each Lambda function
   - Separate roles for transaction processing and status checking functions
   - Grant only necessary permissions for DynamoDB, SQS, SNS, and CloudWatch access

7. **CloudWatch Logging and Monitoring**
   - Configure CloudWatch Log Groups with 30-day retention for all Lambda functions
   - Create CloudWatch dashboard displaying Lambda invocations, errors, and DynamoDB metrics
   - Implement CloudWatch alarms for Lambda errors with absolute threshold of 1 error
   - Default region fallback should be eu-central-1 for CloudWatch metrics configuration

8. **VPC Configuration**
   - Deploy all Lambda functions within a VPC with private subnets
   - Configure appropriate security groups
   - VPC endpoints (DynamoDB, S3) should be associated with public route table for cost optimization
   - Lambda functions in private subnets will route through VPC endpoints via the VPC's routing infrastructure

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **API Gateway** for REST API endpoints with throttling and wildcard CORS
- Use **AWS Lambda** for serverless compute with VPC deployment and X-Ray tracing
- Use **Amazon DynamoDB** for transaction storage with on-demand billing and point-in-time recovery
- Use **Amazon SQS FIFO** for reliable message queuing with 14-day retention
- Use **Amazon SNS** for notification delivery
- Use **AWS KMS** customer-managed keys for all encryption operations
- Use **Amazon CloudWatch** for logging, monitoring, dashboards, and alarms
- Use **Amazon VPC** for network isolation of Lambda functions
- Deploy to **us-east-1** region (with eu-central-1 as fallback for API Gateway and CloudWatch configuration)
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- All resources must be destroyable (no Retain policies, set skip_final_snapshot where applicable)
- Include proper error handling and logging throughout

### Constraints

- Lambda functions must have reserved concurrent executions for consistent performance
- DynamoDB must use on-demand billing with point-in-time recovery enabled
- API Gateway request throttling must be set to 10,000 requests per second
- SQS FIFO queues must have message deduplication enabled
- X-Ray tracing must be enabled on all Lambda functions and API Gateway stages
- CloudWatch alarms must trigger for Lambda errors with absolute threshold of 1 error
- All encryption must use AWS KMS customer-managed keys
- Lambda functions must have minimum 512MB memory allocation
- Lambda functions must be deployed in VPC private subnets
- CloudWatch Log Groups must have 30-day retention
- All resources must support automatic cleanup (no deletion protection)
- All resource names must include environmentSuffix to prevent naming conflicts

## Success Criteria

- **Functionality**: All endpoints operational with proper error handling
- **Performance**: API Gateway throttling configured, Lambda memory allocation optimized, reserved concurrency set
- **Reliability**: SQS FIFO queue with 14-day retention, DynamoDB point-in-time recovery enabled
- **Security**: KMS encryption for all data at rest, VPC isolation for Lambda functions, least-privilege IAM policies
- **Monitoring**: CloudWatch dashboards with key metrics, alarms for error thresholds, 30-day log retention
- **Resource Naming**: All resources include environmentSuffix following the pattern {resource-type}-{environmentSuffix}
- **Code Quality**: TypeScript, well-structured CDKTF code, proper error handling, comprehensive documentation
- **Observability**: X-Ray tracing enabled on Lambda functions and API Gateway for distributed tracing
- **Destroyability**: All resources can be cleaned up automatically without manual intervention

## What to deliver

- Complete CDKTF TypeScript implementation with modular stack structure
- API Gateway REST API with /transactions and /status endpoints, wildcard CORS, and throttling
- Lambda functions for transaction processing and status checking with VPC deployment
- DynamoDB table for payment-transactions with on-demand billing and point-in-time recovery
- SQS FIFO queue for transaction-queue.fifo with 14-day retention
- SNS topic for payment notifications with email subscription
- IAM roles and policies with least-privilege access
- CloudWatch Log Groups with 30-day retention
- CloudWatch dashboard with Lambda and DynamoDB metrics
- CloudWatch alarms for Lambda error thresholds
- VPC configuration with private subnets for Lambda functions
- KMS customer-managed keys for encryption
- X-Ray tracing configuration
- Unit tests for all components
- Documentation and deployment instructions in README.md
