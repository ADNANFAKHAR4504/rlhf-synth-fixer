# Application Deployment (ITERATION 2 - Enhanced)

> **CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with TypeScript**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A DevOps team needs to establish a multi-stage CI/CD pipeline for their microservices architecture. The pipeline must support automated testing, security scanning, and blue-green deployments across development, staging, and production environments.

## Problem Statement
Create a Pulumi TypeScript program to deploy a complete CI/CD pipeline for containerized applications. The configuration must implement all original requirements PLUS enhanced security, monitoring, and compliance features.

## Original Requirements (Iteration 1)

1. Create a CodeCommit repository with main, develop, and feature branch structure
2. Set up CodePipeline with 5 stages (Source, Build, Test, Security, Deploy) triggered on commits to main branch
3. Configure CodeBuild projects for build, unit testing, and security scanning stages
4. Implement S3 bucket for pipeline artifacts with versioning and lifecycle policies
5. Define Lambda function configurations and services for blue-green deployments
6. Set up EventBridge rules to capture pipeline state changes and route to SNS topic
7. Implement manual approval action between Security and Deploy stages
8. Configure CloudWatch log groups for all services with 30-day retention
9. Create SSM parameters for deployment configuration values
10. Expected output: A fully functional Pulumi program that provisions an end-to-end CI/CD pipeline capable of building, testing, and deploying containerized applications with automated security scanning and manual approval gates

## Additional Requirements (Iteration 2 - CRITICAL for Training Value)

**These features MUST be implemented to increase training value from 6/10 to ≥8/10:**

11. **AWS KMS Encryption**:
    - Create customer-managed KMS keys for S3 artifacts bucket
    - Enable KMS encryption for CloudWatch Logs (all log groups)
    - Configure automatic key rotation (enabled: true)
    - Implement key policies following least-privilege principles
    - Key alias format: `alias/cicd-pipeline-${environmentSuffix}`

12. **AWS WAF v2 Web Application Firewall**:
    - Deploy WAFv2 Web ACL protecting the Application Load Balancer (if ALB exists for deployment)
    - Implement rate limiting rules: 1000 requests per 5 minutes per IP
    - Add AWS managed rule groups:
      - AWSManagedRulesCommonRuleSet (Core Rule Set)
      - AWSManagedRulesKnownBadInputsRuleSet
    - Optional: Geo-blocking rules (configurable via parameters)
    - WAF logging to S3 or CloudWatch Logs

13. **AWS X-Ray Distributed Tracing**:
    - Enable X-Ray tracing for all Lambda functions
    - Configure X-Ray for ECS tasks (if using ECS for deployment)
    - Set up sampling rules (10% of requests traced by default)
    - Create X-Ray groups for filtering traces by environment
    - Output X-Ray service map dashboard link

14. **AWS Secrets Manager Integration**:
    - Migrate sensitive deployment configuration from SSM Parameters to Secrets Manager
    - Store database credentials, API keys, and sensitive configs in Secrets Manager
    - Enable automatic secret rotation for RDS credentials (if RDS is used)
    - Configure secret versioning with AWSCURRENT and AWSPREVIOUS labels
    - Lambda functions should fetch secrets from Secrets Manager, not SSM

## Constraints and Requirements

- CodePipeline must have exactly 5 stages: Source, Build, Test, Security, and Deploy
- Use CodeCommit as the source repository with branch-based triggers
- CodeBuild projects must use Amazon Linux 2 runtime with buildspec.yml
- Implement manual approval action before production deployment
- Store all build artifacts in S3 with KMS encryption (not just AES256)
- Use EventBridge to send pipeline status notifications to SNS
- Deploy to ECS with Lambda orchestration using blue-green deployment strategy
- All IAM roles must follow least-privilege principle with no wildcard actions
- Pipeline execution logs must be retained in CloudWatch for 30 days with KMS encryption
- Use Secrets Manager for storing deployment configuration (not SSM for sensitive data)
- All KMS keys must have rotation enabled
- WAF must be associated with ALB if ALB exists
- X-Ray must be enabled for all Lambda functions and ECS tasks

## Environment Setup

**Multi-stage CI/CD infrastructure deployed in us-east-1 using:**
- AWS CodePipeline for orchestration
- CodeBuild for compilation and testing
- ECS with Lambda for container hosting
- VPC spans 3 availability zones with private subnets for ECS tasks and public subnets for ALB
- KMS customer-managed keys for encryption
- WAFv2 for web application protection
- X-Ray for distributed tracing
- Secrets Manager for secrets storage

