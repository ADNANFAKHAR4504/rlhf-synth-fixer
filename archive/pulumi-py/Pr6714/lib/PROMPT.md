# Application Deployment

> **CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with Python**
>
> Platform: **pulumi**
> Language: **py**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A financial services company needs to process millions of transaction records daily for fraud detection. They require a serverless pipeline that can handle variable loads, process data in near real-time, and maintain strict security compliance while minimizing operational overhead.

## Problem Statement
Create a Pulumi Python program to deploy a serverless fraud detection pipeline. The configuration must:

1. Set up an API Gateway REST API with /transactions POST endpoint that validates request body schema.
2. Configure a Lambda function to receive API requests and publish valid transactions to an SQS queue.
3. Create a DynamoDB table 'transactions' with partition key 'transaction_id' and sort key 'timestamp'.
4. Deploy a Lambda function that consumes from the SQS queue and writes transactions to DynamoDB.
5. Implement an EventBridge rule that triggers every 5 minutes to invoke a batch processing Lambda.
6. Configure the batch Lambda to scan DynamoDB for recent transactions and detect anomalies.
7. Create an S3 bucket for storing processed transaction reports with server-side encryption.
8. Set up a Lambda function that generates daily reports and stores them in S3.
9. Configure CloudWatch alarms for Lambda errors exceeding 1% error rate over 5 minutes.
10. Implement proper IAM roles with least privilege access for each Lambda function.

Expected output: A complete Pulumi program that creates all resources with proper configurations, security settings, and monitoring. The stack should output the API Gateway endpoint URL, S3 bucket name, and DynamoDB table ARN.

## Constraints and Requirements
- S3 buckets must have versioning enabled and lifecycle policies to transition objects to Glacier after 90 days
- Lambda functions must have environment variables encrypted using a customer-managed KMS key
- All Lambda functions must use Python 3.11 runtime with 3GB memory allocation
- DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
- Dead letter queues must be configured for all SQS queues with maximum receive count of 3
- API Gateway must implement request throttling at 10,000 requests per second with burst of 5,000
- Lambda functions should use default concurrency (no reserved executions) due to account limits

## Environment Setup
Serverless infrastructure deployed in us-east-1 region using AWS Lambda for compute, API Gateway for REST endpoints, DynamoDB for transaction storage, S3 for long-term data archival, SQS for message queuing, and EventBridge for event routing. Requires Pulumi 3.x with Python 3.8+, AWS CLI configured with appropriate IAM permissions. Infrastructure spans multiple availability zones with encryption at rest and in transit. CloudWatch Logs for centralized logging with 30-day retention policy.

---

## Implementation Guidelines

### Platform Requirements
- Use Pulumi as the IaC framework
- All code must be written in Python
- Follow Pulumi best practices for resource organization
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
  - S3 Bucket: `fraud-detection-reports-${environmentSuffix}`
  - Lambda Function: `api-handler-${environmentSuffix}`
  - DynamoDB Table: `transactions-${environmentSuffix}`
- **Validation**: Every resource with a `name`, `bucket`, `function_name`, `table_name`, `role_name`, `queue_name`, `topic_name`, `stream_name`, `cluster_name`, or `db_instance_identifier` property MUST include environmentSuffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**:
  - Pulumi: Do not use `retain=True` in resource options
  - Use `protect=False` (default) for all resources
  - RDS/DynamoDB: Use `deletion_protection=False`
  - RDS: Use `skip_final_snapshot=True`
- **Rationale**: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### GuardDuty
- **CRITICAL**: Do NOT create GuardDuty detectors in code
- GuardDuty allows only ONE detector per AWS account/region
- If task requires GuardDuty, add comment: "GuardDuty should be enabled manually at account level"

#### AWS Config
- **CRITICAL**: If creating AWS Config roles, use correct managed policy:
  - CORRECT: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
  - WRONG: `arn:aws:iam::aws:policy/service-role/ConfigRole`
  - WRONG: `arn:aws:iam::aws:policy/AWS_ConfigRole`
- **Alternative**: Use service-linked role `AWSServiceRoleForConfig` (auto-created)

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  - Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  - Or extract data from event object directly
- **Reserved Concurrency**: Removed due to AWS account concurrency limits - using default concurrency
  - Note: This constraint from task requirements overrides the general guidance to avoid reserved concurrency
  - Ensure your AWS account has sufficient unreserved concurrency remaining (minimum 10)

#### RDS Databases
- **Prefer**: Aurora Serverless v2 (faster provisioning, auto-scaling)
- **If Multi-AZ required**: Set `backup_retention_period = 1` (minimum) and `skip_final_snapshot = True`
- **Note**: Multi-AZ RDS takes 20-30 minutes to provision

#### NAT Gateways
- **Cost Warning**: NAT Gateways cost ~$32/month each
- **Prefer**: VPC Endpoints for S3, DynamoDB (free)
- **If NAT required**: Create only 1 NAT Gateway (not per AZ) for synthetic tasks

