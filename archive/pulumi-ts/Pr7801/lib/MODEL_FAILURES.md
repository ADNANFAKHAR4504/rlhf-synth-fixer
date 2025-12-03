# Common Model Failures for CI/CD Pipeline Integration

This document catalogs common mistakes and failures that LLMs make when implementing CI/CD pipeline infrastructure with Pulumi.

## 1. IAM Permission Issues

### Failure Pattern: Overly Permissive IAM Policies
**Problem**: Models often grant `*` permissions or use managed policies like `AdministratorAccess`
```typescript
// WRONG - Too permissive
const codeBuildPolicy = {
  Action: ["*"],
  Resource: ["*"]
}
```

**Correct Approach**: Use least-privilege with specific actions and scoped resources
```typescript
// CORRECT - Least privilege
const codeBuildPolicy = {
  Action: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
  Resource: [`${logGroupArn}:*`]
}
```

### Failure Pattern: Missing IAM Role Dependencies
**Problem**: CodeBuild project created before IAM role policy attached
```typescript
// WRONG - Missing dependsOn
const buildProject = new aws.codebuild.Project(name, {
  serviceRole: codeBuildRole.arn,
});
```

**Correct Approach**: Use explicit dependencies
```typescript
// CORRECT - Explicit dependency
const buildProject = new aws.codebuild.Project(name, {
  serviceRole: codeBuildRole.arn,
}, { dependsOn: [codeBuildPolicy] });
```

## 2. S3 Bucket Configuration Errors

### Failure Pattern: Missing Versioning
**Problem**: S3 bucket created without versioning for state files
```typescript
// WRONG - No versioning
const bucket = new aws.s3.Bucket(name, {});
```

**Correct Approach**: Enable versioning explicitly
```typescript
// CORRECT - Versioning enabled
const bucket = new aws.s3.Bucket(name, {
  versioning: { enabled: true }
});
```

### Failure Pattern: Public Access Not Blocked
**Problem**: Forgetting to block public access to artifacts bucket
```typescript
// WRONG - Missing public access block
const bucket = new aws.s3.Bucket(name, {});
```

**Correct Approach**: Create BucketPublicAccessBlock
```typescript
// CORRECT - Public access blocked
new aws.s3.BucketPublicAccessBlock(name, {
  bucket: bucket.id,
  blockPublicAcls: true,
  blockPublicPolicy: true,
  ignorePublicAcls: true,
  restrictPublicBuckets: true,
});
```

## 3. CodeBuild Configuration Issues

### Failure Pattern: Wrong Docker Image
**Problem**: Using generic Docker image without Pulumi CLI
```typescript
// WRONG - No Pulumi CLI
environment: {
  image: "aws/codebuild/standard:5.0"
}
```

**Correct Approach**: Use official Pulumi Docker image
```typescript
// CORRECT - Pulumi pre-installed
environment: {
  image: "pulumi/pulumi:latest"
}
```

### Failure Pattern: Missing Environment Variables
**Problem**: Buildspec references variables not defined in CodeBuild
```typescript
// WRONG - SNS_TOPIC_ARN not defined
buildspec: `aws sns publish --topic-arn $SNS_TOPIC_ARN`
```

**Correct Approach**: Define all variables in environment section
```typescript
// CORRECT - All variables defined
environment: {
  environmentVariables: [
    { name: 'SNS_TOPIC_ARN', value: notificationTopic.arn }
  ]
}
```

## 4. EventBridge Trigger Problems

### Failure Pattern: Missing EventBridge Role
**Problem**: EventTarget created without IAM role for starting builds
```typescript
// WRONG - No role specified
new aws.cloudwatch.EventTarget(name, {
  rule: buildTriggerRule.name,
  arn: buildProject.arn,
});
```

**Correct Approach**: Create dedicated IAM role for EventBridge
```typescript
// CORRECT - EventBridge role included
new aws.cloudwatch.EventTarget(name, {
  rule: buildTriggerRule.name,
  arn: buildProject.arn,
  roleArn: eventBridgeRole.arn,
});
```

### Failure Pattern: Incorrect Event Pattern
**Problem**: Event pattern doesn't match CodeCommit events
```typescript
// WRONG - Generic pattern
eventPattern: JSON.stringify({
  source: ["aws.codecommit"]
})
```

