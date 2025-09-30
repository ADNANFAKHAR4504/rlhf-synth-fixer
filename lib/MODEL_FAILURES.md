# Model Failures and Lessons Learned

## Critical Issues Encountered

### 🔴 Circular Dependency Crisis

**Problem**: Initial implementation created a circular dependency between KMS key, S3 bucket, and CodeBuild role.

**Error**:

```
PipelineEncryptionKey7CFF899D -> CodeBuildRole728CBADE -> PipelineArtifacts4A9B2621 -> PipelineEncryptionKey7CFF899D
```

**Root Cause**:

- S3 bucket configured with KMS encryption referencing the KMS key
- CodeBuild role policy referencing S3 bucket ARN
- KMS key policy granting permissions to CodeBuild role

**Resolution**:

- Changed S3 bucket to use `S3_MANAGED` encryption instead of KMS
- Removed KMS permissions from CodeBuild role
- Kept KMS key only for Secrets Manager encryption

### 🔴 TypeScript Compilation Errors

**Problems Identified**:

1. `encryptionKey` property incorrectly used in CodePipeline
2. `cfnCapabilities` property name mismatch (should be `cloudFormationCapabilities`)
3. Missing CloudWatch metric implementation for cost monitoring
4. Hardcoded values throughout the infrastructure

**Resolutions**:

- Removed deprecated `encryptionKey` from CodePipeline configuration
- Fixed property names to match CDK v2 API
- Implemented proper CloudWatch custom metrics
- Created parameterized resource naming system

### 🔴 Test Architecture Issues

**Problems**:

- Tests failing due to circular dependencies
- Missing CloudWatch managed policies for Lambda
- Incorrect resource naming pattern validation
- S3 bucket name length validation issues

**Lessons Learned**:

- Always validate CloudFormation template generation before writing tests
- CDK construct properties change between versions - verify API documentation
- Resource dependencies must be carefully planned to avoid cycles

## Common Anti-Patterns Avoided

### ❌ Bad: Hardcoded Resource Names

```typescript
bucketName: 'my-pipeline-bucket';
```

### ✅ Good: Parameterized Naming

```typescript
bucketName: `${createResourceName('artifacts')}-${this.account}-${this.region}`;
```

### ❌ Bad: Circular KMS Dependencies

```typescript
// S3 bucket uses KMS key
encryption: s3.BucketEncryption.KMS,
encryptionKey: kmsKey,

// CodeBuild role needs S3 access
resources: [artifactBucket.bucketArn]

// KMS key grants access to CodeBuild role
principals: [codeBuildRole.roleArn]
```

### ✅ Good: Separated Encryption Concerns

```typescript
// S3 uses AWS managed encryption
encryption: s3.BucketEncryption.S3_MANAGED,

// KMS only for Secrets Manager
encryptionKey: kmsKey // Only for secrets
```

## Development Process Failures

### 🔄 Iterative Problem Solving Required

1. **First Attempt**: Direct KMS encryption everywhere → Circular dependency
2. **Second Attempt**: Remove KMS from CodeBuild → Still circular due to S3
3. **Third Attempt**: AWS managed S3 encryption → Success

### 📚 Documentation Gaps

- CDK v2 property changes not immediately obvious
- Circular dependency detection requires template generation
- Test structure assumptions didn't match actual resource creation

## Prevention Strategies

### 🛡️ Architectural Reviews

- Always diagram resource dependencies before implementation
- Use CDK `cdk synth` early and often to validate templates
- Implement incremental testing approach

### 🧪 Testing Best Practices

- Test compilation before complex logic
- Validate CloudFormation template generation
- Use parameterized tests for different deployment scenarios

### 📖 Knowledge Management

- Keep track of CDK version-specific property names
- Document common circular dependency patterns
- Maintain examples of working resource configurations

## Success Metrics

### ✅ Resolution Indicators

- All TypeScript compilation errors resolved
- CDK synthesis succeeds without circular dependencies
- Unit tests pass with proper resource validation
- Integration tests validate cross-service interactions
- Infrastructure can be deployed across multiple accounts/regions
