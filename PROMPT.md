# Security, Compliance, and Governance

> **WARNING CRITICAL REQUIREMENT: This task MUST be implemented using cfn with json**
>
> Platform: **cfn**
> Language: **json**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
Your organization's security team has discovered multiple CloudFormation stacks deployed across different AWS accounts that don't meet corporate compliance standards. They need an automated solution to analyze existing CloudFormation templates, identify non-compliant resources, and generate detailed compliance reports. The solution must handle templates with complex resource dependencies and cross-stack references.

## Problem Statement
Create a CloudFormation template to deploy an automated infrastructure compliance analyzer. The configuration must:

1. Define AWS Config Rules for S3 bucket encryption (AES256 or KMS), RDS instance encryption, and allowed EC2 instance types (t3.micro, t3.small only).
2. Create Lambda functions with Python 3.9 runtime that parse CloudFormation templates from S3 and validate resources against Config Rules.
3. Set up DynamoDB table with on-demand billing, partition key 'accountId#timestamp', and sort key 'resourceId'.
4. Configure SNS topic with email subscriptions for critical violations like unencrypted RDS instances or publicly accessible S3 buckets.
5. Implement Step Functions state machine that orchestrates template fetching, parsing, validation, and report generation.
6. Create EventBridge rules that trigger scans on CloudFormation CREATE_COMPLETE and UPDATE_COMPLETE events.
7. Deploy CloudWatch dashboard displaying compliance metrics with custom widgets for pass/fail rates by service.
8. Configure S3 bucket for compliance reports with versioning enabled and lifecycle rules for Glacier transition.
9. Set up cross-account IAM roles with sts:AssumeRole permissions and external ID for secure access.
10. Enable X-Ray tracing on all Lambda functions and Step Functions for performance monitoring.

Expected output: A CloudFormation JSON template that deploys a complete compliance analysis system capable of scanning CloudFormation templates across multiple accounts, validating against Config Rules, and generating actionable compliance reports with automated notifications.

## Constraints and Requirements
- Use AWS Config Rules to define compliance criteria for S3 bucket encryption, RDS encryption, and EC2 instance types
- Deploy Lambda functions that parse CloudFormation templates and validate against Config Rules
- Store compliance scan results in DynamoDB with partition keys based on account ID and scan timestamp
- Implement SNS notifications for critical compliance violations (unencrypted databases, public S3 buckets)
- Create IAM roles with cross-account assume permissions for scanning templates in multiple accounts
- Use Step Functions to orchestrate the compliance scanning workflow across multiple templates
- Configure EventBridge rules to trigger scans when CloudFormation stack events occur
- Implement CloudWatch custom metrics for compliance score tracking (compliant resources / total resources)
- Set up S3 lifecycle policies to archive compliance reports older than 90 days to Glacier
- Enable AWS X-Ray tracing on Lambda functions for performance analysis of template parsing

## Environment Setup
Multi-account AWS environment deployed in us-east-1 region focusing on compliance analysis infrastructure. Core services include AWS Config for compliance rules, Lambda for template parsing logic, DynamoDB for storing scan results, Step Functions for workflow orchestration, and EventBridge for event-driven triggers. Requires CloudFormation JSON templates, cross-account IAM roles with assume permissions, VPC with private subnets for Lambda execution, and NAT Gateway for outbound API calls. The solution analyzes CloudFormation templates stored in S3 buckets across multiple AWS accounts, validates them against predefined Config Rules, and generates compliance reports stored in a centralized DynamoDB table.

---

## Implementation Guidelines

### Platform Requirements
- Use cfn as the IaC framework
- All code must be written in json
- Follow cfn best practices for resource organization
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
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  - CORRECT: `synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0`
  - WRONG: `SYNTHETICS_NODEJS_PUPPETEER_5_1` (deprecated)

#### RDS Databases
- **Prefer**: Aurora Serverless v2 (faster provisioning, auto-scaling)
- **If Multi-AZ required**: Set `backup_retention_period = 1` (minimum) and `skip_final_snapshot = true`
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
- Verify dependencies are explicit (use `DependsOn` in CloudFormation, `dependsOn` in CDK)
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (CloudFormation)
```json
{
  "Resources": {
    "DataBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "data-bucket-${EnvironmentSuffix}"
        }
      }
    }
  }
}
```

### Correct Removal Policy (CloudFormation)
```json
{
  "Resources": {
    "DataBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete"
    }
  }
}
```

### Correct AWS Config IAM Role (CloudFormation)
```json
{
  "Resources": {
    "ConfigRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "config.amazonaws.com"},
            "Action": "sts:AssumeRole"
          }]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
        ]
      }
    }
  }
}
```

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
