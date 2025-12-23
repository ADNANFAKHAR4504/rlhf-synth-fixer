Hey team,

We need to build a serverless webhook processing system to handle real-time payment notifications from multiple payment providers. Our financial technology startup is growing fast and needs a reliable way to process these webhook events, transform them based on provider-specific formats, and maintain a proper audit trail for compliance. The business wants this infrastructure set up using **Terraform with HCL** to provision everything we need on AWS.

Right now, we're receiving webhooks from various payment providers like Stripe, PayPal, and Square. Each one has a different data format and we need to normalize everything before storing it. The webhooks hit our API Gateway endpoint, which forwards requests to Lambda for validation and transformation, then Lambda writes the normalized data to DynamoDB for persistent storage. The compliance team also requires full audit trails through CloudWatch Logs and monitoring dashboards that track the entire flow from API Gateway through Lambda to DynamoDB. We need this to be production-ready from day one.

The architecture should handle webhook validation, data transformation based on the provider, and orchestrate the whole process reliably. API Gateway receives incoming webhooks and routes them to Lambda for processing. Lambda validates signatures, transforms data, and stores results in DynamoDB. If Lambda processing fails, failed events are sent to SQS dead letter queue for investigation and replay. Step Functions coordinates the entire workflow from validation through storage.

## What we need to build

Create a serverless webhook processing infrastructure using **Terraform with HCL** that accepts webhooks from multiple payment providers, validates and transforms the data, and stores it reliably with full monitoring.

### Core Requirements

1. **API Gateway REST API**
   - Create REST API that accepts POST requests to dynamically handle incoming webhooks at the provider-specific endpoint
   - API Gateway that triggers Lambda function directly for webhook processing through Lambda proxy integration
   - Implement request validation using JSON schema
   - Set throttling limit at 1000 requests per minute
   - REST API integrated with Lambda for processing

2. **Lambda Functions**
   - Deploy Lambda function that receives events from API Gateway, validates webhook signatures, transforms provider-specific data formats, and writes normalized records to DynamoDB table
   - Lambda function that connects to SQS dead letter queue to send failed events for later replay
   - Use ARM64 architecture for cost optimization
   - Set reserved concurrent executions to prevent throttling
   - Encrypt environment variables with customer-managed KMS keys that protect sensitive configuration

3. **DynamoDB Storage**
   - Create table that stores processed webhook data from Lambda with partition key transaction_id and sort key timestamp
   - Enable point-in-time recovery for compliance requirements
   - DynamoDB table accessible through IAM permissions that grant Lambda write access

4. **Step Functions Orchestration**
   - Implement state machine that orchestrates the entire workflow by invoking Lambda for validation, triggering transformation logic, and coordinating writes to DynamoDB
   - Handle error states and retries
   - Provide workflow visibility

5. **Monitoring and Alerting**
   - Create CloudWatch dashboard that pulls metrics from API Gateway for latency, Lambda for error rates, and DynamoDB for throttles
   - Set up CloudWatch alarms that send notifications to SNS when Lambda error rate exceeds 1% over 5 minutes
   - Enable CloudWatch Logs integrated with KMS encryption for audit compliance

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **API Gateway REST API** for webhook endpoint
- Use **Lambda** with ARM64 architecture for processing
- Use **DynamoDB** for data storage with PITR enabled
- Use **Step Functions** for workflow orchestration
- Use **SQS** for Lambda dead letter queue
- Use **CloudWatch** for monitoring and alarms
- Use **KMS** customer-managed keys for encryption
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must include environmentSuffix variable for unique naming across deployments
- All resources must be destroyable (no Retain deletion policies, no deletion protection)
- No hardcoded resource names - use variables with suffix
- Include proper IAM roles and policies with least privilege
- Enable encryption at rest for all data stores
- Configure proper CloudWatch log retention

### Constraints

- Lambda functions must use ARM64 architecture for cost optimization
- DynamoDB tables must use point-in-time recovery for compliance
- All Lambda environment variables must be encrypted with customer-managed KMS keys
- API Gateway must implement request throttling at 1000 requests per minute
- Lambda functions must have reserved concurrent executions set to prevent throttling
- CloudWatch Log groups must have KMS encryption enabled
- Deploy to us-east-1 region only
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: API Gateway accepts webhooks, Lambda validates and transforms data, DynamoDB stores results
- **Performance**: API responds within acceptable latency, proper throttling configured
- **Reliability**: Step Functions orchestrates workflow, failed events go to DLQ
- **Security**: KMS encryption for environment variables and logs, proper IAM roles
- **Monitoring**: CloudWatch dashboard and alarms provide visibility
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be destroyed without errors
- **Code Quality**: HCL, well-structured, documented

## What to deliver

- Complete Terraform configuration in HCL
- Variables file with environmentSuffix parameter
- All AWS services: API Gateway REST API, Lambda functions, DynamoDB table, Step Functions state machine, SQS queue, CloudWatch dashboard and alarms, KMS keys, IAM roles and policies
- Proper resource naming with environment suffix
- Unit tests for infrastructure validation
- Documentation and deployment instructions in README.md
