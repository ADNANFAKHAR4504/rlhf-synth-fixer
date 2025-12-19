Hey team,

We need to build a multi-environment data pipeline infrastructure for a data analytics company that's struggling to keep their dev, staging, and production environments in sync. Right now they're manually copying configuration changes between environments, which is error-prone and time-consuming. The business wants an automated solution that replicates production configuration changes to development and staging environments automatically.

The company processes large volumes of analytics data across these three environments and needs to ensure that any schema changes or configuration updates in production are immediately reflected in their lower environments. This will help their testing and deployment cycles stay consistent and reduce configuration drift that's been causing issues during promotions.

They've been experiencing problems where production fixes don't get properly tested in staging because the configurations don't match. We need to solve this with an event-driven architecture that monitors production changes and automatically propagates them to the other environments.

## What we need to build

Create a multi-environment data pipeline infrastructure using **Pulumi with TypeScript** for automated configuration replication across three environments: dev, staging, and production.

### Core Requirements

1. **Storage Infrastructure**
   - Create S3 buckets in each environment with consistent naming patterns
   - Bucket names must follow format: company-data-{env}-{region}
   - Enable versioning on all S3 buckets
   - Configure lifecycle policies for 30-day retention

2. **Metadata Storage**
   - Deploy DynamoDB tables with identical schemas across all environments
   - Use on-demand billing mode to control costs
   - Tables should store metadata about pipeline configurations

3. **Change Monitoring and Replication**
   - Implement Lambda functions that monitor configuration changes in production
   - Lambda functions should handle replication logic to dev and staging
   - Include proper error handling and structured logging
   - Set Lambda timeout to 5 minutes maximum
   - Implement exponential backoff for retry logic

4. **Event-Driven Architecture**
   - Set up EventBridge rules to trigger replication workflows
   - Event patterns must filter for production changes only
   - Configure rules to invoke Lambda functions on production configuration changes

5. **Notification System**
   - Configure SNS topics for successful replication notifications
   - Configure SNS topics for failed replication notifications
   - Subscribe appropriate endpoints to each topic

6. **Error Handling**
   - Implement a dead letter queue using SQS for failed replication attempts
   - Configure DLQ with appropriate retention and retry policies

7. **Stack Outputs**
   - Generate outputs showing S3 bucket names for each environment
   - Output DynamoDB table names for each environment
   - Output Lambda function ARNs
   - Output SNS topic ARNs
   - Production stack should additionally output EventBridge rule ARN

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Amazon S3** for data storage with versioning and lifecycle policies
- Use **Amazon DynamoDB** for metadata storage with on-demand billing
- Use **AWS Lambda** for monitoring and replication logic
- Use **Amazon EventBridge** for event-driven replication triggers
- Use **Amazon SNS** for success and failure notifications
- Use **AWS IAM** for least-privilege access roles
- Use **Amazon SQS** for dead letter queue implementation
- Resource names must include **environmentSuffix** for global uniqueness
- Follow naming convention: {resource-type}-{purpose}-{environmentSuffix}
- Deploy to **us-east-1** region
- Use Pulumi's stack references to share outputs between environments
- Use Pulumi's ComponentResource pattern for reusable environment modules
- Use TypeScript interfaces to define consistent resource configurations
- All inter-environment communication must use AWS services only

### Constraints

- All resources must be destroyable with no Retain policies or DeletionProtection
- S3 bucket names must be globally unique and follow AWS naming conventions
- Lambda functions read from production and write to dev/staging only
- IAM roles must implement least-privilege access patterns
- No external APIs or third-party services for inter-environment communication
- EventBridge event patterns must filter production changes only
- Lambda functions must include exponential backoff for retry logic
- Three separate stacks required: dev, staging, prod
- Production stack triggers replication to dev and staging environments
- All resources must include proper tagging: Environment, Project, ManagedBy

## Success Criteria

- **Functionality**: Three independent stacks that can be deployed separately
- **Functionality**: Production changes automatically trigger replication to dev/staging
- **Functionality**: Failed replications are captured in dead letter queue
- **Performance**: Lambda functions complete replication within 5 minutes
- **Reliability**: Exponential backoff handles transient failures gracefully
- **Security**: IAM roles follow least-privilege access patterns
- **Security**: Cross-environment access is properly controlled and audited
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Cost Optimization**: DynamoDB uses on-demand billing mode
- **Code Quality**: TypeScript with proper interfaces and type definitions
- **Code Quality**: Comprehensive error handling and structured logging
- **Observability**: SNS notifications for success and failure states
- **Observability**: Stack outputs provide all necessary resource identifiers

## What to deliver

- Complete Pulumi TypeScript implementation with three stack configurations
- ComponentResource modules for reusable environment infrastructure
- Lambda function code for configuration monitoring and replication
- IAM roles and policies with least-privilege access
- EventBridge rules with proper event pattern filtering
- S3 buckets with versioning and lifecycle policies configured
- DynamoDB tables with identical schemas across environments
- SNS topics for success and failure notifications
- SQS dead letter queue for failed replication attempts
- Stack reference implementation for cross-stack communication
- TypeScript interfaces for consistent resource configurations
- Documentation and deployment instructions for each stack
