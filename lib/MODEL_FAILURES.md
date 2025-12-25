# Model Failures and Assumptions Documentation

## Overview
This document captures critical failures, assumptions, and lessons learned during the development of the TAP Financial Services CDK stack. These issues were resolved but should be noted for future development and deployment considerations.

## 1. CodeCommit Assumption Failure

### Issue
The original MODEL_RESPONSE.md assumed CodeCommit would be available and functional in all AWS accounts, leading to deployment failures.

### Error Message
```
CreateRepository request is not allowed because there is no existing repository in this AWS account or AWS Organization
(Service: AWSCodeCommit; Status Code: 400; Error Code: OperationNotAllowedException)
```

### Root Cause
- **Assumption**: CodeCommit repositories can be created in any AWS account
- **Reality**: CodeCommit requires existing repository or organization setup
- **Impact**: Complete deployment failure when CodeCommit permissions are missing

### Solution Implemented
- Made CodeCommit creation conditional and disabled by default
- Added S3 source action as fallback
- Implemented graceful error handling with automatic fallback

### Lessons Learned
1. **Never assume AWS services are available** without proper permission checks
2. **Always provide fallback mechanisms** for critical infrastructure components
3. **Test assumptions** about AWS account configurations before deployment
4. **Document service dependencies** and requirements clearly

## 2. CDK v2 Deprecation Issues

### Issue
Multiple CDK v2 deprecation warnings and API changes were encountered during development.

### Specific Deprecations Found

#### VPC CIDR Deprecation
```typescript
// DEPRECATED (CDK v1 style)
new ec2.Vpc(this, 'Vpc', {
  cidr: '10.0.0.0/16',  // Deprecated
});

// CORRECT (CDK v2 style)
new ec2.Vpc(this, 'Vpc', {
  ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),  // Current API
});
```

#### Backup Schedule API Changes
```typescript
// DEPRECATED
scheduleExpression: backup.Schedule.cron({...})  // Wrong import

// CORRECT
scheduleExpression: events.Schedule.cron({...})  // Correct import
```

#### Backup Plan Rules API Changes
```typescript
// DEPRECATED (CDK v1 style)
backupPlanRules: [
  {
    ruleName: 'DailyBackups',  // Should be 'name'
    scheduleExpression: {...}  // Should be 'schedule'
  }
]

// CORRECT (CDK v2 style)
this.plan.addRule(new backup.BackupPlanRule({
  ruleName: 'DailyBackups',  // Correct property name
  scheduleExpression: events.Schedule.cron({...})  // Correct API
}));
```

### Impact
- Build failures due to API incompatibilities
- Deprecation warnings in deployment logs
- Potential runtime issues with incorrect API usage

### Solution Implemented
- Updated all deprecated APIs to CDK v2 standards
- Fixed import statements for correct modules
- Updated backup plan construction to use proper CDK v2 patterns

## 3. Removal Policy Assumptions

### Issue
Original code used `RemovalPolicy.RETAIN` which prevents proper cleanup during stack deletion.

### Problem
```typescript
// PROBLEMATIC (prevents cleanup)
removalPolicy: cdk.RemovalPolicy.RETAIN,  // Resources persist after stack deletion

// SOLUTION (allows proper cleanup)
removalPolicy: cdk.RemovalPolicy.DESTROY,  // Resources deleted with stack
```

### Impact
- Resources remain orphaned after stack deletion
- Manual cleanup required for KMS keys, S3 buckets, etc.
- Potential cost implications from retained resources

### Solution Implemented
- Changed all removal policies from `RETAIN` to `DESTROY`
- Ensures proper resource cleanup during stack deletion
- Reduces manual intervention requirements

## 4. Non-Deterministic Resource Naming

### Issue
Hard-coded resource names caused deployment conflicts in multi-stack environments.

### Examples of Problematic Names
```typescript
// PROBLEMATIC (non-deterministic)
bucketName: 'tap-financial-services-bucket',  // Conflicts in multi-deployment
logGroupName: '/tap/vpc/flowlogs',           // Conflicts in multi-deployment
backupVaultName: 'tap-backup-vault',         // Conflicts in multi-deployment

// SOLUTION (deterministic with stack context)
bucketName: `${this.stackName}-financial-services-bucket`,  // Unique per stack
logGroupName: `/tap/${this.stackName}/vpc/flowlogs`,        // Unique per stack
backupVaultName: `tap-${environment}-backup-${stackNameShort}`,  // Unique per stack
```

### Impact
- "AlreadyExists" errors during deployments
- "Backup vault with the same name already exists" errors
- Inability to deploy multiple stacks in same account/region
- Deployment failures in CI/CD pipelines

