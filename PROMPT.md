# Application Deployment

> CRITICAL REQUIREMENT: This task MUST be implemented using cfn with json
>
> Platform: cfn
> Language: json
> Region: us-east-1
>
> Do not substitute or change the platform or language. All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a CloudFormation template to optimize an existing multi-tier web application infrastructure that currently spans over 2000 lines across multiple files with significant duplication. The configuration must: 1. Consolidate three separate VPC templates into one reusable nested stack with configurable CIDR blocks. 2. Replace 15 hardcoded security group rules with a Mappings section for port configurations. 3. Implement proper parameter validation for instance types limiting to t3.medium, t3.large, or t3.xlarge. 4. Add Conditions to make ElastiCache deployment optional based on environment type. 5. Use Fn::Sub to dynamically generate resource names with environment prefixes. 6. Implement cross-stack exports for VPC ID, subnet IDs, and security group IDs. 7. Add AWS::CloudFormation::Interface metadata to group parameters logically. 8. Ensure all RDS and ElastiCache resources have DeletionPolicy set to Snapshot. 9. Replace explicit DependsOn attributes with proper resource references. 10. Implement a tagging strategy using a common CostCenter parameter. Expected output: A modular CloudFormation template structure with a master stack and at least three nested stacks (VPC, Compute, Data) that eliminates duplication, implements proper validation, and follows AWS best practices for maintainability.

---

## Background

Your company's CloudFormation templates for a multi-tier web application have grown complex and inefficient over two years of development. The templates suffer from hardcoded values, excessive resource duplication, and lack proper parameter validation, causing frequent deployment failures and making maintenance difficult.

## Environment Setup

Production multi-tier application infrastructure deployed in us-east-1 across 3 availability zones. Current setup includes Application Load Balancer, Auto Scaling Group with EC2 instances, RDS Aurora MySQL cluster, and ElastiCache Redis cluster. VPC spans 10.0.0.0/16 with public subnets for ALB and private subnets for compute and data tiers. Requires AWS CLI 2.x configured with appropriate IAM permissions for CloudFormation stack operations. Templates must support blue-green deployments.

## Constraints and Requirements

- Must use CloudFormation intrinsic functions to eliminate all hardcoded ARNs and resource names
- Implement nested stacks to modularize VPC, compute, and database layers
- Add parameter constraints with AllowedValues or AllowedPattern for all user inputs
- Use Conditions to handle optional resources without creating empty stacks
- Replace duplicate security group rules with reusable mappings
- Implement DeletionPolicy and UpdateReplacePolicy on all stateful resources
- Add Metadata sections with AWS::CloudFormation::Interface for parameter grouping
- Use Outputs with Export names for cross-stack references
- Implement DependsOn only where CloudFormation cannot infer dependencies
- Add resource tags using a common parameter for cost tracking

---

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- Exception: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Deployment Requirements (CRITICAL)

### Resource Naming
- MANDATORY: All named resources MUST include `environmentSuffix` in their names
- Pattern: `{resource-name}-${environmentSuffix}` or `{resource-name}-${props.environmentSuffix}`
- Examples:
  - S3 Bucket: `my-bucket-${environmentSuffix}`
  - Lambda Function: `my-function-${environmentSuffix}`
  - DynamoDB Table: `my-table-${environmentSuffix}`
- Validation: Every resource with a `name`, `bucketName`, `functionName`, `tableName`, `roleName`, `queueName`, `topicName`, `streamName`, `clusterName`, or `dbInstanceIdentifier` property MUST include environmentSuffix

### Resource Lifecycle
- MANDATORY: All resources MUST be destroyable after testing
- FORBIDDEN:
  - `RemovalPolicy.RETAIN` (CDK/CDKTF) - Use `RemovalPolicy.DESTROY` instead
  - `DeletionPolicy: Retain` (CloudFormation) - Remove or use `Delete`
  - `deletionProtection: true` (RDS, DynamoDB) - Use `deletionProtection: false`
  - `skip_final_snapshot: false` (RDS) - Use `skip_final_snapshot: true`
- Rationale: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### GuardDuty
- CRITICAL: Do NOT create GuardDuty detectors in code
- GuardDuty allows only ONE detector per AWS account/region
- If task requires GuardDuty, add comment: "GuardDuty should be enabled manually at account level"

#### AWS Config
- CRITICAL: If creating AWS Config roles, use correct managed policy:
  - CORRECT: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
  - WRONG: `arn:aws:iam::aws:policy/service-role/ConfigRole`
  - WRONG: `arn:aws:iam::aws:policy/AWS_ConfigRole`
- Alternative: Use service-linked role `AWSServiceRoleForConfig` (auto-created)

#### Lambda Functions
- Node.js 18.x+: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  - Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  - Or extract data from event object directly
- Reserved Concurrency: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- CRITICAL: Use current runtime version
  - CORRECT: `synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0`
  - WRONG: `SYNTHETICS_NODEJS_PUPPETEER_5_1` (deprecated)

#### RDS Databases
- Prefer: Aurora Serverless v2 (faster provisioning, auto-scaling)
- If Multi-AZ required: Set `backup_retention_period = 1` (minimum) and `skip_final_snapshot = true`
- Note: Multi-AZ RDS takes 20-30 minutes to provision

#### NAT Gateways
- Cost Warning: NAT Gateways cost ~$32/month each
- Prefer: VPC Endpoints for S3, DynamoDB (free)
- If NAT required: Create only 1 NAT Gateway (not per AZ) for synthetic tasks

### Hardcoded Values (FORBIDDEN)
- DO NOT hardcode:
  - Environment names: `prod-`, `dev-`, `stage-`, `production`, `development`, `staging`
  - Account IDs: `123456789012`, `arn:aws:.*:.*:account`
  - Regions: Hardcoded `us-east-1` or `us-west-2` in resource names (use variables)
- USE: Environment variables, context values, or parameters instead

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
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "data-bucket-${EnvironmentSuffix}"
        }
      }
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
            "Principal": {
              "Service": "config.amazonaws.com"
            },
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
All resources should be deployed to: us-east-1
