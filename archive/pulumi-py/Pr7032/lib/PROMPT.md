# Webhook Processing Infrastructure for Financial Transactions

Hey team,

We have a fintech startup that needs to process real-time transaction notifications from their payment gateway. Right now they're receiving webhook events from the payment gateway, but they don't have infrastructure to handle these reliably. I've been asked to build this using **Pulumi with Python** to deploy everything on AWS.

The business requirement is pretty straightforward - when a webhook comes in with transaction data, we need to validate it, store it in a database for compliance reporting, and make sure everything is properly monitored and secured. Since this is financial data, security and compliance are non-negotiable. The system needs to be serverless to keep costs down and handle variable load patterns.

The current pain point is that without this infrastructure, they're missing transaction notifications, have no audit trail for compliance, and can't monitor what's happening with their payment processing. This is blocking their ability to launch their product.

## What we need to build

Create a serverless webhook processing system using **Pulumi with Python** for handling financial transaction notifications from a payment gateway.

### Core Requirements

1. **API Gateway REST Endpoint**
   - Create REST API with POST endpoint at /webhook path
   - Implement usage plan with rate limiting at 1000 requests per minute
   - Must handle incoming webhook payloads from payment gateway

2. **Lambda Function for Processing**
   - Validate incoming webhook payloads
   - Store valid transactions in DynamoDB
   - Use Node.js 18.x runtime with 1024MB memory
   - Set reserved concurrent executions to 100
   - Enable X-Ray tracing for performance monitoring

3. **DynamoDB Table for Storage**
   - Table named 'transactions'
   - Partition key: 'transactionId' (string)
   - Sort key: 'timestamp' (number)
   - On-demand billing mode
   - Point-in-time recovery enabled
   - Deletion protection disabled for development

4. **IAM Permissions**
   - Lambda role with least privilege permissions
   - Write access to DynamoDB transactions table
   - Write access to CloudWatch Logs
   - No wildcard permissions allowed

5. **Monitoring and Logging**
   - CloudWatch Log groups with 30-day retention
   - X-Ray tracing enabled on all Lambda functions
   - Proper logging of all function executions

6. **Security Configuration**
   - Lambda environment variables encrypted with KMS
   - Sensitive data must use KMS encryption
   - Follow security best practices for financial data

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **API Gateway** for webhook endpoint
- Use **Lambda** for serverless compute
- Use **DynamoDB** for transaction storage
- Use **CloudWatch** for logging and monitoring
- Use **X-Ray** for distributed tracing
- Use **KMS** for encryption of sensitive data
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain deletion policies)
- All resources must include environmentSuffix in names for multi-environment support
- All resources must be tagged with: Environment, Team, and CostCenter tags
- Lambda functions must use Node.js 18.x runtime (aws-sdk is NOT bundled in Node.js 18+, must be included if needed)

### Resource Configuration Details

- Lambda memory: 1024MB
- Lambda concurrent executions: 100 (reserved)
- Lambda runtime: Node.js 18.x
- CloudWatch Logs retention: 30 days
- API Gateway rate limit: 1000 requests/minute
- DynamoDB billing: on-demand mode
- DynamoDB point-in-time recovery: enabled
- DynamoDB deletion protection: disabled
- X-Ray tracing: enabled on all Lambda functions

### Constraints

- Lambda functions must use Node.js 18.x runtime with 1024MB memory
- DynamoDB must use on-demand billing with point-in-time recovery
- IAM roles must follow least privilege with no wildcards
- Lambda environment variables must use KMS encryption
- API Gateway must implement usage plans with rate limiting
- CloudWatch Logs retention must be 30 days
- DynamoDB deletion protection must be disabled for dev
- Lambda reserved concurrent executions must be 100
- All resources tagged with Environment, Team, CostCenter

## Success Criteria

- **Functionality**: API Gateway receives webhooks, Lambda validates and stores to DynamoDB
- **Performance**: System handles 1000 requests/minute with proper rate limiting
- **Reliability**: X-Ray tracing enabled for monitoring, CloudWatch logs captured
- **Security**: KMS encryption for sensitive data, least privilege IAM roles
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Python code, well-structured, properly configured.

## What to deliver

- Complete Pulumi Python implementation
- API Gateway REST API with /webhook endpoint
- Lambda function for webhook processing (Node.js 18.x)
- DynamoDB transactions table with specified schema
- IAM roles with appropriate permissions
- CloudWatch Log groups with 30-day retention
- X-Ray tracing configuration
- KMS encryption for Lambda environment variables
- Usage plan with rate limiting
- Resource tagging (Environment, Team, CostCenter)
- Deployment instructions
