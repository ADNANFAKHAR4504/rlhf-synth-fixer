Hey team,

We need to build a serverless payment webhook processing system for a financial services company that handles credit card transaction webhooks from multiple payment providers. The business is experiencing variable loads during peak shopping seasons and needs a solution that maintains PCI compliance standards while keeping operational costs minimal.

The company processes transaction webhooks in real-time and needs infrastructure that can scale automatically without manual intervention. They want to store processed transactions securely with encryption at rest, maintain detailed logs for compliance auditing, and ensure the system can handle high throughput during peak times without throttling.

I've been asked to create this infrastructure using **CloudFormation with JSON**. The system needs to be production-ready with proper security controls, monitoring capabilities, and cost optimization built in from the start.

## What we need to build

Create a serverless payment webhook processing system using **CloudFormation with JSON** that handles credit card transaction webhooks with automatic scaling, encryption, and compliance features.

### Core Requirements

1. **Lambda Function Configuration**
   - Create Lambda function with ARM architecture for cost optimization using arm64
   - Configure 1GB memory allocation for webhook processing workloads
   - Set function timeout to 30 seconds to handle payment processing delays
   - Enable X-Ray tracing for observability and performance monitoring
   - Set reserved concurrent executions to 100 to prevent throttling during peak loads

2. **DynamoDB Transaction Storage**
   - Create DynamoDB table with partition key 'transactionId' for transaction storage
   - Configure on-demand billing mode for cost optimization with variable workloads
   - Enable point-in-time recovery for data protection and compliance
   - Enable server-side encryption at rest for PCI compliance

3. **Security and Encryption**
   - Configure Lambda environment variables encrypted with KMS for sensitive data
   - Implement IAM execution role with least privilege permissions
   - Grant Lambda permissions to write to DynamoDB and CloudWatch Logs only
   - Enable encryption on all data stores including DynamoDB and CloudWatch Logs

4. **Monitoring and Logging**
   - Create CloudWatch Log Group with 30-day retention period
   - Enable KMS encryption on log group for compliance requirements
   - Configure Lambda to output structured logs for transaction tracking
   - Enable X-Ray tracing on Lambda for distributed request tracking

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **Lambda** with ARM-based Graviton2 processors in arm64 architecture
- Use **DynamoDB** for transaction storage with partition key 'transactionId'
- Use **IAM** for execution role with specific permissions to DynamoDB table ARN and CloudWatch Logs
- Use **CloudWatch Logs** with 30-day retention and KMS encryption
- Use **KMS** for encrypting Lambda environment variables and CloudWatch logs
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type with EnvironmentSuffix
- Deploy to **us-east-1** region

### Deployment Requirements - CRITICAL

All resources must be configured for easy teardown after testing:

- **Destroyability**: All resources must be destroyable without manual intervention
- **No Retain Policies**: Do not use DeletionPolicy Retain on any resources
- **No Protection Flags**: Do not enable deletion protection on any resources
- **environmentSuffix Parameter**: ALL named resources must include the EnvironmentSuffix parameter for uniqueness across parallel deployments
- **Naming Pattern**: Use Sub intrinsic function with resource-name concatenated with EnvironmentSuffix for all named resources

### Constraints

- Lambda functions must use ARM-based Graviton2 processors in arm64 architecture for cost optimization
- DynamoDB tables must use point-in-time recovery and encryption at rest for compliance
- All Lambda environment variables containing sensitive data must be encrypted with KMS
- CloudWatch log groups must have a retention period of 30 days and be encrypted with KMS
- Lambda functions must have reserved concurrency set to 100 to prevent throttling
- Lambda functions must have X-Ray tracing enabled for observability
- All resources must be destroyable without Retain policies or deletion protection
- IAM roles must use specific DynamoDB table ARN and CloudWatch log group ARN in policy statements

## Success Criteria

- **Functionality**: Lambda processes webhook events and stores transactions in DynamoDB successfully
- **Performance**: System handles 100 concurrent webhook requests without throttling
- **Reliability**: Point-in-time recovery enabled on DynamoDB for data protection
- **Security**: All data encrypted at rest and in transit, IAM least privilege enforced
- **Resource Naming**: All resources include EnvironmentSuffix for deployment isolation
- **Observability**: CloudWatch Logs capture all Lambda executions, X-Ray tracing enabled
- **Compliance**: 30-day log retention meets audit requirements, KMS encryption enabled
- **Cost Optimization**: ARM architecture and on-demand billing minimize operational costs

## What to deliver

- Complete CloudFormation JSON template with all required resources
- Lambda function with ARM architecture, 1GB memory, 30-second timeout, reserved concurrency 100
- DynamoDB table with 'transactionId' partition key, on-demand billing, point-in-time recovery
- IAM execution role with specific DynamoDB and CloudWatch permissions for Lambda
- CloudWatch Log Group with 30-day retention and KMS encryption
- KMS key for encrypting Lambda environment variables and CloudWatch logs
- Lambda environment variable for DynamoDB table name encrypted with KMS
- Stack outputs for Lambda function ARN and DynamoDB table name
- All resources include EnvironmentSuffix for uniqueness
- Documentation with deployment instructions and architecture overview
