# Application Deployment

> **CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a Pulumi TypeScript program to deploy a complete CI/CD pipeline for serverless microservices.

### MANDATORY REQUIREMENTS (Must complete):

1. Create a CodePipeline with 4 stages connecting GitHub source to blue-green deployment (CORE: CodePipeline)
2. Configure CodeBuild project with TypeScript compilation and Jest unit tests (CORE: CodeBuild)
3. Set up two Lambda functions (blue and green) with 512MB memory and Node.js 18 runtime
4. Create DynamoDB table for storing deployment history with partition key 'deploymentId'
5. Implement CodeDeploy application for Lambda blue-green deployments with automatic rollback
6. Configure S3 bucket for pipeline artifacts with server-side encryption using AWS managed keys
7. Create CloudWatch alarm monitoring Lambda error rates with SNS notifications
8. Output the pipeline execution URL and deployment status table name

### OPTIONAL ENHANCEMENTS (If time permits):

- Add CodeArtifact repository for npm package caching (OPTIONAL: CodeArtifact) - reduces build times
- Implement rule to trigger pipeline on git tags (OPTIONAL) - enables tag-based releases
- Add tracing to Lambda functions (OPTIONAL) - improves deployment debugging

### Expected Output

A Pulumi TypeScript program that creates a fully functional CI/CD pipeline with blue-green deployment capability, automated testing, and rollback mechanisms. The infrastructure should be idempotent and support multiple deployment environments through Pulumi stacks.

---

## Background

A fintech startup needs to implement a fully automated CI/CD pipeline for their payment processing microservices. The pipeline must support blue-green deployments with automatic rollback capabilities and integrate with their existing GitHub repository structure.

## Environment Setup

Production CI/CD infrastructure deployed in us-east-1 region. Uses CodePipeline for orchestration, CodeBuild for compilation and testing, CodeDeploy for blue-green deployments to Lambda functions. DynamoDB tables store deployment metadata and application state. S3 buckets host build artifacts and deployment packages. CloudWatch monitors deployment health with automated rollback triggers. VPC not required as all services are managed. Requires Pulumi CLI 3.x, Node.js 18+, TypeScript 5.x, AWS CLI configured with appropriate permissions. Multi-stage pipeline with automated testing and gradual traffic shifting between blue and green environments.

## Constraints and Requirements

- Use CodePipeline with exactly 4 stages: Source, Build, Deploy-Blue, and Switch-Traffic
- CodeBuild projects must use compute type BUILD_GENERAL1_SMALL for cost optimization
- All Lambda functions must have reserved concurrent executions set to 100
- DynamoDB tables must use PAY_PER_REQUEST billing mode with point-in-time recovery enabled
- CodeDeploy must use LINEAR_10PERCENT_EVERY_10MINUTES deployment configuration
- All S3 buckets must have versioning enabled and lifecycle rules to delete old versions after 30 days
- CloudWatch alarms must trigger rollback if error rate exceeds 5% for 2 consecutive periods
- IAM roles must follow principle of least privilege with no inline policies allowed

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
  -  CORRECT: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
  -  WRONG: `arn:aws:iam::aws:policy/service-role/ConfigRole`
  -  WRONG: `arn:aws:iam::aws:policy/AWS_ConfigRole`
- **Alternative**: Use service-linked role `AWSServiceRoleForConfig` (auto-created)

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  -  Use AWS SDK v3: `import { S3Client } from '@aws-sdk/client-s3'`
  -  Or extract data from event object directly
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### CloudWatch Synthetics
- **CRITICAL**: Use current runtime version
  -  CORRECT: `synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0`
  -  WRONG: `SYNTHETICS_NODEJS_PUPPETEER_5_1` (deprecated)

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
const bucket = new aws.s3.Bucket("dataBucket", {
    bucket: `data-bucket-${environmentSuffix}`,  //  CORRECT
    // ...
});

//  WRONG:
// bucket: 'data-bucket-prod'  // Hardcoded, will fail
```

### Correct Lambda Configuration
```typescript
const lambdaFunction = new aws.lambda.Function("processFunction", {
    name: `process-function-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    memorySize: 512,
    // AVOID reserved concurrent executions unless absolutely required
    // reservedConcurrentExecutions: 100,  // Can cause account limit issues
});
```

## Target Region
All resources should be deployed to: **us-east-1**

## Success Criteria
- CI/CD pipeline deploys successfully with all 4 stages
- Blue-green deployment mechanism works correctly
- Automated rollback triggers on failures
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