**Required tools:**
- Pulumi CLI 3.x
- TypeScript 4.x
- Node.js 16+
- AWS CLI configured with appropriate credentials

**Pipeline integration:**
- CodeCommit for source control
- Blue-green deployment strategy
- KMS encryption for data at rest
- X-Ray tracing for observability
- WAF protection for web endpoints

---

## Implementation Guidelines

### Platform Requirements
- Use Pulumi as the IaC framework
- All code must be written in TypeScript
- Follow Pulumi best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming
- Use Pulumi AWS provider version 6.x or higher

### Security and Compliance (Enhanced)
- **Encryption at Rest**: Use customer-managed KMS keys for S3, CloudWatch Logs
- **Encryption in Transit**: TLS/SSL for all data transfers
- **Secrets Management**: Use Secrets Manager (not SSM) for sensitive data
- **Web Protection**: WAFv2 with rate limiting and managed rule groups
- **Least Privilege**: IAM roles with minimal permissions, no wildcards
- **Monitoring**: CloudWatch Logs with KMS encryption, X-Ray tracing enabled
- **Key Rotation**: Automatic KMS key rotation enabled
- **Resource Tagging**: All resources must have appropriate tags

### Observability and Tracing
- Enable X-Ray active tracing on all Lambda functions
- Configure X-Ray daemon for ECS tasks
- Set up X-Ray sampling rules (10% sample rate)
- Create CloudWatch dashboard with X-Ray service map
- Log X-Ray trace IDs in CloudWatch Logs for correlation

### Testing
- Write unit tests with good coverage for infrastructure code
- Integration tests must validate:
  - Pipeline execution end-to-end
  - KMS encryption for S3 and CloudWatch Logs
  - WAF rules blocking malicious requests
  - X-Ray traces appearing in console
  - Secrets Manager secret retrieval
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries OR created with deletion enabled
- KMS keys should use `removalPolicy: DESTROY` for test environments
- Avoid DeletionPolicy: Retain unless required

## Deployment Requirements (CRITICAL)

### Resource Naming
- **MANDATORY**: All named resources MUST include `environmentSuffix` in their names
- Pattern: `{resource-name}-${environmentSuffix}` or `{resource-name}-${props.environmentSuffix}`
- Examples:
  - S3 Bucket: `cicd-artifacts-${environmentSuffix}`
  - Lambda Function: `deploy-orchestrator-${environmentSuffix}`
  - KMS Key Alias: `alias/cicd-pipeline-${environmentSuffix}`
  - WAF Web ACL: `cicd-waf-${environmentSuffix}`
  - Secrets: `cicd/config/${environmentSuffix}`
- **Validation**: Every resource with a `name`, `bucketName`, `functionName`, `tableName`, `roleName`, `queueName`, `topicName`, `streamName`, `clusterName`, or `dbInstanceIdentifier` property MUST include environmentSuffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**:
  - `RemovalPolicy.RETAIN` (use `RemovalPolicy.DESTROY` instead)
  - `deletionProtection: true` (use `deletionProtection: false`)
  - `skip_final_snapshot: false` for RDS (use `skip_final_snapshot: true`)
- **Rationale**: CI/CD needs to clean up resources after testing
- **KMS Keys**: Set `pendingWindowInDays: 7` (minimum) to allow faster cleanup

### AWS Service-Specific Requirements

#### AWS KMS
- Create customer-managed keys (not AWS-managed)
- Enable automatic key rotation: `enableKeyRotation: true`
- Key policy must grant necessary permissions to services (CodePipeline, CloudWatch Logs, S3)
- Key alias format: `alias/cicd-pipeline-${environmentSuffix}`
- Set `removalPolicy: DESTROY` for test environments

#### AWS WAF v2
- Use `aws.wafv2.WebAcl` (NOT the legacy `aws.waf.*` resources)
- Scope: `REGIONAL` (for ALB/API Gateway) or `CLOUDFRONT` (for CloudFront)
- Rate limit rule: `RateBasedRule` with limit of 1000 requests per 5 minutes
- Managed rule groups:
  - `AWSManagedRulesCommonRuleSet` (priority 1)
  - `AWSManagedRulesKnownBadInputsRuleSet` (priority 2)
- Default action: `allow` (with rules blocking bad traffic)
- Associate Web ACL with ALB using `aws.wafv2.WebAclAssociation`

