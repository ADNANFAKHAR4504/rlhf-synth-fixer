# CI/CD Pipeline Integration

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using CloudFormation (cfn) with JSON**
>
> Platform: **cfn**
> Language: **json**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A SaaS company needs to establish automated deployment pipelines for their microservices architecture. Each service requires its own pipeline with proper build, test, and deployment stages while maintaining cost efficiency and security compliance.

## Problem Statement
Create a CloudFormation template to deploy a reusable CI/CD pipeline infrastructure.

MANDATORY REQUIREMENTS (Must complete):
1. Create CodePipeline with source, build, and deploy stages (CORE: CodePipeline)
2. Configure CodeBuild project for building Docker images (CORE: CodeBuild)
3. Use CodeCommit as source repository with main branch trigger
4. Deploy to ECS service using blue/green deployment
5. Create S3 bucket for pipeline artifacts with versioning enabled
6. Implement manual approval action between staging and production
7. Configure CloudWatch Events rule to trigger pipeline on code commits
8. Output pipeline ARN and execution role ARN

OPTIONAL ENHANCEMENTS (If time permits):
- Add CodeBuild project for automated testing (OPTIONAL: Additional CodeBuild) - improves quality assurance
- Implement SNS topic for pipeline notifications (OPTIONAL: SNS) - enhances team communication
- Add Lambda function for custom deployment validation (OPTIONAL: Lambda) - enables advanced deployment checks

Expected output: A CloudFormation JSON template that creates a fully functional CI/CD pipeline with proper security controls, automated triggers, and multi-stage deployment workflow.

## Constraints and Requirements
- All CodeBuild projects must use compute type BUILD_GENERAL1_SMALL for cost optimization
- Pipeline artifacts must be encrypted with customer-managed KMS keys
- Each pipeline must include a manual approval stage before production deployment
- CodeBuild must run in a VPC with no internet access (use VPC endpoints)
- Pipeline execution logs must be retained for exactly 30 days
- All IAM roles must follow least-privilege principle with no wildcard actions

## Environment Setup
```
AWS deployment pipeline infrastructure in us-east-1 region using CodePipeline for orchestration, CodeBuild for build/test stages, and ECS for deployment targets. Requires VPC with private subnets and VPC endpoints for CodeBuild, S3, and ECR access. Customer-managed KMS key for encryption. CloudFormation JSON format required. Infrastructure spans across development and production accounts with cross-account IAM trust relationships. CodeCommit repositories host source code.
```

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

### Correct Resource Naming (CloudFormation JSON)
```json
{
  "PipelineBucket": {
    "Type": "AWS::S3::Bucket",
    "Properties": {
      "BucketName": {
        "Fn::Sub": "pipeline-artifacts-${EnvironmentSuffix}"
      }
    }
  }
}
```

### Correct Removal Policy (CloudFormation JSON)
```json
{
  "PipelineBucket": {
    "Type": "AWS::S3::Bucket",
    "Properties": {
      "BucketName": {
        "Fn::Sub": "pipeline-artifacts-${EnvironmentSuffix}"
      }
    },
    "DeletionPolicy": "Delete"
  }
}
```

## Target Region
All resources should be deployed to: **us-east-1**
