# Application Deployment

> **CRITICAL REQUIREMENT: This task MUST be implemented using CDK with Python**
>
> Platform: **cdk**
> Language: **py**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A financial analytics company needs to process millions of transaction records daily through a multi-stage validation pipeline. The system must handle variable load patterns with strict data consistency requirements while maintaining cost efficiency through serverless architecture.

## Problem Statement

Create a CDK Python program to implement a serverless transaction validation pipeline.

### MANDATORY REQUIREMENTS (All Must Be Implemented)

1. Deploy three Lambda functions (512MB memory each) for data ingestion, validation, and enrichment stages (CORE: Lambda)
2. Configure DynamoDB table with on-demand billing for storing transaction states with GSI for status queries (CORE: DynamoDB)
3. Implement Step Functions state machine to orchestrate the three-stage pipeline with error handling (CORE: Step Functions)
4. Set up SQS queues between each processing stage with visibility timeout of 300 seconds (CORE: SQS)
5. Configure Lambda Dead Letter Queues with maxReceiveCount of 3 for all functions
6. Enable X-Ray tracing across all Lambda functions and Step Functions
7. Implement CloudWatch Logs with 14-day retention for all services
8. Create custom CloudWatch metrics for transaction processing rates and error counts
9. Deploy all resources with deletion protection disabled for testing environments
10. Add EventBridge rule to trigger pipeline on S3 uploads (CORE: EventBridge) - enables event-driven processing
11. Implement API Gateway REST endpoint for manual transaction submission (CORE: API Gateway) - provides external integration
12. Add SNS topic for failure notifications (CORE: SNS) - improves operational alerting

**Note:** This is iteration 1, so ALL features including EventBridge, API Gateway, and SNS must be implemented. These are not optional enhancements.

### Expected Output
A complete CDK Python application that deploys a production-ready serverless transaction processing pipeline with proper error handling, monitoring, orchestration capabilities, event-driven triggers, REST API integration, and failure notifications.

## Constraints and Requirements

- Lambda functions must use Python 3.9 runtime with boto3 pre-installed
- DynamoDB table must have point-in-time recovery enabled
- Step Functions state machine must implement exponential backoff for retries
- All IAM roles must follow least-privilege principle with no wildcard actions
- SQS queues must enable server-side encryption using AWS managed keys
- Lambda environment variables must be encrypted at rest
- X-Ray sampling rate must be set to 10% for cost optimization
- CloudWatch Log Groups must use /aws/lambda/ prefix naming convention
- Stack must include CloudFormation outputs for all queue URLs and function ARNs

## Environment Setup

AWS multi-AZ deployment in us-east-1 region using:
- Lambda functions for compute
- DynamoDB for state management
- Step Functions for orchestration
- SQS for decoupling
- EventBridge for event-driven processing
- API Gateway for external integration
- SNS for notifications
- X-Ray for distributed tracing
- CloudWatch Logs and Metrics for comprehensive observability

Infrastructure requires:
- CDK 2.x with Python 3.9+
- AWS CLI configured with appropriate permissions
- VPC Endpoints for DynamoDB and S3 to reduce data transfer costs
- Lambda functions deployed across multiple AZs for high availability
- No NAT Gateway required as all services are AWS-managed

---

## Implementation Guidelines

### Platform Requirements
- Use CDK as the IaC framework
- All code must be written in Python
- Follow CDK best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Deployment Requirements (CRITICAL)

### Resource Naming
- **MANDATORY**: All named resources MUST include `environmentSuffix` in their names
- Pattern: `{resource-name}-${environmentSuffix}` or `{resource-name}-${props.environmentSuffix}`
- Examples:
  - S3 Bucket: `my-bucket-${environmentSuffix}`
  - Lambda Function: `my-function-${environmentSuffix}`
  - DynamoDB Table: `my-table-${environmentSuffix}`
  - SQS Queue: `my-queue-${environmentSuffix}`
  - SNS Topic: `my-topic-${environmentSuffix}`
  - Step Functions State Machine: `my-statemachine-${environmentSuffix}`
- **Validation**: Every resource with a `name`, `bucketName`, `functionName`, `tableName`, `roleName`, `queueName`, `topicName`, `streamName`, `clusterName`, or `dbInstanceIdentifier` property MUST include environmentSuffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**:
  - `RemovalPolicy.RETAIN` (CDK/CDKTF) → Use `RemovalPolicy.DESTROY` instead
  - `DeletionPolicy: Retain` (CloudFormation) → Remove or use `Delete`
  - `deletionProtection: true` (RDS, DynamoDB) → Use `deletionProtection: false`
  - `skip_final_snapshot: false` (RDS) → Use `skip_final_snapshot: true`
