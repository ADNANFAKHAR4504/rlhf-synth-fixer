# Security, Compliance, and Governance

> **CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background

A financial services company needs to implement a secure data processing pipeline that meets PCI-DSS compliance requirements. The system must enforce encryption at rest and in transit, implement strict access controls, and maintain audit trails for all data access attempts.

## Problem Statement

Create a Pulumi TypeScript program to implement a zero-trust security architecture for processing sensitive financial data. The configuration must:

1. Create a KMS key with key rotation enabled and alias 'financial-data-key'
2. Deploy an S3 bucket with server-side encryption using the KMS key, versioning enabled, and block all public access
3. Configure a Lambda function that processes data from S3, running in a private subnet with 1024MB memory
4. Set up DynamoDB table 'audit-logs' with encryption using the same KMS key and on-demand billing
5. Create VPC with 3 private subnets across different AZs, no public subnets allowed
6. Implement VPC Endpoints for S3, DynamoDB, and KMS services
7. Configure security groups that allow only necessary internal communication between Lambda and AWS services
8. Create CloudWatch Log Group with KMS encryption for Lambda logs
9. Define IAM roles and policies that grant minimal required permissions for each service
10. Enable AWS Config rules to monitor encryption compliance
11. Output the KMS key ARN, bucket name, and Lambda function ARN

Expected output: A complete Pulumi TypeScript program that creates a fully isolated, encrypted infrastructure where sensitive data never traverses the public internet and all access is logged and monitored.

## Environment Setup

Production-grade security infrastructure deployed in us-east-1 across 3 availability zones. Core services include S3 for encrypted data storage, Lambda for processing in isolated VPC, DynamoDB for audit logs, and KMS for key management. Requires Pulumi 3.x with TypeScript, Node.js 18+, and AWS CLI configured with appropriate permissions. VPC spans 10.0.0.0/16 with private subnets only, VPC Endpoints for S3, DynamoDB, and KMS. No NAT Gateway or Internet Gateway allowed. All inter-service communication must use AWS PrivateLink.

## Constraints and Requirements

- All S3 buckets must use AES-256 encryption with customer-managed KMS keys
- Lambda functions must run in private subnets with no direct internet access
- DynamoDB tables must enable point-in-time recovery and encryption at rest
- VPC Endpoints must be used for all AWS service communications
- IAM roles must follow least-privilege principle with no wildcard permissions
- All resources must be tagged with 'Environment', 'DataClassification', and 'Owner' tags
- CloudWatch Logs must be encrypted and retain logs for exactly 90 days
- Security group rules must explicitly define source IPs with no 0.0.0.0/0 rules

---

## Implementation Guidelines

### Platform Requirements
- Use Pulumi as the IaC framework
- All code must be written in TypeScript
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

### Correct Resource Naming (Pulumi TypeScript)
```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

const bucket = new aws.s3.Bucket("dataBucket", {
  bucket: `data-bucket-${environmentSuffix}`,  // CORRECT
  // ...
});

// WRONG:
// bucket: 'data-bucket-prod'  // Hardcoded, will fail
```

### Correct VPC Endpoint Configuration (Pulumi TypeScript)
```typescript
const s3Endpoint = new aws.ec2.VpcEndpoint("s3Endpoint", {
  vpcId: vpc.id,
  serviceName: `com.amazonaws.${region}.s3`,
  vpcEndpointType: "Gateway",
  routeTableIds: privateRouteTableIds,
});
```

## Target Region
All resources should be deployed to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
- No traffic traverses the public internet (all communication via VPC Endpoints)
- All data encrypted at rest with customer-managed KMS keys
- All logs encrypted and retained for exactly 90 days
