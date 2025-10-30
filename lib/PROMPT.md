Hey team,

We've been asked to build a serverless payment webhook processing system for a fintech startup. They need something that can handle incoming transaction webhooks from multiple payment providers, store everything reliably, and generate daily audit reports. The system needs to be fully serverless to keep costs down and scale automatically with demand.

The business team has made it clear this needs to be production-ready from day one, with proper logging, monitoring, and security built in from the start. They're working with multiple payment providers who will POST transaction data to our API endpoint, and compliance wants daily reports stored in S3 for auditing purposes.

We're deploying this to the ap-southeast-2 region, and it needs to handle everything automatically without manual intervention once it's up and running.

## What we need to build

Create a serverless payment webhook processing system using **Pulumi with TypeScript** for the ap-southeast-2 region. This will handle incoming payment webhooks, store transaction data, and generate automated daily reports.

### Core Requirements

1. **Transaction Storage**
   - DynamoDB table for storing transaction records
   - Use partition key 'transactionId' and sort key 'timestamp'
   - Configure on-demand billing mode for cost efficiency

2. **Webhook Processing**
   - Lambda function to process incoming webhook payloads
   - Store processed data in DynamoDB table
   - Use Node.js 18.x runtime with 512 MB memory

3. **API Endpoint**
   - API Gateway REST API with POST endpoint '/webhook' that triggers the Lambda function
   - Enable API Gateway logging to CloudWatch
   - Implement rate limiting of 1000 requests per minute

4. **Request Validation**
   - API Gateway request validation on incoming payloads
   - Ensure required fields present: 'amount', 'currency', 'provider'
   - Return standardized JSON error responses with appropriate HTTP status codes

5. **Report Storage**
   - S3 bucket for storing daily transaction reports
   - Enable server-side encryption
   - Enable versioning on the bucket
   - Lifecycle policy to move reports to Glacier after 90 days

6. **Report Generation**
   - Scheduled Lambda function running daily at 2 AM UTC
   - Generate CSV reports from DynamoDB data
   - Store reports in S3 bucket
   - Use Node.js 18.x runtime with 512 MB memory

7. **Logging Configuration**
   - CloudWatch Log Groups for both Lambda functions
   - Set 7-day retention period for all logs

8. **IAM Configuration**
   - Appropriate IAM roles for Lambda functions
   - Policies allowing Lambda access to DynamoDB and S3
   - Follow principle of least privilege

9. **Monitoring and Visibility**
   - CloudWatch integration for all components
   - Enable detailed logging for troubleshooting

10. **Resource Tagging**
    - Add tags to all resources: 'Environment: production' and 'Project: payment-processor'

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **DynamoDB** for transaction storage with on-demand billing
- Use **Lambda** for serverless compute (Node.js 18.x, 512 MB memory)
- Use **API Gateway** for REST API endpoint with rate limiting
- Use **S3** for report archival with encryption and lifecycle policies
- Use **CloudWatch** for logging and monitoring
- Use **IAM** for security and access control
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **ap-southeast-2** region

### Constraints

- Lambda functions must use Node.js 18.x runtime
- All Lambda function memory must be set to 512 MB
- API Gateway must implement rate limiting of 1000 requests per minute
- API Gateway must return standardized JSON error responses
- DynamoDB table must use on-demand billing mode
- S3 bucket must have versioning enabled
- S3 lifecycle policy to move reports to Glacier after 90 days
- CloudWatch log retention set to 7 days
- All resources must be destroyable with no retention policies or deletion protection
- Include proper error handling in Lambda functions
- All resources must be tagged appropriately

## Success Criteria

- **Functionality**: Payment providers can POST transaction data to /webhook endpoint, data is stored in DynamoDB, daily reports are generated and stored in S3
- **Performance**: System handles up to 1000 requests per minute with proper rate limiting
- **Reliability**: All Lambda functions have proper error handling and CloudWatch logging
- **Security**: IAM roles follow least privilege, S3 encryption enabled, API validation enforced
- **Resource Naming**: All resources include environmentSuffix parameter for environment isolation
- **Destroyability**: All resources can be destroyed without manual intervention
- **Code Quality**: TypeScript code with proper types, well-structured, documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- DynamoDB table configuration with correct keys and billing mode
- Lambda function code for webhook processing (in lib/lambda/ or lib/functions/)
- Lambda function code for report generation (in lib/lambda/ or lib/functions/)
- API Gateway REST API with /webhook endpoint, validation, and rate limiting
- S3 bucket with encryption, versioning, and lifecycle policy
- CloudWatch Log Groups with retention policies
- IAM roles and policies for Lambda execution
- All resources properly tagged
- Integration between API Gateway, Lambda, DynamoDB, and S3
- Proper use of environmentSuffix in resource naming throughout
