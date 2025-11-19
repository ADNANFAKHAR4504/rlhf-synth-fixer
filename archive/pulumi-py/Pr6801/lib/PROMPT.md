# Application Deployment - Serverless Transaction Processing System

> **CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with Python**
>
> Platform: **pulumi**
> Language: **py**
> Region: **us-east-2**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background

A fintech startup needs to process millions of daily transactions from various payment providers. They require a serverless architecture that can handle burst traffic during peak hours while maintaining PCI compliance. The system must validate transactions, detect fraud patterns, and store results for audit purposes.

## Problem Statement

Create a Pulumi Python program to deploy a serverless transaction processing system. The configuration must:

1. Create an API Gateway REST API with /transaction POST endpoint protected by API key authentication.
2. Deploy a Lambda function that validates incoming transactions against a DynamoDB table of merchant configurations.
3. Set up an SQS queue for valid transactions with visibility timeout of 300 seconds.
4. Create a second Lambda function triggered by SQS to perform fraud detection using pattern matching.
5. Store processed transactions in a DynamoDB table with partition key 'transaction_id' and sort key 'timestamp'.
6. Implement a third Lambda for failed transaction handling triggered by a separate DLQ.
7. Configure CloudWatch Log Groups with 30-day retention for all Lambda functions.
8. Set up SNS topic for alerting on fraud detection with email subscription.
9. Create CloudWatch dashboard displaying Lambda invocations, errors, and duration metrics.
10. Export API Gateway endpoint URL and CloudWatch dashboard URL as stack outputs.

Expected output: A fully deployed serverless architecture with three Lambda functions connected through SQS queues, API Gateway endpoint for transaction submission, DynamoDB tables for storage, and comprehensive monitoring through CloudWatch and X-Ray. The system should handle 1000+ transactions per second during peak loads.

## Constraints and Requirements

- Deploy all Lambda functions within a VPC using private subnets only
- Implement least-privilege IAM roles with condition keys for resource access
- Use KMS customer-managed keys for encrypting all data at rest
- Use DynamoDB with point-in-time recovery enabled and on-demand billing
- Implement X-Ray tracing for all Lambda functions and API Gateway
- Set up CloudWatch alarms for Lambda errors exceeding 1% error rate
- Configure Lambda functions with 512MB memory and 60-second timeout
- Use AWS Lambda with reserved concurrent executions set to 100 for the main processing function
- Implement dead letter queues for all SQS queues with a retention period of 14 days
- Configure API Gateway with AWS WAF integration using managed rule sets

## Environment Setup

Serverless infrastructure deployed in us-east-2 using AWS Lambda for transaction processing, API Gateway for REST endpoints, DynamoDB for transaction storage, and SQS for message queuing. Requires Pulumi 3.x with Python 3.9+, AWS CLI configured with appropriate credentials. VPC setup with private subnets across 3 AZs, VPC endpoints for AWS services to avoid internet routing. CloudWatch Logs for centralized logging, X-Ray for distributed tracing, and AWS WAF for API protection. KMS encryption required for all data storage.

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
- Deploy Lambda functions in VPC private subnets
- Configure API key authentication for API Gateway
- Enable X-Ray tracing for observability

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
- **Validation**: Every resource with a `name`, `bucketName`, `functionName`, `tableName`, `roleName`, `queueName`, `topicName`, `streamName`, `clusterName`, or `dbInstanceIdentifier` property MUST include environmentSuffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**:
  - `RemovalPolicy.RETAIN` (CDK/CDKTF) - Use `RemovalPolicy.DESTROY` instead
  - `DeletionPolicy: Retain` (CloudFormation) - Remove or use `Delete`
  - `deletionProtection: true` (RDS, DynamoDB) - Use `deletionProtection: false`
  - `skip_final_snapshot: false` (RDS) - Use `skip_final_snapshot: true`
- **Rationale**: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  - Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  - Or extract data from event object directly
- **Reserved Concurrency**: For main processing Lambda, set to 100 as specified
- **VPC Configuration**: Deploy in private subnets with VPC endpoints for AWS services
- **Memory/Timeout**: 512MB memory, 60-second timeout as specified

#### DynamoDB Tables
- **Point-in-time recovery**: Enable as specified in requirements
- **Billing mode**: Use on-demand billing
- **Encryption**: Use KMS customer-managed key
- **Keys**: Transaction table needs partition key 'transaction_id' and sort key 'timestamp'

#### SQS Queues
- **Visibility timeout**: 300 seconds for main queue
- **Dead letter queues**: Configure with 14-day retention
- **Encryption**: Use KMS encryption

#### API Gateway
- **Authentication**: Use API key authentication
- **WAF**: Integrate with AWS WAF using managed rule sets
- **Monitoring**: Enable X-Ray tracing

#### VPC Configuration
- **Subnets**: Private subnets across 3 AZs
- **VPC Endpoints**: Required for Lambda to access AWS services (DynamoDB, SQS, SNS, etc.)
- **No NAT Gateway**: Use VPC endpoints instead to avoid costs

#### CloudWatch
- **Log Groups**: 30-day retention for Lambda logs
- **Alarms**: Error rate exceeding 1%
- **Dashboard**: Display Lambda invocations, errors, and duration metrics

### Hardcoded Values (FORBIDDEN)
- **DO NOT** hardcode:
  - Environment names: `prod-`, `dev-`, `stage-`, `production`, `development`, `staging`
  - Account IDs: `123456789012`, `arn:aws:.*:.*:account`
  - Regions: Hardcoded `us-east-1` or `us-west-2` in resource names (use variables)
- **USE**: Environment variables, context values, or parameters instead

### Cross-Resource References
- Ensure all resource references use proper ARNs or resource objects
- Verify dependencies are explicit
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (Pulumi Python)
```python
import pulumi
import pulumi_aws as aws

# Get environment suffix from config
config = pulumi.Config()
environment_suffix = config.require("environmentSuffix")

# Correct naming with environmentSuffix
table = aws.dynamodb.Table(
    f"transactions-{environment_suffix}",
    name=f"transactions-{environment_suffix}",  # CORRECT
    # ...
)

# WRONG:
# name="transactions-prod"  # Hardcoded, will fail
```

### Correct Lambda in VPC (Pulumi Python)
```python
lambda_function = aws.lambda_.Function(
    f"validator-{environment_suffix}",
    name=f"validator-{environment_suffix}",
    runtime="python3.9",
    vpc_config=aws.lambda_.FunctionVpcConfigArgs(
        subnet_ids=private_subnet_ids,
        security_group_ids=[lambda_sg.id],
    ),
    tracing_config=aws.lambda_.FunctionTracingConfigArgs(
        mode="Active",  # Enable X-Ray
    ),
    # ...
)
```

## Target Region
Deploy all resources to: **us-east-2**

## Success Criteria
- Infrastructure deploys successfully in us-east-2
- All Lambda functions deployed in VPC private subnets
- API Gateway endpoint accessible with API key authentication
- Transaction processing flow works end-to-end
- Fraud detection alerts sent to SNS topic
- CloudWatch dashboard shows metrics
- X-Ray tracing enabled for all components
- All security and compliance constraints met
- Tests pass successfully
- Resources properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
