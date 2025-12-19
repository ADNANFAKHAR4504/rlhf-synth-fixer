# Payment Webhook Processing System Migration

Hey team,

We have a fintech startup that needs to migrate their payment processing infrastructure from a legacy on-premises setup to AWS. Their current system handles webhook callbacks from payment providers and stores transaction records in an old database. The business requirement is clear: we need zero downtime during migration and must ensure complete data consistency during the transition. The team has decided to modernize by going fully serverless.

The existing on-premises system is starting to show its age with scalability issues during peak payment periods. The company wants to leverage AWS managed services to reduce operational overhead and improve reliability. They also need better observability into the payment processing pipeline to troubleshoot issues faster.

This migration is critical because it processes real money transactions. Any data loss or downtime could impact customer trust and revenue. The plan is to run both systems in parallel during the migration phase with a gradual cutover approach.

## What we need to build

Create a serverless payment webhook processing infrastructure using **Pulumi with Python** for AWS deployment.

### Core Requirements

1. **Lambda Functions**
   - Create Lambda function 'envmig-webhook-prod' with 512MB memory for webhook processing
   - Configure Lambda function URL with AWS_IAM authentication
   - Enable X-Ray tracing for migration performance monitoring

2. **Data Storage**
   - Create DynamoDB table 'envmig-transactions-prod' with on-demand billing
   - Store transaction records with fast query capabilities

3. **Security and Access**
   - Store payment provider API keys in Secrets Manager as 'envmig-apikeys-prod'
   - Implement IAM roles with least-privilege access
   - Lambda can only read secrets and write to DynamoDB

4. **Observability**
   - Configure CloudWatch Logs group '/aws/lambda/envmig-webhook-prod' with 7-day retention
   - Enable X-Ray tracing on Lambda functions

5. **Stack Outputs**
   - Export Lambda function URL for webhook configuration
   - Export DynamoDB table ARN for reference

6. **Resource Tagging**
   - Tag all resources with Environment=prod
   - Tag all resources with MigrationPhase=testing

### Optional Enhancements

- Add SQS queue for buffering high webhook volumes during peak periods
- Implement SNS topic for migration alerts and notifications
- Add EventBridge rule for scheduled data validation checks

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **AWS Lambda** with 512MB memory for webhook processing
- Use **DynamoDB** with on-demand billing for transaction storage
- Use **Secrets Manager** for secure API credential storage
- Use **CloudWatch Logs** with exactly 7-day retention
- Enable **X-Ray** tracing for distributed tracing
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: envmig-{service}-{environment}
- Deploy to **us-east-1** region

## Deployment Requirements (CRITICAL)

### environmentSuffix Requirement
All resources MUST include the environmentSuffix parameter in their names to ensure uniqueness across deployments. This allows multiple environments to coexist without naming conflicts. The suffix is passed from the environment and must be used consistently.

### Destroyability Requirement
All resources MUST be fully destroyable without retention policies. Do NOT use RETAIN or SNAPSHOT policies on any resources. This is a testing/migration environment where we need clean teardown capability.

### Lambda Considerations
For Node.js 18+ runtime, the AWS SDK v3 is included by default. Lambda functions should not bundle AWS SDK if using standard services.

## Constraints

- AWS Lambda with 512MB memory allocation
- DynamoDB with on-demand billing mode
- Lambda function URL with AWS_IAM authentication type
- Secrets Manager for API credentials
- CloudWatch Logs retention exactly 7 days
- Region us-east-1
- Single-AZ deployment initially
- X-Ray tracing enabled
- Pulumi stack outputs for endpoints and ARNs

## Success Criteria

- Functionality: Lambda receives webhooks via function URL, validates authentication, stores to DynamoDB
- Performance: Lambda cold start under 2 seconds, DynamoDB writes under 100ms
- Reliability: Zero data loss during webhook processing, proper error handling
- Security: IAM least-privilege, secrets in Secrets Manager, AWS_IAM auth on function URL
- Resource Naming: All resources include environmentSuffix in names
- Observability: CloudWatch Logs with 7-day retention, X-Ray tracing enabled
- Code Quality: Python, well-structured, follows Pulumi best practices

## What to deliver

- Complete Pulumi Python implementation
- Lambda function for webhook processing
- DynamoDB table with appropriate configuration
- Secrets Manager secret for API keys
- IAM roles with least-privilege policies
- CloudWatch Logs group configuration
- Lambda function URL with authentication
- Stack outputs for function URL and table ARN
- Documentation and deployment instructions