- **Rationale**: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### Lambda Functions
- **Python 3.9 Runtime**: Use boto3 which comes pre-installed
- **Memory**: Set to 512MB as specified
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues
- **Dead Letter Queues**: Configure with maxReceiveCount of 3
- **X-Ray Tracing**: Enable active tracing on all functions

#### DynamoDB
- **Billing Mode**: Use on-demand (PAY_PER_REQUEST)
- **Point-in-Time Recovery**: Must be enabled
- **Global Secondary Index**: Create for status queries
- **Deletion Protection**: Set to false for testing

#### Step Functions
- **Error Handling**: Implement exponential backoff for retries
- **X-Ray Tracing**: Enable tracing
- **CloudWatch Logs**: Enable logging with 14-day retention

#### SQS Queues
- **Visibility Timeout**: Set to 300 seconds
- **Encryption**: Enable server-side encryption using AWS managed keys
- **Dead Letter Queues**: Configure for each processing queue

#### EventBridge
- **Rule**: Create rule to trigger pipeline on S3 uploads
- **Target**: Point to Step Functions state machine or initial Lambda function

#### API Gateway
- **Type**: REST API
- **Endpoint**: For manual transaction submission
- **Integration**: Integrate with Step Functions or initial Lambda function
- **Authorization**: Use IAM or API keys as appropriate

#### SNS
- **Topic**: For failure notifications
- **Subscriptions**: Configure email or other endpoints as needed
- **Encryption**: Enable server-side encryption

#### X-Ray
- **Sampling Rate**: Set to 10% for cost optimization
- **Tracing**: Enable across all Lambda functions and Step Functions

#### CloudWatch
- **Log Groups**: Use /aws/lambda/ prefix naming convention
- **Retention**: Set to 14 days for all log groups
- **Custom Metrics**: Create for transaction processing rates and error counts

### Hardcoded Values (FORBIDDEN)
- **DO NOT** hardcode:
  - Environment names: `prod-`, `dev-`, `stage-`, `production`, `development`, `staging`
  - Account IDs: `123456789012`, `arn:aws:.*:.*:account`
  - Regions: Hardcoded `us-east-1` or `us-west-2` in resource names (use variables)
- **USE**: Environment variables, context values, or parameters instead

### Cross-Resource References
- Ensure all resource references use proper ARNs or resource objects
- Verify dependencies are explicit (use `add_dependency` in CDK Python)
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (CDK Python)
```python
from aws_cdk import (
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_sqs as sqs,
    RemovalPolicy
)

# Correct naming with environmentSuffix
ingestion_function = lambda_.Function(
    self, "IngestionFunction",
    function_name=f"transaction-ingestion-{environment_suffix}",  #  CORRECT
    runtime=lambda_.Runtime.PYTHON_3_9,
    memory_size=512,
    # ...
)

#  WRONG:
# function_name="transaction-ingestion-prod"  # Hardcoded, will fail
```

### Correct Removal Policy (CDK Python)
```python
table = dynamodb.Table(
    self, "TransactionTable",
    table_name=f"transactions-{environment_suffix}",
    removal_policy=RemovalPolicy.DESTROY,  #  CORRECT
    # ...
)

#  WRONG:
# removal_policy=RemovalPolicy.RETAIN  # Will block cleanup
```

### Correct X-Ray Configuration (CDK Python)
```python
# Lambda with X-Ray tracing
function = lambda_.Function(
    self, "ValidatorFunction",
    function_name=f"transaction-validator-{environment_suffix}",
    tracing=lambda_.Tracing.ACTIVE,  #  CORRECT for 10% sampling
    # ...
)

# Step Functions with tracing
state_machine = sfn.StateMachine(
    self, "Pipeline",
    state_machine_name=f"transaction-pipeline-{environment_suffix}",
    tracing_enabled=True,  #  CORRECT
    # ...
)
```

### Correct SQS Configuration (CDK Python)
```python
queue = sqs.Queue(
    self, "ProcessingQueue",
    queue_name=f"transaction-processing-{environment_suffix}",
    visibility_timeout=Duration.seconds(300),  #  CORRECT
    encryption=sqs.QueueEncryption.KMS_MANAGED,  #  CORRECT
    dead_letter_queue=sqs.DeadLetterQueue(
        max_receive_count=3,
        queue=dlq
    )
)
```

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All 12 mandatory requirements are implemented
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
- EventBridge triggers pipeline on S3 uploads
- API Gateway endpoint accepts manual submissions
- SNS sends failure notifications
- X-Ray tracing is visible across all components
- CloudWatch metrics track processing rates and errors
