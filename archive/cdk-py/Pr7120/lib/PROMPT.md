# Security, Compliance, and Governance

> **CRITICAL REQUIREMENT: This task MUST be implemented using cdk with py**
> 
> Platform: **cdk**  
> Language: **py**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A financial services company need s automated infrastructure compliance auditing to meet regulatory requirements. Their existing manual reviews are time-consuming and error-prone, requiring a programmatic solution to continuously validate infrastructure configurations against security policies and generate audit reports.

## Problem Statement
Create a CDK Python program to build an automated infrastructure compliance auditing system. The configuration must:

1. Create a Lambda function (Python 3.9, 1GB memory) that performs single-account infrastructure scanning using direct AWS API calls to check:
   - S3 bucket encryption status
   - VPC flow log configuration
   - Lambda function X-Ray tracing settings
2. Configure EventBridge rules to trigger compliance scans every 6 hours and on-demand via custom events
3. Set up an S3 bucket with versioning and lifecycle rules to store audit reports for 90 days
4. Implement Lambda functions to generate compliance reports in both JSON and CSV formats
5. Create SNS topics for critical non-compliance alerts with email subscriptions
6. Deploy CloudWatch dashboards showing compliance metrics and trend analysis
7. Ensure all Lambda functions have X-Ray tracing enabled for debugging
8. Implement automatic remediation Lambda for specific violations (like enabling S3 encryption) that can be triggered manually or via custom events

**Expected output:** A CDK stack that deploys a complete compliance auditing system capable of scanning infrastructure within a single account using direct API calls (without AWS Config), generating detailed reports, and alerting on violations with manual remediation capabilities.

## Environment
Infrastructure compliance validation system deployed in us-east-1 using direct AWS API calls for resource compliance checking, Lambda for scanning and report generation, S3 for audit report storage, and EventBridge for scheduling periodic compliance checks. Requires CDK 2.x with Python 3.9+, boto3 SDK installed. Single account deployment. VPC with private subnets for Lambda execution, VPC endpoints for AWS service access. Audit reports generated in JSON and CSV formats stored in versioned S3 buckets with lifecycle policies.

## Constraints and Requirements
- All Lambda functions must have reserved concurrent executions set to prevent resource exhaustion
- S3 buckets must use separate KMS keys for encryption, not the default AWS managed key
- VPC flow logs must be enabled and stored with specific naming conventions matching 'audit-flowlogs-{region}-{date}'
- Lambda execution roles must not contain any inline policies, only managed policies
- All resources must include mandatory tags: 'Environment', 'Owner', 'CostCenter', and 'ComplianceLevel'

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
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

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
- **NOTE**: AWS Config is NOT used in this implementation. Compliance checking is performed via direct AWS API calls (S3, EC2, Lambda APIs) instead of Config rules.

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

## Target Region
All resources should be deployed to: **us-east-1**
