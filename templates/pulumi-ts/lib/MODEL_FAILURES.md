# MODEL_FAILURES.md

## Common Failures and Anti-Patterns in CI/CD Pipeline Implementation

### 1. Security Vulnerabilities

#### Missing Encryption
**Failure**: S3 bucket without server-side encryption
```typescript
// WRONG
const bucket = new aws.s3.Bucket("artifacts", {
  versioning: { enabled: true }
});
```
**Impact**: Data at rest not encrypted, fails compliance requirements
**Fix**: Always enable KMS encryption for S3 buckets

#### Public S3 Bucket
**Failure**: Not blocking public access to artifacts bucket
```typescript
// WRONG - Missing BucketPublicAccessBlock
const bucket = new aws.s3.Bucket("artifacts");
```
**Impact**: Pipeline artifacts potentially exposed publicly
**Fix**: Always add BucketPublicAccessBlock with all options set to true

#### Hardcoded Secrets
**Failure**: GitHub token hardcoded in pipeline configuration
```typescript
// WRONG
configuration: {
  OAuthToken: "ghp_xxxxxxxxxxxx"
}
```
**Impact**: Secrets exposed in code repository and state files
**Fix**: Store secrets in SSM Parameter Store with KMS encryption

#### Overly Permissive IAM
**Failure**: Using wildcards in IAM policies
```typescript
// WRONG
Resource: "*"
```
**Impact**: Violates least privilege principle, security risk
**Fix**: Use explicit resource ARNs wherever possible

### 2. Resource Management Issues

#### Missing Lifecycle Policies
**Failure**: ECR repository without lifecycle policy
```typescript
// WRONG - Missing ECR lifecycle policy
const repo = new aws.ecr.Repository("app-repo");
```
**Impact**: Unlimited image retention leads to high storage costs
**Fix**: Always configure lifecycle policy (e.g., retain last 10 images)

#### No S3 Expiration Rules
**Failure**: Artifact bucket without lifecycle expiration
```typescript
// WRONG - No lifecycle rules
const bucket = new aws.s3.Bucket("artifacts", {
  versioning: { enabled: true }
});
```
**Impact**: Old artifacts accumulate indefinitely, increasing costs
**Fix**: Set lifecycle expiration (e.g., 30 days for artifacts)

#### Missing CloudWatch Log Retention
**Failure**: Log group without retention policy
```typescript
// WRONG
const logGroup = new aws.cloudwatch.LogGroup("build-logs");
```
**Impact**: Logs retained forever, increased costs
**Fix**: Set appropriate retention (e.g., 7 days for build logs)

### 3. Pipeline Configuration Errors

#### Incorrect Build Timeout
**Failure**: No timeout or excessive timeout on CodeBuild
```typescript
// WRONG
buildTimeout: 480 // 8 hours - too long
```
**Impact**: Hanging builds waste resources and delay feedback
**Fix**: Set reasonable timeout (e.g., 15 minutes for Docker builds)

#### Missing Privileged Mode
**Failure**: CodeBuild without privileged mode for Docker
```typescript
// WRONG
environment: {
  type: "LINUX_CONTAINER",
  privilegedMode: false // or omitted
}
```
**Impact**: Docker builds fail with permission errors
**Fix**: Enable privilegedMode: true for Docker-based builds

#### Wrong Image Version
**Failure**: Using outdated or custom build images
```typescript
// WRONG
image: "aws/codebuild/standard:2.0" // outdated
```
**Impact**: Missing tools, security vulnerabilities, inconsistent builds
**Fix**: Use latest AWS managed images (e.g., standard:5.0)

### 4. Deployment Configuration Issues

#### Missing Deployment Validation
**Failure**: No post-deployment validation or health checks
```typescript
// WRONG - Deploy stage with no validation
Deploy -> End
```
**Impact**: Failed deployments not detected, broken applications in production
**Fix**: Add Lambda validation function to verify deployment success

#### Incorrect ECS Service Configuration
**Failure**: CodePipeline targeting non-existent ECS service
```typescript
// WRONG
ServiceName: "app-service" // service doesn't exist
```
**Impact**: Deployment failures, pipeline stuck
**Fix**: Ensure ECS cluster and service exist before pipeline deployment

#### Missing imagedefinitions.json
**Failure**: CodeBuild not generating imagedefinitions.json
```typescript
// WRONG - Missing from buildspec artifacts
artifacts:
  files:
    - '**/*' // no imagedefinitions.json
```
**Impact**: ECS deployment fails, no image reference
**Fix**: Generate imagedefinitions.json in post_build phase

### 5. Monitoring and Alerting Gaps

#### No Build Failure Notifications
**Failure**: Pipeline without SNS notifications
```typescript
// WRONG - No SNS topic or CloudWatch Events for failures
```
**Impact**: Team unaware of build failures, delayed fixes
**Fix**: Configure CloudWatch Events to publish build failures to SNS

#### Missing CloudWatch Logs Integration
**Failure**: CodeBuild without CloudWatch Logs
```typescript
// WRONG
logsConfig: {} // empty or missing
```
**Impact**: No build logs for troubleshooting
**Fix**: Configure CloudWatch Logs with appropriate retention

#### No Deployment State Tracking
**Failure**: No audit trail for deployments
```typescript
// WRONG - No DynamoDB or database for deployment history
```
**Impact**: Cannot track deployment history or rollback effectively
**Fix**: Use DynamoDB to record deployment metadata