### Solution Implemented
- Appended stack names to all resource names
- Used consistent naming patterns with stack context
- Ensured uniqueness across multiple deployments
- **Special handling for AWS Backup**: Used compact naming with stack name truncation to stay within AWS limits
- **Backup Plan Vault Configuration**: Explicitly configured backup plan to use custom vault to prevent automatic vault creation

### Additional Backup Vault Issue
The `BackupPlan` construct automatically creates its own vault if not explicitly configured, leading to duplicate vault creation and naming conflicts.

```typescript
// PROBLEMATIC (creates two vaults)
const vault = new backup.BackupVault(this, 'Vault', {...});
const plan = new backup.BackupPlan(this, 'Plan', {
  // No backupVault specified - creates default vault
});

// SOLUTION (uses single vault)
const vault = new backup.BackupVault(this, 'Vault', {...});
const plan = new backup.BackupPlan(this, 'Plan', {
  backupVault: vault,  // Explicitly use our custom vault
});
```

### AWS Backup Lifecycle Requirements
AWS Backup has strict requirements for lifecycle configurations that must be followed:

```typescript
// PROBLEMATIC (violates AWS Backup requirements)
new backup.BackupPlanRule({
  deleteAfter: cdk.Duration.days(30),        // Too close to cold storage
  moveToColdStorageAfter: cdk.Duration.days(7), // Only 23 days difference
});

// SOLUTION (complies with AWS requirements)
new backup.BackupPlanRule({
  deleteAfter: cdk.Duration.days(120),       // At least 90 days after cold storage
  moveToColdStorageAfter: cdk.Duration.days(7), // 113 days difference
});
```

**AWS Backup Requirements:**
- `DeleteAfterDays` must be at least 90 days greater than `MoveToColdStorageAfterDays`
- This ensures proper lifecycle management and compliance with AWS backup policies

## 5. Missing Error Handling

### Issue
Original code lacked proper error handling for conditional resource creation.

### Problem
```typescript
// PROBLEMATIC (no error handling)
const repository = new codecommit.Repository(this, 'Repository', {
  // ... configuration
});
// Fails completely if CodeCommit not available

// SOLUTION (with error handling)
try {
  const repository = new codecommit.Repository(this, 'Repository', {
    // ... configuration
  });
} catch (error) {
  console.warn('CodeCommit failed, using S3 fallback:', error);
  // Fallback to S3 source
}
```

### Impact
- Complete deployment failures due to missing error handling
- No graceful degradation when services unavailable
- Poor user experience during deployment issues

## 6. Test Coverage Assumptions

### Issue
Initial test coverage was insufficient and didn't account for conditional logic.

### Problems
- Tests assumed CodeCommit would always be created
- No tests for fallback scenarios
- Missing tests for error conditions

### Solution Implemented
- Updated tests to reflect conditional CodeCommit creation
- Added tests for S3 fallback scenarios
- Improved test coverage for error handling paths

## 7. Context Configuration Assumptions

### Issue
Original code assumed certain context values would always be available.

### Problem
```typescript
// PROBLEMATIC (assumes context exists)
const environment = this.node.tryGetContext('environment');  // Could be undefined

// SOLUTION (with defaults)
const environment = this.node.tryGetContext('environment') || 'development';  // Has fallback
```

### Impact
- Runtime errors when context values missing
- Inconsistent behavior across different deployment scenarios

## Recommendations for Future Development

### 1. Always Provide Fallbacks
- Never assume AWS services are available
- Implement graceful degradation for all critical components
- Test with minimal permissions and configurations

### 2. Use Latest CDK APIs
- Regularly check for deprecation warnings
- Update to latest CDK patterns and APIs
- Maintain compatibility with current CDK versions

### 3. Implement Proper Error Handling
- Wrap service creation in try-catch blocks
- Provide meaningful error messages
- Implement fallback mechanisms

### 4. Use Deterministic Naming
- Always include stack context in resource names
- Avoid hard-coded resource names
- Test multi-stack deployment scenarios

### 5. Comprehensive Testing
- Test both success and failure scenarios
- Test conditional resource creation
- Test with different context configurations

### 6. Document Dependencies
- Clearly document AWS service requirements
- List required permissions and policies
- Provide setup instructions for dependencies

## Conclusion

These failures highlight the importance of:
- **Not making assumptions** about AWS account configurations
- **Always providing fallback mechanisms** for critical components
- **Staying current** with CDK API changes
- **Implementing proper error handling** throughout the codebase
- **Testing thoroughly** with various configurations and scenarios

The solutions implemented ensure the stack is robust, maintainable, and works across different AWS account configurations while providing clear paths for future enhancements.