**Correct Approach**: Specific pattern for repository changes
```typescript
// CORRECT - Specific to repository and events
eventPattern: pulumi.interpolate`{
  "source": ["aws.codecommit"],
  "detail-type": ["CodeCommit Repository State Change"],
  "detail": {
    "event": ["referenceCreated", "referenceUpdated"],
    "repositoryName": ["${repository.repositoryName}"]
  }
}`
```

## 5. CloudWatch Logs Configuration

### Failure Pattern: No Retention Policy
**Problem**: Log group created without retention, causing unlimited storage costs
```typescript
// WRONG - No retention
const logGroup = new aws.cloudwatch.LogGroup(name, {
  name: logGroupName
});
```

**Correct Approach**: Set appropriate retention period
```typescript
// CORRECT - 7-day retention
const logGroup = new aws.cloudwatch.LogGroup(name, {
  name: logGroupName,
  retentionInDays: 7
});
```

### Failure Pattern: Log Group Not Created Before CodeBuild
**Problem**: CodeBuild fails if log group doesn't exist
```typescript
// WRONG - Race condition
const buildProject = new aws.codebuild.Project(name, {
  logsConfig: { cloudWatchLogs: { groupName: logGroup.name } }
});
```

**Correct Approach**: Use explicit dependency
```typescript
// CORRECT - Log group created first
const buildProject = new aws.codebuild.Project(name, {
  logsConfig: { cloudWatchLogs: { groupName: logGroup.name } }
}, { dependsOn: [logGroup] });
```

## 6. Buildspec Errors

### Failure Pattern: Interactive Pulumi Commands
**Problem**: Using interactive Pulumi commands in CI/CD
```bash
# WRONG - Interactive mode
pulumi preview --stack ${PULUMI_STACK}
```

**Correct Approach**: Use non-interactive flag
```bash
# CORRECT - Non-interactive
pulumi preview --stack ${PULUMI_STACK} --non-interactive
```

### Failure Pattern: Not Handling Build Failures
**Problem**: Build continues even when Pulumi preview fails
```bash
# WRONG - No error handling
pulumi preview --stack ${PULUMI_STACK}
echo "Build complete"
```

**Correct Approach**: Exit on failure
```bash
# CORRECT - Exit on error
pulumi preview --stack ${PULUMI_STACK} --non-interactive || exit 1
```

### Failure Pattern: Missing SNS Notification Logic
**Problem**: No notification sent when build fails
```bash
# WRONG - No failure notification
pulumi preview
```

**Correct Approach**: Check build status and notify
```bash
# CORRECT - Notify on failure
if [ $CODEBUILD_BUILD_SUCCEEDING -eq 0 ]; then
  aws sns publish --topic-arn ${SNS_TOPIC_ARN} \
    --message "Build failed" --subject "Build Failure"
fi
```

## 7. Resource Naming Issues

### Failure Pattern: Missing Environment Suffix
**Problem**: Resources not namespaced for multiple environments
```typescript
// WRONG - No environment differentiation
repositoryName: "pulumi-infra-validation"
```

**Correct Approach**: Include environment suffix
```typescript
// CORRECT - Environment-specific naming
repositoryName: `pulumi-infra-validation-${environmentSuffix}`
```

### Failure Pattern: Inconsistent Naming
**Problem**: Resources use different naming patterns
```typescript
// WRONG - Inconsistent
const repo = new aws.codecommit.Repository("repo", {
  repositoryName: "pulumi-validation-dev"
});
const bucket = new aws.s3.Bucket("bucket", {
  bucket: "artifacts-dev"
});
```

**Correct Approach**: Consistent naming pattern
```typescript
// CORRECT - Consistent prefix
const repo = new aws.codecommit.Repository(name, {
  repositoryName: `pulumi-infra-validation-${environmentSuffix}`
});
const bucket = new aws.s3.Bucket(name, {
  bucket: `pulumi-infra-artifacts-${environmentSuffix}`
});
```

## 8. Tagging Mistakes

### Failure Pattern: Missing Required Tags
**Problem**: Resources created without Environment and Project tags
```typescript
// WRONG - No tags
const repository = new aws.codecommit.Repository(name, {
  repositoryName: repoName
});
```

**Correct Approach**: Apply standard tags to all resources
```typescript
// CORRECT - Required tags
const baseTags = {
  Environment: 'CI',
  Project: 'InfraValidation'
};
const repository = new aws.codecommit.Repository(name, {
  repositoryName: repoName,
  tags: baseTags
});
```

