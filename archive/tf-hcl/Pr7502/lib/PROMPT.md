Hey team,

We have a fintech startup that needs to process real-time transaction notifications from multiple payment providers. They're getting bombarded with events and need a serverless pipeline that can handle validation, processing, and enrichment of these payment events while maintaining strict compliance and security controls. The business wants everything to be asynchronous, cost-effective, and completely auditable for regulatory purposes.

The system needs to receive events through SNS topics, process them through a series of Lambda functions orchestrated by Step Functions, and store everything in DynamoDB for compliance auditing. They also want proper error handling with dead letter queues and comprehensive monitoring through CloudWatch. All Lambda functions should use container images for flexibility and must run on ARM architecture for cost savings.

Security is paramount - everything needs encryption at rest, KMS keys for CloudWatch logs, and IAM policies that follow strict least privilege principles. The business has had issues with throttling in the past, so they're requiring reserved concurrent execution limits on all Lambda functions. They also want lifecycle policies on ECR repositories to manage container image costs.

## What we need to build

Create a serverless event processing pipeline using **Terraform with HCL** that handles real-time payment transaction notifications with proper security controls and monitoring.

### Core Requirements

1. **Event Ingestion**
   - SNS topic for incoming payment events with server-side encryption using AWS managed keys
   - EventBridge rules to trigger Step Functions workflow from SNS events

2. **Lambda Functions with Container Images**
   - Three Lambda functions: event-validator, event-processor, event-enricher
   - All functions must use ARM64 architecture (Graviton2 processors)
   - Container images stored in private ECR repository
   - Reserved concurrent executions of 100 for each function to prevent throttling
   - Environment variables configured for DynamoDB table name and region
   - Dead letter queues (SQS) for each Lambda function for error handling

3. **Workflow Orchestration**
   - Step Functions Express workflow to orchestrate Lambda functions in sequence
   - Express workflows required for cost efficiency

4. **Data Storage**
   - DynamoDB table with on-demand billing for processed events
   - Point-in-time recovery (PITR) enabled with 35-day backup retention
   - Table must be destroyable (no retain policies)

5. **Container Management**
   - ECR repository for Lambda container images
   - Lifecycle policies to manage image retention and costs

6. **Logging and Monitoring**
   - CloudWatch Log Groups for each Lambda function
   - 30-day retention policy for logs
   - KMS encryption enabled using customer managed keys

7. **Security and Access Control**
   - IAM roles and policies with least privilege access
   - No wildcard resource permissions in IAM policies
   - All encryption keys properly configured

8. **Resource Naming**
   - All resources must include environmentSuffix variable for uniqueness
   - Follow naming convention with environment suffix

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **SNS** for event distribution with encryption
- Use **Lambda** with container runtime and ARM64 architecture
- Use **Step Functions** Express workflows for orchestration
- Use **DynamoDB** with PITR enabled for event storage
- Use **SQS** for dead letter queues
- Use **CloudWatch Logs** with KMS encryption
- Use **ECR** for container image storage with lifecycle policies
- Use **EventBridge** for event routing
- Use **KMS** for encryption keys
- Use **IAM** for roles and policies
- Deploy to **us-east-1** region
- Terraform version 1.5 or higher required
- All resources must be destroyable (no Retain policies or DeletionProtection)
- Include proper error handling and monitoring

### Constraints

- Lambda functions MUST use ARM-based Graviton2 processors (ARM64 architecture)
- DynamoDB tables MUST use point-in-time recovery with 35-day backup retention
- All Lambda functions MUST have reserved concurrent executions set to 100
- SNS topics MUST have server-side encryption using AWS managed keys
- Lambda functions MUST use container images stored in private ECR repositories
- CloudWatch Log Groups MUST have KMS encryption enabled with customer managed keys
- Step Functions state machines MUST use Express workflows
- IAM policies MUST follow least privilege with no wildcard resource permissions
- Reserved concurrency must be explicitly set to prevent throttling
- All named resources must include environmentSuffix for uniqueness

## Success Criteria

- **Functionality**: Events flow from SNS through Lambda functions orchestrated by Step Functions and are stored in DynamoDB
- **Performance**: Reserved concurrency prevents throttling, ARM64 architecture provides cost optimization
- **Reliability**: Dead letter queues capture failures, PITR enabled for data recovery
- **Security**: Server-side encryption on SNS, KMS encryption on CloudWatch logs, least privilege IAM policies
- **Monitoring**: CloudWatch Log Groups with 30-day retention for all Lambda functions
- **Resource Naming**: All resources include environmentSuffix for unique identification
- **Destroyability**: All resources can be destroyed without data retention policies blocking cleanup
- **Code Quality**: Well-structured HCL, modular design, proper documentation

## What to deliver

- Complete Terraform HCL implementation with modular structure
- SNS topic with encryption configuration
- Three Lambda function definitions with container image configurations
- ECR repository with lifecycle policies
- Step Functions Express workflow definition
- DynamoDB table with PITR configuration
- SQS dead letter queues for each Lambda
- CloudWatch Log Groups with KMS encryption
- KMS keys for encryption
- IAM roles and policies for all services
- EventBridge rules for SNS to Step Functions integration
- Variables file with environmentSuffix and configuration options
- Outputs for SNS topic ARN, Step Functions ARN, and DynamoDB table name
- Documentation with deployment instructions
