Hey team,

We need to build a serverless cryptocurrency price alert system for our fintech company. The business wants a reliable, cost-effective platform that lets users set price alerts via webhooks and automatically sends notifications when crypto prices hit their targets. We've been asked to create this using Pulumi with TypeScript.

The system needs to be highly available and handle concurrent users setting alerts for different cryptocurrencies like Bitcoin, Ethereum, and others. We're aiming for a fully serverless architecture to keep costs low while maintaining high availability. The business is particularly interested in using ARM64 processors for cost optimization and wants comprehensive tracing for debugging production issues.

The infrastructure should be designed to check prices every 5 minutes and send SMS notifications through SNS when alerts trigger. All alerts will be stored in DynamoDB with proper backups and point-in-time recovery enabled.

## What we need to build

Create a serverless cryptocurrency price alert system using **Pulumi with TypeScript** for AWS infrastructure deployment.

### Core Requirements

1. **Webhook Handler Lambda Function**
   - ARM64 architecture using Graviton2 processors
   - Memory allocation: 1024MB
   - Timeout: 30 seconds
   - Enable X-Ray tracing with custom subsegments for detailed performance tracking
   - Environment variables with KMS encryption for API keys
   - Runtime: Node.js 18 or later

2. **Alert Storage with DynamoDB**
   - Partition key: userId (String type)
   - Sort key: alertId (String type)
   - Billing mode: On-demand for automatic scaling
   - Point-in-time recovery enabled
   - Automated backup retention: 7 days

3. **Scheduled Price Checker with EventBridge**
   - Schedule expression: rate(5 minutes) for every 5-minute checks
   - Target: Lambda function for alert evaluation

4. **Alert Evaluator Lambda Function**
   - Same configuration as webhook handler
   - ARM64 architecture using Graviton2 processors
   - Memory: 1024MB, Timeout: 30 seconds
   - Enable X-Ray tracing with custom subsegments
   - Publishing permissions for SNS topic

5. **Notification System with SNS**
   - SMS support enabled for text message notifications
   - Server-side encryption with AWS managed keys
   - Resource-based policy allowing Lambda publishing

6. **Resource Tagging**
   - All resources must include these tags:
   - Environment: production
   - Service: price-alerts

7. **Stack Outputs**
   - Export Lambda function ARNs for both webhook handler and alert evaluator
   - Export DynamoDB table name for reference

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Lambda** for serverless compute with ARM64 architecture
- Use **DynamoDB** for alert storage with on-demand billing
- Use **EventBridge** for scheduled price checks
- Use **SNS** for SMS notifications
- Resource names must include **environmentSuffix** for deployment uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Enable X-Ray tracing on all Lambda functions

### Deployment Requirements (CRITICAL)

- All resource names MUST include **environmentSuffix** parameter for uniqueness
- Pattern: resourceName-environment-suffix or resourceName-props.environmentSuffix
- All resources must be destroyable: no RETAIN policies, no DeletionProtection flags
- Lambda functions must be compatible with Node.js 18+ runtime (use AWS SDK v3 or extract data from event objects, not AWS SDK v2)

### Constraints

- ARM64 architecture mandatory for Lambda functions to use Graviton2 processors
- Point-in-time recovery with automated backups required for DynamoDB
- X-Ray tracing with custom segments mandatory for all Lambda functions
- Server-side encryption with AWS managed keys required for SNS
- Lambda environment variables containing sensitive data must use KMS encryption
- All resources must be fully destroyable (no Retain policies or DeletionProtection)
- Region locked to us-east-1

## Success Criteria

- **Functionality**: Webhook handler accepts alert creation, evaluator checks prices and triggers notifications
- **Performance**: System processes alerts within 5-minute check intervals
- **Reliability**: Multi-AZ deployment through AWS managed services, automated backups enabled
- **Security**: KMS encryption for sensitive data, proper IAM least-privilege policies
- **Resource Naming**: All resources include environmentSuffix for deployment isolation
- **Code Quality**: TypeScript with proper typing, well-tested, documented
- **Cost Optimization**: ARM64 architecture, on-demand billing for DynamoDB
- **Observability**: X-Ray tracing enabled with custom subsegments for debugging

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- Lambda function for webhook handler (accepts alert creation)
- Lambda function for alert evaluator (checks prices and sends notifications)
- DynamoDB table with proper configuration and backup settings
- EventBridge rule for scheduled execution
- SNS topic for SMS notifications
- IAM roles and policies with least privilege access
- Resource tagging for all AWS resources
- Stack outputs for Lambda ARNs and DynamoDB table name
- Unit tests for all infrastructure components
- Documentation with deployment instructions