### 6. Testing and Quality Issues

#### Missing Unit Tests
**Failure**: No test coverage for infrastructure code
```typescript
// WRONG - No test files in test/ directory
```
**Impact**: Infrastructure changes not validated, bugs in production
**Fix**: Create comprehensive unit and integration tests

#### Insufficient Test Coverage
**Failure**: Tests only cover happy path
```typescript
// WRONG
it('creates stack', () => {
  expect(stack).toBeDefined();
});
// Missing: edge cases, error scenarios, configuration variations
```
**Impact**: Bugs not caught in edge cases
**Fix**: Test multiple configurations, edge cases, and error scenarios

#### No Pulumi Mocks
**Failure**: Tests attempting real AWS API calls
```typescript
// WRONG - No pulumi.runtime.setMocks()
```
**Impact**: Tests slow, expensive, and dependent on AWS credentials
**Fix**: Use Pulumi runtime mocks for fast, deterministic tests

### 7. Resource Dependency Errors

#### Missing dependsOn
**Failure**: Resources created in wrong order
```typescript
// WRONG
const project = new aws.codebuild.Project(...);
const policy = new aws.iam.RolePolicy(...); // created after project
```
**Impact**: Resources reference non-existent dependencies, deployment fails
**Fix**: Use dependsOn to ensure correct creation order

#### Circular Dependencies
**Failure**: Resources depending on each other
```typescript
// WRONG
const roleA = new aws.iam.Role("a", {
  assumeRolePolicy: roleB.arn
});
const roleB = new aws.iam.Role("b", {
  assumeRolePolicy: roleA.arn
});
```
**Impact**: Pulumi cannot resolve dependency order, deployment fails
**Fix**: Restructure to eliminate circular dependencies

### 8. Tagging and Organization Issues

#### Missing Resource Tags
**Failure**: Resources without Environment, Project, or ManagedBy tags
```typescript
// WRONG
const bucket = new aws.s3.Bucket("artifacts"); // no tags
```
**Impact**: Cannot track costs, ownership, or filter resources
**Fix**: Apply consistent tags to all resources

#### Inconsistent Naming Convention
**Failure**: Random resource names without pattern
```typescript
// WRONG
"my-bucket", "build_project_1", "pipeline-prod-xyz"
```
**Impact**: Difficult to identify resources, troubleshoot issues
**Fix**: Use consistent pattern: {service}-{type}-{env}

### 9. Output and Integration Issues

#### Missing Stack Outputs
**Failure**: Not exporting critical resource identifiers
```typescript
// WRONG
this.registerOutputs({}); // empty outputs
```
**Impact**: Other stacks or applications cannot integrate with pipeline
**Fix**: Export all critical outputs (pipeline name, ECR URI, etc.)

#### Incorrect Output Types
**Failure**: Outputs not properly typed
```typescript
// WRONG
public readonly pipelineName: any;
```
**Impact**: TypeScript loses type safety
**Fix**: Use proper Pulumi Output types: Output<string>

### 10. Documentation and Maintainability

#### No Inline Comments
**Failure**: Complex logic without explanations
```typescript
// WRONG - No comments explaining IAM policy structure
```
**Impact**: Difficult to maintain, understand, or modify
**Fix**: Add comments for complex configurations

#### Missing README or Documentation
**Failure**: No documentation on how to deploy or configure pipeline
```typescript
// WRONG - No PROMPT.md, MODEL_RESPONSE.md, or deployment guide
```
**Impact**: New team members cannot understand or deploy pipeline
**Fix**: Create comprehensive documentation files

### Summary of Common Failures

1. **Security**: Unencrypted data, public S3 buckets, hardcoded secrets, overly permissive IAM
2. **Cost Management**: No lifecycle policies, no log retention, unlimited resource retention
3. **Build Configuration**: Wrong timeouts, missing privileged mode, outdated images
4. **Deployment**: No validation, incorrect service names, missing imagedefinitions.json
5. **Monitoring**: No notifications, no logging, no deployment tracking
6. **Testing**: Missing tests, insufficient coverage, no mocks
7. **Dependencies**: Wrong order, circular dependencies
8. **Organization**: Missing tags, inconsistent naming
9. **Integration**: Missing outputs, incorrect types
10. **Documentation**: No comments, no README

### How This Implementation Avoids These Failures

This implementation:
- Encrypts all data at rest with KMS
- Blocks S3 public access
- Stores secrets in SSM Parameter Store
- Uses explicit IAM resource ARNs
- Configures lifecycle policies for S3 and ECR
- Sets appropriate log retention (7 days)
- Uses correct CodeBuild settings (privileged mode, timeout, standard:5.0 image)
- Validates deployments with Lambda
- Tracks deployments in DynamoDB
- Sends SNS notifications on build failures
- Integrates CloudWatch Logs
- Includes comprehensive unit and integration tests
- Uses Pulumi runtime mocks
- Manages dependencies with dependsOn
- Tags all resources consistently
- Uses consistent naming convention
- Exports all critical outputs
- Properly types all outputs
- Includes inline comments
- Provides complete documentation

**Training Quality Impact**: Understanding and avoiding these failures differentiates good implementations (training quality 5-6) from excellent ones (training quality 8-10).
