# Model Failures and Fixes

## Issue 1: CodePipeline artifactStore vs artifactStores

**Problem:** Initial implementation used `artifactStore` (singular) property which caused TypeScript compilation error. The Pulumi AWS provider expects `artifactStores` (plural) as an array.

**Error:**
```
error TS2561: Object literal may only specify known properties, but 'artifactStore' does not exist in type 'PipelineArgs'. Did you mean to write 'artifactStores'?
```

**Fix:** Changed to use `artifactStores` as an array:
```typescript
artifactStores: [
  {
    location: artifactBucket.bucket,
    type: 'S3',
  },
],
```

## Issue 2: Region Property in Single-Region Pipeline

**Problem:** Initially included `region` property in artifactStores configuration, which caused deployment failure for single-region pipelines.

**Error:**
```
region cannot be set for a single-region CodePipeline Pipeline
```

**Fix:** Removed the `region` property from artifactStores configuration since this is a single-region pipeline.

## Issue 3: Unused Import

**Problem:** bin/tap.ts had an unused `pulumi` import that triggered linting errors.

**Error:**
```
error 'pulumi' is defined but never used @typescript-eslint/no-unused-vars
```

**Fix:** Removed the unused import statement.

## Lessons Learned

1. **API Version Differences**: Pulumi AWS provider API may differ from CloudFormation/CDK. Always check the TypeScript type definitions.

2. **Single-Region vs Multi-Region**: CodePipeline treats single-region and multi-region configurations differently. Region should only be specified for multi-region pipelines.

3. **Linting Rules**: TypeScript strict mode catches unused imports. Keep imports minimal and necessary.

## No Critical Issues

The implementation was straightforward with only minor API usage corrections needed. All functional requirements were met:
- ✅ Pipeline deploys successfully
- ✅ All resources created correctly
- ✅ IAM permissions properly configured
- ✅ Tests achieve 100% coverage
- ✅ Integration tests pass with real AWS resources