#### AWS X-Ray
- Lambda: Set `tracingConfig: { mode: "Active" }` on all functions
- ECS: Add X-Ray daemon as sidecar container in task definition
- Sampling rules: Create `aws.xray.SamplingRule` with 10% fixed rate
- Service role: Grant `xray:PutTraceSegments` and `xray:PutTelemetryRecords` permissions

#### AWS Secrets Manager
- Secret naming: `cicd/config/${environmentSuffix}/secret-name`
- Enable automatic rotation: `rotationRules: { automaticallyAfterDays: 30 }`
- Use secret ARN references in Lambda environment variables
- Grant Lambda execution role `secretsmanager:GetSecretValue` permission
- For RDS: Create rotation Lambda using AWS-managed template

#### Lambda Functions
- **Node.js 18.x+**: Use AWS SDK v3 (`@aws-sdk/client-*` packages)
- Enable X-Ray tracing: `tracingConfig: { mode: "Active" }`
- Grant permissions to access Secrets Manager, X-Ray, KMS
- Reserved concurrency: Use low values (1-5) if needed

#### CloudWatch Logs
- All log groups MUST use KMS encryption
- Create log group explicitly with `kmsKeyId` property
- Retention: 30 days (`retentionInDays: 30`)
- Grant KMS key permissions to CloudWatch Logs service

#### ECS (if used)
- Enable X-Ray daemon as sidecar container
- Task definition must include X-Ray daemon container
- Grant task role permissions for X-Ray and Secrets Manager
- Use Fargate or EC2 launch type with appropriate IAM roles

### Hardcoded Values (FORBIDDEN)
- **DO NOT** hardcode:
  - Environment names: `prod-`, `dev-`, `stage-`, `production`, `development`, `staging`
  - Account IDs: `123456789012`, `arn:aws:.*:.*:account`
  - Regions: Hardcoded `us-east-1` or `us-west-2` in resource names (use variables)
  - API keys or passwords (use Secrets Manager)
- **USE**: Environment variables, Pulumi config values, or parameters instead

### Cross-Resource References
- Ensure all resource references use proper ARNs or resource objects
- KMS key grants must be created for services that use encryption
- WAF Web ACL must be associated with ALB after both are created
- X-Ray sampling rules must be created before Lambda functions start tracing

## Code Examples (Reference - Pulumi TypeScript)

### Correct Resource Naming
```typescript
const artifactsBucket = new aws.s3.Bucket("artifacts", {
  bucket: `cicd-artifacts-${environmentSuffix}`,  // ✅ CORRECT
  versioning: { enabled: true },
});

// ❌ WRONG:
// bucket: 'cicd-artifacts-prod'  // Hardcoded, will fail
```

### KMS Key with Rotation
```typescript
const pipelineKey = new aws.kms.Key("pipelineKey", {
  description: `KMS key for CI/CD pipeline ${environmentSuffix}`,
  enableKeyRotation: true,  // ✅ CRITICAL
  deletionWindowInDays: 7,
  policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "Enable IAM User Permissions",
        Effect: "Allow",
        Principal: { AWS: `arn:aws:iam::${accountId}:root` },
        Action: "kms:*",
        Resource: "*",
      },
      {
        Sid: "Allow CloudWatch Logs",
        Effect: "Allow",
        Principal: { Service: "logs.amazonaws.com" },
        Action: ["kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey"],
        Resource: "*",
      },
    ],
  }),
});

const keyAlias = new aws.kms.Alias("pipelineKeyAlias", {
  name: `alias/cicd-pipeline-${environmentSuffix}`,
  targetKeyId: pipelineKey.id,
});
```

### WAFv2 Web ACL with Rate Limiting
```typescript
const webAcl = new aws.wafv2.WebAcl("cicdWaf", {
  name: `cicd-waf-${environmentSuffix}`,
  scope: "REGIONAL",
  defaultAction: { allow: {} },
  rules: [
    {
      name: "RateLimitRule",
      priority: 0,
      statement: {
        rateBasedStatement: {
          limit: 1000,
          aggregateKeyType: "IP",
        },
      },
      action: { block: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudwatchMetricsEnabled: true,
        metricName: "RateLimitRule",
      },
    },
    {
      name: "AWSManagedRulesCommon",
      priority: 1,
      statement: {
        managedRuleGroupStatement: {
          vendorName: "AWS",
          name: "AWSManagedRulesCommonRuleSet",
        },
      },
      overrideAction: { none: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudwatchMetricsEnabled: true,
        metricName: "AWSManagedRulesCommon",
      },
    },
  ],
  visibilityConfig: {
    sampledRequestsEnabled: true,
    cloudwatchMetricsEnabled: true,
    metricName: `cicd-waf-${environmentSuffix}`,
  },
});

// Associate WAF with ALB
const wafAssociation = new aws.wafv2.WebAclAssociation("albWafAssociation", {
  resourceArn: alb.arn,
  webAclArn: webAcl.arn,
});
```

