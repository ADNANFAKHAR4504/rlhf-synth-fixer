Hey team,

We have a fintech startup that needs to process real-time transaction notifications from multiple payment providers. They're getting bombarded with events and need a serverless pipeline that can handle validation, processing, and enrichment of these payment events while maintaining strict compliance and security controls. The business wants everything to be asynchronous, cost-effective, and completely auditable for regulatory purposes.

The system receives events through SNS topics, which connect to EventBridge rules that trigger Step Functions workflows. Step Functions orchestrates three Lambda functions in sequence: first, validator checks event schema and data quality; second, processor transforms and standardizes the payment data; third, enricher adds business context like customer segments and risk scores. Each Lambda writes its results to DynamoDB for compliance auditing and reads configuration from environment variables. When Lambda functions fail, they send error details to dedicated SQS dead letter queues for operations team review. CloudWatch Log Groups capture all execution logs from each Lambda, encrypted with customer-managed KMS keys. All Lambda functions use container images from ECR for deployment flexibility and run on ARM64 architecture for cost savings.

Security is paramount - everything needs encryption at rest, KMS keys for CloudWatch logs, and IAM policies that follow strict least privilege principles. The business has had issues with throttling in the past, so they're requiring reserved concurrent execution limits on all Lambda functions. They also want lifecycle policies on ECR repositories to manage container image costs.

## What we need to build

Create a serverless event processing pipeline using **Terraform with HCL** that handles real-time payment transaction notifications with proper security controls and monitoring.

### Core Requirements

1. **Event Ingestion**
   - SNS topic for incoming payment events with server-side encryption using AWS managed keys
   - EventBridge rules to trigger Step Functions workflow from SNS events

2. **Lambda Functions with Container Images**
   - Three Lambda functions: event-validator, event-processor, event-enricher
   - All functions must use ARM64 architecture for Graviton2 processors
   - Container images stored in private ECR repository
   - Reserved concurrent executions of 100 for each function to prevent throttling
   - Environment variables configured for DynamoDB table name and region
   - Dead letter queues using SQS for each Lambda function for error handling

3. **Workflow Orchestration**
   - Step Functions Express workflow to orchestrate Lambda functions in sequence
   - Express workflows required for cost efficiency

4. **Data Storage**
   - DynamoDB table with on-demand billing for processed events
   - Point-in-time recovery enabled with 35-day backup retention
   - Table must be destroyable with no retain policies

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
- All resources must be destroyable with no Retain policies or DeletionProtection
- Include proper error handling and monitoring

### Constraints

- Lambda functions MUST use ARM-based Graviton2 processors with ARM64 architecture
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

- **Functionality**: Events flow from SNS topic to EventBridge, which triggers Step Functions workflow. Step Functions orchestrates three Lambda functions in sequence: validator checks the event structure, processor transforms the data, and enricher adds business metadata. All functions write to a shared DynamoDB table for audit trails. Failed invocations route to dedicated SQS dead letter queues for each function.
- **Performance**: Reserved concurrency of 100 per Lambda function prevents throttling under load. ARM64 architecture on Graviton2 processors provides cost optimization while maintaining performance.
- **Reliability**: SQS dead letter queues capture failures from each Lambda function for retry analysis. DynamoDB point-in-time recovery with 35-day retention enables data recovery from corruption or accidental deletes.
- **Security**: SNS topic encrypts messages at rest using AWS managed keys. CloudWatch Log Groups encrypt Lambda execution logs using customer-managed KMS keys. IAM roles grant each Lambda function only specific permissions needed for its DynamoDB operations and log writes, following least privilege principles.
- **Monitoring**: CloudWatch Log Groups capture Lambda execution logs with 30-day retention. Step Functions execution history tracks workflow progress. CloudWatch metrics monitor Lambda invocations, errors, and throttles.
- **Resource Naming**: All resources include environmentSuffix variable to enable multiple deployments in the same account without naming conflicts.
- **Destroyability**: All resources can be destroyed cleanly. DynamoDB tables have no retention policies, ECR images follow lifecycle rules, and no resources use deletion protection.
- **Code Quality**: Well-structured HCL with modular resource definitions, clear variable descriptions, and deployment documentation.

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