### Hardcoded Values (FORBIDDEN)
- **DO NOT** hardcode:
  - Environment names: `prod-`, `dev-`, `stage-`, `production`, `development`, `staging`
  - Account IDs: `123456789012`, `arn:aws:.*:.*:account`
  - Regions: Hardcoded `us-east-1` or `us-west-2` in resource names (use variables)
- **USE**: Environment variables, context values, or parameters instead

### Cross-Resource References
- Ensure all resource references use proper ARNs or resource objects
- Verify dependencies are explicit using Pulumi's `opts=ResourceOptions(depends_on=[...])`
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (Pulumi Python)
```python
import pulumi
import pulumi_aws as aws

# Get environment suffix from Pulumi config
config = pulumi.Config()
environment_suffix = config.require("environmentSuffix")

# Correct - includes environmentSuffix
bucket = aws.s3.Bucket(
    "fraud-detection-reports",
    bucket=f"fraud-detection-reports-{environment_suffix}",
    # ...
)

# WRONG - hardcoded name
# bucket = aws.s3.Bucket("fraud-detection-reports", bucket="fraud-detection-reports-prod")
```

### Correct Resource Lifecycle (Pulumi Python)
```python
# Correct - resources are destroyable
bucket = aws.s3.Bucket(
    "fraud-detection-reports",
    bucket=f"fraud-detection-reports-{environment_suffix}",
    opts=pulumi.ResourceOptions(protect=False)  # Default, but shown for clarity
)

# WRONG - prevents cleanup
# opts=pulumi.ResourceOptions(retain_on_delete=True)
```

### Lambda Function with KMS Encryption (Pulumi Python)
```python
# Create KMS key for Lambda environment variable encryption
kms_key = aws.kms.Key(
    "lambda-env-key",
    description="KMS key for Lambda environment variable encryption",
    deletion_window_in_days=7
)

# Lambda function with encrypted environment variables
lambda_fn = aws.lambda_.Function(
    "api-handler",
    name=f"api-handler-{environment_suffix}",
    runtime="python3.11",
    memory_size=3072,  # 3GB as required
    # reserved_concurrent_executions removed due to account limits
    kms_key_arn=kms_key.arn,  # Encrypts environment variables
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "QUEUE_URL": queue.url,
            "TABLE_NAME": table.name,
        }
    ),
    # ...
)
```

### DynamoDB Table with Point-in-Time Recovery (Pulumi Python)
```python
table = aws.dynamodb.Table(
    "transactions",
    name=f"transactions-{environment_suffix}",
    billing_mode="PAY_PER_REQUEST",  # On-demand billing as required
    hash_key="transaction_id",
    range_key="timestamp",
    attributes=[
        aws.dynamodb.TableAttributeArgs(name="transaction_id", type="S"),
        aws.dynamodb.TableAttributeArgs(name="timestamp", type="N"),
    ],
    point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
        enabled=True  # As required
    ),
)
```

### S3 Bucket with Lifecycle Policy (Pulumi Python)
```python
bucket = aws.s3.Bucket(
    "fraud-detection-reports",
    bucket=f"fraud-detection-reports-{environment_suffix}",
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True  # As required
    ),
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256"
            )
        )
    ),
    lifecycle_rules=[
        aws.s3.BucketLifecycleRuleArgs(
            enabled=True,
            transitions=[
                aws.s3.BucketLifecycleRuleTransitionArgs(
                    days=90,
                    storage_class="GLACIER"  # As required
                )
            ]
        )
    ]
)
```

### SQS Queue with Dead Letter Queue (Pulumi Python)
```python
# Dead letter queue
dlq = aws.sqs.Queue(
    "transaction-dlq",
    name=f"transaction-dlq-{environment_suffix}"
)

# Main queue with DLQ configuration
queue = aws.sqs.Queue(
    "transaction-queue",
    name=f"transaction-queue-{environment_suffix}",
    redrive_policy=pulumi.Output.all(dlq.arn).apply(
        lambda args: json.dumps({
            "deadLetterTargetArn": args[0],
            "maxReceiveCount": 3  # As required
        })
    )
)
```

### API Gateway with Throttling (Pulumi Python)
```python
api = aws.apigateway.RestApi(
    "fraud-detection-api",
    name=f"fraud-detection-api-{environment_suffix}"
)

# Apply throttling settings to the API stage
stage = aws.apigateway.Stage(
    "prod-stage",
    rest_api=api.id,
    stage_name="prod",
    deployment=deployment.id,
)

# Method settings for throttling
method_settings = aws.apigateway.MethodSettings(
    "api-method-settings",
    rest_api=api.id,
    stage_name=stage.stage_name,
    method_path="*/*",
    settings=aws.apigateway.MethodSettingsSettingsArgs(
        throttling_rate_limit=10000,  # As required
        throttling_burst_limit=5000,  # As required
    )
)
```

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully using Pulumi Python
- All security and compliance constraints are met
- All 10 requirements from the problem statement are implemented
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
- Stack outputs include: API Gateway endpoint URL, S3 bucket name, and DynamoDB table ARN