## 9. Output Export Issues

### Failure Pattern: Missing Outputs
**Problem**: Important values not exported from stack
```typescript
// WRONG - No outputs
this.registerOutputs({});
```

**Correct Approach**: Export all important values
```typescript
// CORRECT - All outputs exported
this.registerOutputs({
  repositoryCloneUrlHttp: this.repositoryCloneUrlHttp,
  repositoryCloneUrlSsh: this.repositoryCloneUrlSsh,
  buildProjectName: this.buildProjectName,
  artifactBucketName: this.artifactBucketName,
  notificationTopicArn: this.notificationTopicArn,
  logGroupName: this.logGroupName,
});
```

### Failure Pattern: Outputs Not Exported in Entry Point
**Problem**: Stack outputs not exported from bin/tap.ts
```typescript
// WRONG - Outputs not accessible
new TapStack('pulumi-infra', {});
```

**Correct Approach**: Export stack outputs
```typescript
// CORRECT - Outputs exported
const stack = new TapStack('pulumi-infra', {});
export const repositoryUrl = stack.repositoryCloneUrlHttp;
export const buildProject = stack.buildProjectName;
```

## 10. Security Vulnerabilities

### Failure Pattern: Hardcoded Secrets
**Problem**: Sensitive values hardcoded in code
```typescript
// WRONG - Hardcoded token
environmentVariables: [
  { name: 'PULUMI_ACCESS_TOKEN', value: 'pul-abc123xyz' }
]
```

**Correct Approach**: Use placeholder or Secrets Manager
```typescript
// CORRECT - Placeholder for manual update
environmentVariables: [
  { name: 'PULUMI_ACCESS_TOKEN', value: 'REPLACE_WITH_YOUR_PULUMI_TOKEN' }
]
```

### Failure Pattern: Unencrypted S3 Bucket
**Problem**: Artifacts bucket without encryption
```typescript
// WRONG - No encryption
const bucket = new aws.s3.Bucket(name, {
  versioning: { enabled: true }
});
```

**Correct Approach**: Enable server-side encryption
```typescript
// CORRECT - Encryption enabled
const bucket = new aws.s3.Bucket(name, {
  versioning: { enabled: true },
  serverSideEncryptionConfiguration: {
    rule: {
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: 'AES256'
      }
    }
  }
});
```

## 11. Component Structure Issues

### Failure Pattern: Not Using ComponentResource
**Problem**: Creating resources directly without component pattern
```typescript
// WRONG - No component structure
export class TapStack {
  constructor() {
    const bucket = new aws.s3.Bucket('bucket', {});
  }
}
```

**Correct Approach**: Extend ComponentResource
```typescript
// CORRECT - Component pattern
export class TapStack extends pulumi.ComponentResource {
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);
    const bucket = new aws.s3.Bucket('bucket', {}, { parent: this });
  }
}
```

## 12. Testing Gaps

### Failure Pattern: No Integration Tests
**Problem**: Only unit tests provided, no real AWS validation
```typescript
// WRONG - Only mocked tests
describe('TapStack', () => {
  it('should create stack', () => {
    const stack = new TapStack('test', {});
    expect(stack).toBeDefined();
  });
});
```

**Correct Approach**: Include comprehensive integration tests
```typescript
// CORRECT - Real AWS validation
describe('Integration Tests', () => {
  it('should create CodeCommit repository', async () => {
    const client = new CodeCommitClient({});
    const response = await client.send(new GetRepositoryCommand({
      repositoryName: repoName
    }));
    expect(response.repositoryMetadata).toBeDefined();
  });
});
```

## Summary

The most critical failures to avoid:
1. Overly permissive IAM policies (security risk)
2. Missing resource dependencies (deployment failures)
3. No S3 versioning (state file corruption)
4. Wrong Docker image (Pulumi not available)
5. Missing EventBridge IAM role (pipeline won't trigger)
6. No log retention policy (cost issues)
7. Interactive Pulumi commands (CI/CD incompatible)
8. Missing environment suffix (multi-environment conflicts)
9. No required tags (organizational problems)
10. Missing integration tests (unvalidated infrastructure)

Each of these failures has been observed in LLM-generated code and should be specifically checked during code review.
