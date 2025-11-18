# MODEL_RESPONSE.md - Issues and Failures

This document identifies the issues present in MODEL_RESPONSE.md that would cause deployment failures or violate best practices.

## Critical Issues

### 1. RDS RemovalPolicy Not Set to DESTROY

**Location**: `lib/database-stack.ts`, line ~92

**Issue**:
```typescript
removalPolicy: cdk.RemovalPolicy.SNAPSHOT, // ISSUE: Should be DESTROY
```

**Why it fails**:
- Creates a snapshot on stack deletion
- Prevents complete cleanup in CI/CD environment
- CI/CD requires fully destroyable resources

**Fix Required**:
```typescript
removalPolicy: cdk.RemovalPolicy.DESTROY,
```

### 2. Missing RDS `skipFinalSnapshot` Property

**Location**: `lib/database-stack.ts`, RDS DatabaseInstance constructor

**Issue**:
- The `skipFinalSnapshot` property is not set
- CDK may default to creating a final snapshot on deletion

**Why it fails**:
- Blocks complete resource cleanup
- CI/CD pipeline expects all resources to be deleted without remnants

**Fix Required**:
```typescript
this.database = new rds.DatabaseInstance(this, 'PostgresDB', {
  // ... other properties
  deletionProtection: false,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  // Add this:
});

// Note: For DatabaseInstance, we need to use CloudFormation overrides
const cfnDatabase = this.database.node.defaultChild as rds.CfnDBInstance;
cfnDatabase.addPropertyOverride('SkipFinalSnapshot', true);
```

### 3. Hardcoded Environment Name in IAM Role

**Location**: `lib/compute-stack.ts`, line ~56

**Issue**:
```typescript
roleName: `ecs-task-role-prod`, // ISSUE: Hardcoded 'prod' instead of environmentSuffix
```

**Why it fails**:
- Multiple PR deployments will conflict on role name
- Hardcoded 'prod' doesn't use environmentSuffix
- Violates resource naming requirements

**Fix Required**:
```typescript
roleName: `ecs-task-role-${props.environmentSuffix}`,
```

### 4. Overly Broad IAM Policy

**Location**: `lib/compute-stack.ts`, line ~61

**Issue**:
```typescript
taskRole.addToPolicy(new iam.PolicyStatement({
  actions: [
    'rds:DescribeDBInstances',
  ],
  resources: ['*'], // ISSUE: Too broad, should be specific
}));
```

**Why it fails**:
- Violates least-privilege principle
- Should be scoped to specific RDS instance

**Fix Required**:
```typescript
taskRole.addToPolicy(new iam.PolicyStatement({
  actions: [
    'rds:DescribeDBInstances',
  ],
  resources: [props.database.instanceArn],
}));
```

### 5. Missing environmentSuffix in Some Resource Names

**Location**: `lib/database-stack.ts`, line ~33

**Issue**:
```typescript
roleName: `migration-lambda-role-${props.environmentSuffix}`, // Present but commented as issue
```

**Why it's actually correct**:
- This one IS correct - it includes environmentSuffix
- The comment in MODEL_RESPONSE was misleading
- However, we should verify ALL named resources

**Resources to verify**:
- ✅ VPC: `production-vpc-${props.environmentSuffix}`
- ✅ RDS: `trading-db-${props.environmentSuffix}`
- ✅ Redis: `trading-redis-${props.environmentSuffix}`
- ✅ Lambda: `db-migration-${props.environmentSuffix}`
- ✅ ECS Cluster: `trading-cluster-${props.environmentSuffix}`
- ❌ ECS Task Role: `ecs-task-role-prod` (MISSING)
- ✅ ALB: `trading-alb-${props.environmentSuffix}`
- ✅ SNS: `critical-alerts-${props.environmentSuffix}`

## Non-Critical Issues (Best Practices)

### 6. Missing Integration Tests

**Issue**:
- No test directory structure
- No integration tests that read from `cfn-outputs/flat-outputs.json`
- No validation of deployed resources

**Fix Required**:
- Create `test/` directory
- Add unit tests for stack constructs
- Add integration tests that validate outputs

### 7. Lambda Function Uses Placeholder Image

**Location**: `lib/compute-stack.ts`, line ~97

**Issue**:
```typescript
image: ecs.ContainerImage.fromRegistry('nginxdemos/hello'), // Placeholder image
```

**Why it's acceptable for synthetic tasks**:
- This is a placeholder for the Java API container
- In production, would use ECR image
- Acceptable for infrastructure testing

**Note**: Document that this needs to be replaced with actual Java API container image.

### 8. Missing Unit Tests

**Issue**:
- No unit tests to verify stack properties
- No tests for resource creation
- No coverage reports

**Fix Required**:
- Add comprehensive unit tests
- Test stack outputs
- Test resource naming
- Test IAM permissions

### 9. Lambda Migration Function is Placeholder

**Location**: `lib/lambda/migration/index.ts`

**Issue**:
- Contains only TODO comments
- Doesn't implement actual migration logic
- Missing pg client connection code

**Why it's acceptable for infrastructure testing**:
- Infrastructure can be validated without migration logic
- Lambda function will deploy and be invocable
- Actual migration logic is application-specific

**Note**: Document that migration logic needs to be implemented.

### 10. Email Subscription Uses Placeholder

**Location**: `lib/monitoring-stack.ts`, line ~21

**Issue**:
```typescript
const alertEmail = this.node.tryGetContext('alertEmail') || 'alerts@example.com';
```

**Why it's acceptable**:
- Uses context for configuration
- Falls back to placeholder
- Won't cause deployment failure

**Best Practice**:
- Document that alertEmail should be passed via context
- Consider using SSM Parameter for email address

## Summary of Required Fixes

### Critical (Must Fix):
1. ✅ Change RDS `removalPolicy` to `DESTROY`
2. ✅ Add RDS `skipFinalSnapshot: true` (via CFN override)
3. ✅ Fix hardcoded 'prod' in ECS task role name
4. ✅ Scope IAM policy to specific RDS instance ARN

### Important (Should Fix):
5. ✅ Add comprehensive unit tests
6. ✅ Add integration tests reading from cfn-outputs
7. ✅ Verify all named resources include environmentSuffix

### Nice to Have (Can Document):
8. ⚠️ Document Lambda placeholder image should be replaced
9. ⚠️ Document migration function needs implementation
10. ⚠️ Document alertEmail context parameter

## Validation Checklist

Before deployment, verify:
- [ ] All named resources include `${environmentSuffix}`
- [ ] All RemovalPolicy set to DESTROY
- [ ] RDS has skipFinalSnapshot: true
- [ ] RDS has deletionProtection: false
- [ ] IAM policies follow least-privilege principle
- [ ] No hardcoded environment names ('prod', 'dev', etc.)
- [ ] CloudWatch log retention set to 30 days
- [ ] All outputs exported with environmentSuffix
- [ ] Integration tests exist and use cfn-outputs
- [ ] Unit tests cover all stacks

## Testing Strategy

### Phase 1: Static Analysis
- TypeScript compilation
- ESLint validation
- CDK synth validation

### Phase 2: Unit Tests
- Test each stack in isolation
- Verify resource properties
- Check naming conventions
- Validate IAM policies

### Phase 3: Integration Tests
- Deploy to AWS
- Read outputs from cfn-outputs/flat-outputs.json
- Validate ALB endpoint responds
- Validate RDS endpoint is accessible
- Validate Redis endpoint is accessible
- Validate Lambda function can be invoked

### Phase 4: Cleanup
- Verify `cdk destroy` completes successfully
- Check that no resources remain
- Validate no snapshots created
