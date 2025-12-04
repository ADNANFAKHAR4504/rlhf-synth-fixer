# IaC Program Optimization

> **CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a Pulumi TypeScript program to refactor and optimize an existing CodeCommit repository management solution. The configuration must:

1. Convert sequential repository creation to parallel operations using Promise.all() for improved deployment speed.
2. Implement retry logic with exponential backoff for API rate limiting.
3. Add proper error handling that continues deployment when individual repositories fail.
4. Extract repository configurations into a separate JSON file for better maintainability.
5. Implement resource tagging using a consistent naming convention.
6. Add CloudWatch alarms for repository size monitoring.
7. Create IAM roles with least-privilege access for repository contributors.
8. Implement a mechanism to detect and remove orphaned repositories not defined in configuration.
9. Add output exports for repository clone URLs and ARNs.
10. Use Pulumi's StackReference to share repository information across stacks.

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
  - `RemovalPolicy.RETAIN` (CDK/CDKTF) - Use `RemovalPolicy.DESTROY` instead
  - `DeletionPolicy: Retain` (CloudFormation) - Remove or use `Delete`
  - `deletionProtection: true` (RDS, DynamoDB) - Use `deletionProtection: false`
  - `skip_final_snapshot: false` (RDS) - Use `skip_final_snapshot: true`
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
const bucket = new aws.s3.Bucket("data-bucket", {
  bucket: `data-bucket-${environmentSuffix}`,  // CORRECT
  // ...
});

// WRONG:
// bucket: 'data-bucket-prod'  // Hardcoded, will fail
```

### Correct Removal Policy (Pulumi TypeScript)
```typescript
const bucket = new aws.s3.Bucket("data-bucket", {
  bucket: `data-bucket-${environmentSuffix}`,
  forceDestroy: true,  // CORRECT - allows cleanup
  // ...
});

// WRONG:
// forceDestroy: false  // Will block cleanup
```

### Parallel Operations with Error Handling
```typescript
// CORRECT: Parallel with error handling
const repos = await Promise.all(
  repoConfigs.map(config =>
    createRepository(config).catch(err => {
      console.error(`Failed to create repo ${config.name}: ${err}`);
      return null;
    })
  )
);

// WRONG: Sequential operations
for (const config of repoConfigs) {
  await createRepository(config);  // Slow!
}
```

### Retry Logic with Exponential Backoff
```typescript
async function createWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}
```

## Target Region
All resources should be deployed to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- Repository creation is parallelized for improved performance
- Retry logic handles rate limiting gracefully
- Error handling allows deployment to continue on individual failures
- Repository configurations are externalized to JSON file
- All resources are properly tagged with consistent naming
- CloudWatch alarms monitor repository metrics
- IAM roles follow least-privilege principle
- Orphaned repository detection and cleanup works correctly
- Stack outputs include all repository URLs and ARNs
- StackReference enables cross-stack data sharing
- Tests pass successfully
- Resources are properly named with environmentSuffix
- Infrastructure can be cleanly destroyed
