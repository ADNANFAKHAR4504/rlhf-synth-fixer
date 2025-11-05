# Model Failures Documentation

## Issue 1: Route53 Health Check Configuration Error

**Problem**: Initial CDK synthesis failed with TypeScript error
```
error TS2353: Object literal may only specify known properties, 
and 'type' does not exist in type 'CfnHealthCheckProps'.
```

**Root Cause**: The `CfnHealthCheck` construct in CDK expects health check properties to be nested under a `healthCheckConfig` object, not as direct properties.

**Solution Applied**:
- Moved health check properties (`type`, `resourcePath`, `fullyQualifiedDomainName`, `port`, `requestInterval`, `failureThreshold`) into a `healthCheckConfig` nested object
- Updated `lib/multi-region-dr-stack.ts` lines 392-399

**Result**: CDK synthesis successful, all stacks compile without errors

**Reference**: AWS CDK CfnHealthCheck documentation

---

## Issue 2: S3 Cross-Region Replication Cyclic Dependency

**Problem**: CDK validation failed with cyclic dependency error
```
Template is undeployable, these resources have a dependency cycle: 
TransactionLogs -> ReplicationRole -> TransactionLogs
```

**Root Cause**: 
- IAM role was created with inline policies that referenced the S3 bucket ARN
- S3 bucket's replication configuration referenced the IAM role ARN
- This created a circular dependency: Bucket → Role → Bucket

**Solution Applied**:
- Changed from inline policies to separate `addToPolicy()` calls
- Added explicit dependency using `cfnBucket.addDependency()` to control the order
- Updated `lib/multi-region-dr-stack.ts` lines 109-169

**Result**: No cyclic dependencies, templates pass CDK validation

**Lesson**: When resources need to reference each other, use explicit dependencies and separate policy attachments instead of inline policies

---

## Issue 3: DynamoDB Point-in-Time Recovery Deprecation

**Problem**: CDK synthesis showed deprecation warning
```
[WARNING] aws-cdk-lib.aws_dynamodb.TableOptions#pointInTimeRecovery is deprecated.
use `pointInTimeRecoverySpecification` instead
```

**Root Cause**: The `pointInTimeRecovery` property was deprecated in favor of the more explicit `pointInTimeRecoverySpecification` object

**Solution Applied**:
- Changed from `pointInTimeRecovery: true` to:
  ```typescript
  pointInTimeRecoverySpecification: {
    pointInTimeRecoveryEnabled: true,
  }
  ```
- Updated `lib/global-resources-stack.ts` lines 41-43

**Result**: Zero deprecation warnings in CDK synthesis

---

## Issue 4: DynamoDB Resource Type in Tests

**Problem**: Unit test failed looking for wrong resource type
```
Expected 1 resources of type AWS::DynamoDB::GlobalTable but found 0
```

**Root Cause**: 
- CDK creates a `AWS::DynamoDB::Table` with replication configuration
- It does NOT create a separate `AWS::DynamoDB::GlobalTable` resource type
- Replication is handled through custom resources (`Custom::DynamoDBReplica`)

**Solution Applied**:
- Changed test to check for `AWS::DynamoDB::Table` instead of `AWS::DynamoDB::GlobalTable`
- Added check for `Custom::DynamoDBReplica` resources to verify replication is configured
- Updated `test/tap-stack.unit.test.ts` lines 27-39

**Result**: Test passes, correctly validates DynamoDB global table configuration

**Lesson**: CDK L2 constructs abstract CloudFormation resources - always check actual synthesized template to verify resource types

---

## Issue 5: Tag Assertion Failures in Tests

**Problem**: Tests failed with tag matching errors despite tags being present
```
Template has 1 resources with type AWS::EC2::VPC, but none match as expected.
Expected Environment but received DR-Role
```

**Root Cause**: 
- Tags are applied in a non-deterministic order
- Using strict array matching (`Match.arrayWith`) was too rigid
- CDK adds tags in different order than expected

**Solution Applied**:
- Changed from strict array matching to individual tag assertions
- Used `toContainEqual` to check for each tag independently
- Updated tag tests in `test/tap-stack.unit.test.ts` lines 183-194, 244-254

**Result**: All tag tests pass, correctly validate presence of all required tags

**Lesson**: When testing collections with non-deterministic order, test individual elements rather than full array structure

---

## Issue 6: Branch Coverage Below Threshold

**Problem**: Jest coverage report showed 87.5% branch coverage (required: 90%)
```
Jest: "global" coverage threshold for branches (90%) not met: 87.5%
Uncovered Line #s: 30
```

**Root Cause**: 
- Line 30: `const region = props.env?.region || 'us-east-1'`
- The fallback to `'us-east-1'` was never tested
- All tests provided explicit region values

**Solution Applied**:
- Added test case `should handle missing region with fallback` 
- Created stack without `env.region` property to trigger fallback logic
- Updated `test/tap-stack.unit.test.ts` lines 251-269

**Result**: 100% branch coverage achieved across all files

---

## Summary

**Final Status**:
- Lint: Passing (0 errors)
- Build: Successful compilation
- Synth: 3 stacks synthesized successfully
- Tests: 16/16 passing
- Coverage: 100% statements, 100% branches, 100% functions, 100% lines

**Key Principles Applied**:
1. Check actual CDK resource types in synthesized templates
2. Avoid cyclic dependencies with explicit dependency ordering
3. Use current (non-deprecated) API properties
4. Test individual elements in non-deterministic collections
5. Achieve full coverage by testing all code paths including fallbacks