Hey team,

We need to migrate our payment webhook processing system from on-premises to AWS serverless infrastructure. The fintech startup I'm working with processes webhook callbacks from payment providers, and they need a solid, scalable solution that can handle this during migration without any downtime. The critical part is maintaining data consistency while moving from the legacy system to the cloud.

The current setup handles webhook notifications from payment providers like Stripe, PayPal, and others, validates the incoming requests, and stores transaction records. During this migration phase, we need to set up the AWS infrastructure that will eventually replace the legacy system. The team wants to start with a single-AZ deployment to keep costs low during testing, then we'll scale out once we validate the data consistency.

I've been looking at the AWS serverless stack and I think we can build this using **Pulumi with TypeScript**. The combination gives us strong typing and the ability to manage infrastructure as actual code with all the benefits of IDE support and compile-time checks.

## What we need to build

Create a payment webhook processing system using **Pulumi with TypeScript** that handles webhook callbacks from payment providers with secure storage and comprehensive monitoring.

### Core Requirements

1. **Webhook Processing Function**
   - Lambda function named 'envmig-webhook-prod' with 512MB memory
   - Configure Lambda function URL with AWS_IAM authentication
   - Enable X-Ray tracing for performance monitoring during migration
   - Process incoming webhook payloads from payment providers

2. **Data Storage**
   - DynamoDB table 'envmig-transactions-prod' with on-demand billing
   - Store transaction records from webhook processing
   - Support high-throughput writes without provisioning capacity

3. **Security and Secrets Management**
   - Store payment provider API keys in Secrets Manager as 'envmig-apikeys-prod'
   - IAM roles with least-privilege access
   - Lambda can only read from Secrets Manager and write to DynamoDB
   - Function URL secured with AWS_IAM auth type

4. **Monitoring and Logging**
   - CloudWatch Logs group '/aws/lambda/envmig-webhook-prod' with 7-day retention
   - X-Ray tracing enabled on Lambda for migration performance analysis
   - Proper logging for debugging during migration phase

5. **Resource Outputs and Tagging**
   - Export Lambda function URL for webhook configuration
   - Export DynamoDB table ARN for reference
   - Tag all resources with Environment=prod and MigrationPhase=testing

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use AWS Lambda with 512MB memory for webhook processing
- DynamoDB on-demand billing mode for flexible scaling
- Secrets Manager for storing payment provider API credentials
- CloudWatch Logs retention set to exactly 7 days
- Deploy to **us-east-1** region with single-AZ configuration
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming pattern: envmig-{service}-{environment}
- All resources must be destroyable (no Retain policies)

### Deployment Requirements (CRITICAL)

1. **Resource Naming**:
   - ALL resources MUST include environmentSuffix parameter
   - Use pattern: `{resource-name}-${environmentSuffix}`
   - Example: `envmig-webhook-${environmentSuffix}` instead of hardcoded 'envmig-webhook-prod'
   - This allows multiple deployments in same account without conflicts

2. **Destroyability**:
   - NO resources should have Retain deletion policies
   - Use DELETE (Pulumi) retention policy for all resources
   - Infrastructure must be completely removable via pulumi destroy

3. **Lambda Runtime**:
   - Use Node.js 18.x or higher for Lambda runtime
   - Node.js 18+ does NOT include AWS SDK v2 by default
   - Lambda functions using AWS SDK must import from aws-sdk or @aws-sdk packages

### Constraints

- Single-AZ deployment to minimize costs during migration testing
- CloudWatch Logs retention must be exactly 7 days (not 14, not 30)
- Use Lambda function URLs instead of API Gateway for simplicity
- IAM policies must follow least-privilege principle
- All AWS service names must be specified in resource names for clarity
- Include proper error handling in Lambda function code

### Optional Enhancements

If time permits, these would be valuable additions:
- SQS queue for buffering high webhook volumes during traffic spikes
- SNS topic for migration alerts to notify team of issues
- EventBridge rule for scheduled data validation checks

## Success Criteria

- **Functionality**: Lambda receives webhooks, validates them, stores in DynamoDB
- **Security**: API keys in Secrets Manager, IAM roles properly scoped
- **Monitoring**: CloudWatch Logs and X-Ray capturing all requests
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Destroyability**: Full stack can be destroyed cleanly with pulumi destroy
- **Code Quality**: TypeScript code with proper types, error handling, and documentation
- **Testing**: Unit tests for Lambda handler and infrastructure validation

## What to deliver

- Complete Pulumi TypeScript implementation
- Lambda function with webhook processing logic
- DynamoDB table for transaction storage
- Secrets Manager secret for API keys
- IAM roles and policies
- CloudWatch Logs configuration
- X-Ray tracing setup
- Stack outputs for function URL and table ARN
- Unit tests for all components
- Documentation for deployment and configuration