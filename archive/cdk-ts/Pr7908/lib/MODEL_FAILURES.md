# Model Failures and Fixes

This document records all issues found in the generated infrastructure code and how they were resolved.

## Issue 1: ECR Lifecycle Policy Priority Misconfiguration

**Severity**: CRITICAL - Blocks synth

**Error**:
```
UnscopedValidationError: TagStatus.Any rule must have highest priority, has 1 which is smaller than 2
```

**Root Cause**:
The ECR lifecycle policy rules were configured with incorrect priorities. According to AWS ECR rules, any lifecycle rule with `TagStatus.ANY` must have the highest priority value (largest number). The original code had:
- Rule with `TagStatus.ANY` (implicit): priority 1
- Rule with `TagStatus.UNTAGGED`: priority 2

This violates ECR's requirement that `Any` rules must have the highest priority.

**Fix Applied**:
```typescript
lifecycleRules: [
  {
    description: 'Remove untagged images after 1 day',
    maxImageAge: Duration.days(1),
    rulePriority: 1,
    tagStatus: ecr.TagStatus.UNTAGGED,
  },
  {
    description: 'Keep only last 10 images',
    maxImageCount: 10,
    rulePriority: 2,
    tagStatus: ecr.TagStatus.ANY,
  },
],
```

**Location**: `/Users/mayanksethi/Desktop/projects/turing/iac-test-automations/worktree/synth-p6l1f9n0/lib/container-registry-construct.ts`

**Impact**: CDK synth now passes successfully without validation errors.

---

## Issue 2: Missing Test Coverage

**Severity**: HIGH - Prevents production deployment

**Error**:
No unit tests existed for the infrastructure code, resulting in 0% test coverage.

**Root Cause**:
The original implementation did not include any unit tests. Production requirements mandate 100% test coverage for all infrastructure code.

**Fix Applied**:
Created comprehensive unit test suites for all constructs:
- `test/tap-stack.unit.test.ts` - 17 tests for main stack
- `test/networking-construct.unit.test.ts` - 16 tests for VPC and networking
- `test/container-registry-construct.unit.test.ts` - 9 tests for ECR repository
- `test/ecs-deployment-construct.unit.test.ts` - 20 tests for ECS deployment
- `test/pipeline-construct.unit.test.ts` - 15 tests for CI/CD pipeline
- `test/monitoring-construct.unit.test.ts` - 13 tests for monitoring and alarms

**Test Results**:
```
Test Suites: 6 passed, 6 total
Tests:       90 passed, 90 total

Coverage:
File                             | % Stmts | % Branch | % Funcs | % Lines
---------------------------------|---------|----------|---------|--------
All files                        |     100 |      100 |     100 |     100
 container-registry-construct.ts |     100 |      100 |     100 |     100
 ecs-deployment-construct.ts     |     100 |      100 |     100 |     100
 monitoring-construct.ts         |     100 |      100 |     100 |     100
 networking-construct.ts         |     100 |      100 |     100 |     100
 pipeline-construct.ts           |     100 |      100 |     100 |     100
 tap-stack.ts                    |     100 |      100 |     100 |     100
```

**Impact**: Achieved 100% test coverage meeting production requirements.

---

## Summary of Quality Gates Status

| Quality Gate | Status | Notes |
|--------------|--------|-------|
| Lint | PASS | No linting errors |
| Build | PASS | TypeScript compilation successful |
| Synth | PASS | CDK synthesis completes without errors |
| Test Coverage | PASS | 100% coverage (90 tests, all passing) |
| Code Quality | PASS | Well-structured, follows CDK best practices |

---

## Best Practices Applied

### 1. ECR Lifecycle Policies
- Untagged images cleaned up after 1 day (priority 1)
- Keep only last 10 images across all tags (priority 2, TagStatus.ANY)
- Proper priority ordering ensures correct evaluation

### 2. Test Coverage Strategy
- Unit tests for each construct validate resource creation
- Tests verify resource properties match requirements
- Tests check security configurations (encryption, access controls)
- Tests validate auto-scaling configuration
- Tests ensure proper networking setup (VPC, subnets, endpoints)

### 3. Infrastructure Validation
- All resources properly tagged with environment suffix
- No hardcoded values (use context and props)
- Resources are destroyable (no Retain policies)
- Proper IAM role separation (execution vs task roles)

---

## Lessons Learned

1. **ECR Lifecycle Policy Rules**: Always ensure `TagStatus.ANY` rules have the highest priority value to avoid validation errors.

2. **Test-Driven Infrastructure**: Writing comprehensive unit tests before deployment catches configuration issues early and ensures all components work correctly.

3. **CDK Assertions**: Use `aws-cdk-lib/assertions` with `Template.fromStack()` for thorough resource property validation.

4. **Environment Variables in Tests**: When testing CodeBuild environment variables, remember they include a `Type` field (typically "PLAINTEXT") in addition to `Name` and `Value`.

5. **VPC Endpoint Testing**: Service names in VPC endpoints may use CloudFormation intrinsic functions, so tests should be flexible or verify counts rather than exact service names.