### X-Ray Enabled Lambda Function
```typescript
const deployFunction = new aws.lambda.Function("deployOrchestrator", {
  name: `deploy-orchestrator-${environmentSuffix}`,
  runtime: "nodejs18.x",
  handler: "index.handler",
  role: lambdaRole.arn,
  tracingConfig: { mode: "Active" },  // ✅ X-Ray enabled
  environment: {
    variables: {
      SECRET_ARN: deploySecret.arn,  // Reference secret, don't hardcode
      AWS_XRAY_TRACING_NAME: `deploy-orchestrator-${environmentSuffix}`,
    },
  },
});

// Grant permissions
const lambdaPolicy = new aws.iam.RolePolicy("deployFunctionPolicy", {
  role: lambdaRole.id,
  policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
        Resource: "*",
      },
      {
        Effect: "Allow",
        Action: ["secretsmanager:GetSecretValue"],
        Resource: deploySecret.arn,
      },
    ],
  }),
});
```

### Secrets Manager Secret with Rotation
```typescript
const dbSecret = new aws.secretsmanager.Secret("dbCredentials", {
  name: `cicd/rds/${environmentSuffix}/master`,
  description: "RDS master credentials",
  kmsKeyId: pipelineKey.id,  // Encrypt with KMS
});

const secretVersion = new aws.secretsmanager.SecretVersion("dbSecretVersion", {
  secretId: dbSecret.id,
  secretString: JSON.stringify({
    username: "admin",
    password: "CHANGE_ME",  // Should be generated or provided via config
  }),
});

// Enable rotation (if RDS exists)
const rotationLambda = new aws.lambda.Function("secretRotation", {
  // ... Lambda configuration for rotation
});

const secretRotation = new aws.secretsmanager.SecretRotation("dbSecretRotation", {
  secretId: dbSecret.id,
  rotationLambdaArn: rotationLambda.arn,
  rotationRules: {
    automaticallyAfterDays: 30,
  },
});
```

### CloudWatch Log Group with KMS Encryption
```typescript
const logGroup = new aws.cloudwatch.LogGroup("pipelineLogs", {
  name: `/aws/codepipeline/${environmentSuffix}`,
  retentionInDays: 30,
  kmsKeyId: pipelineKey.arn,  // ✅ KMS encryption
});
```

## Target Region
All resources should be deployed to: **us-east-1**

## Success Criteria (Enhanced)

**Infrastructure Deployment:**
- ✅ CI/CD pipeline deploys successfully with all 5 stages
- ✅ All resources use environmentSuffix in naming
- ✅ Infrastructure can be cleanly destroyed

**Security (Original + Enhanced):**
- ✅ IAM roles follow least-privilege principle
- ✅ S3 artifacts bucket uses KMS encryption (not just AES256)
- ✅ CloudWatch Logs use KMS encryption
- ✅ KMS keys have automatic rotation enabled
- ✅ Secrets Manager stores sensitive configuration
- ✅ WAFv2 Web ACL protects ALB with rate limiting and managed rules

**Observability (Enhanced):**
- ✅ X-Ray tracing enabled for all Lambda functions
- ✅ X-Ray tracing enabled for ECS tasks (if applicable)
- ✅ X-Ray sampling rules configured (10% sample rate)
- ✅ CloudWatch Logs retain logs for 30 days with KMS encryption
- ✅ EventBridge rules capture pipeline state changes

**Testing:**
- ✅ Unit tests pass with good coverage
- ✅ Integration tests validate:
  - Pipeline execution end-to-end
  - KMS encryption working for S3 and CloudWatch
  - WAF blocking rate-limited requests
  - X-Ray traces visible in console
  - Secrets Manager secret retrieval successful
- ✅ All test outputs in `cfn-outputs/flat-outputs.json`

**Compliance:**
- ✅ No hardcoded environment names, account IDs, or regions
- ✅ All resources properly tagged
- ✅ Manual approval gate before production deployment
- ✅ Blue-green deployment strategy implemented
