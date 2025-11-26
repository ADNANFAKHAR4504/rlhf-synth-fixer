# Security, Compliance, and Governance

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cfn with json**
> 
> Platform: **cfn**  
> Language: **json**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A financial services company has discovered configuration drift in their production environment after a security audit. They need to implement automated infrastructure compliance scanning to ensure their CloudFormation stacks remain compliant with corporate security policies and AWS best practices.

## Problem Statement
Create a CloudFormation template to deploy an automated infrastructure compliance analysis system. The configuration must: 

1. Set up AWS Config with custom rules to monitor CloudFormation stack drift and compliance violations.
2. Deploy Lambda functions (Python 3.9 runtime, 256MB memory) that validate resource configurations against security policies.
3. Create S3 bucket with versioning enabled and lifecycle rules to transition compliance reports to Glacier after 30 days.
4. Configure EventBridge rules to capture AWS Config compliance changes and trigger Lambda validation functions.
5. Implement SNS topic with email subscriptions for security team notifications on non-compliant resources.
6. Create CloudWatch dashboard displaying compliance metrics and drift detection results.
7. Set up Parameter Store entries for storing approved AMI IDs and security group rules.
8. Implement automated tagging compliance checks ensuring all resources have required tags (Environment, Owner, CostCenter).
9. Configure AWS Config aggregator to collect compliance data from multiple AWS accounts if present.
10. Create IAM roles and policies following least privilege principle for all services.

Expected output: A CloudFormation template that deploys a complete infrastructure compliance monitoring system capable of detecting configuration drift, validating security policies, and alerting on non-compliant resources across CloudFormation stacks.

## Constraints and Requirements
- Use AWS Config rules to monitor CloudFormation stack compliance
- Implement custom Lambda functions for policy validation
- Store compliance reports in S3 with lifecycle policies
- Use EventBridge for real-time drift detection
- Implement SNS notifications for non-compliant resources
- Create IAM roles with least privilege access
- Enable CloudWatch Logs for all Lambda functions
- Use Parameter Store for configuration values
- Implement resource tagging standards validation

## Environment Setup
Infrastructure compliance monitoring system deployed in us-east-1 region. Uses AWS Config for continuous monitoring of CloudFormation stacks, Lambda functions for custom compliance checks, S3 for report storage with 90-day retention. EventBridge rules trigger on configuration changes. SNS topics distribute alerts to security team. Requires AWS CLI 2.x configured, Python 3.9+ for Lambda runtime. VPC not required as all services are managed. Parameter Store holds compliance thresholds and approved AMI lists. CloudWatch Logs aggregates Lambda execution logs with 30-day retention.

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
  - ✅ CORRECT: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
  - ❌ WRONG: `arn:aws:iam::aws:policy/service-role/ConfigRole`
  - ❌ WRONG: `arn:aws:iam::aws:policy/AWS_ConfigRole`
- **Alternative**: Use service-linked role `AWSServiceRoleForConfig` (auto-created)

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  - ✅ Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  - ✅ Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  - ✅ CORRECT: `synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0`
  - ❌ WRONG: `SYNTHETICS_NODEJS_PUPPETEER_5_1` (deprecated)

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
All resources should be deployed to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
