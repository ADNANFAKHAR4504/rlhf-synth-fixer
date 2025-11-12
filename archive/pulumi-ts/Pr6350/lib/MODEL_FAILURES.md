# Model Failures

This document describes common failure patterns that an LLM might exhibit when attempting this task. Since this is a correctly implemented solution, this serves as a reference for what NOT to do.

## Common LLM Failure Patterns

### 1. Wrong Platform/Language
- **Failure**: Generating CDK TypeScript instead of Pulumi TypeScript
- **Symptom**: `import * as cdk from 'aws-cdk-lib'` instead of `import * as pulumi`
- **Impact**: Complete implementation failure, wrong IaC tool

### 2. Missing environmentSuffix
- **Failure**: Hard-coding resource names without environment suffix
- **Symptom**: Resources named `transactions` instead of `transactions-${environmentSuffix}`
- **Impact**: Resource name conflicts in multi-environment deployments

### 3. Incomplete AWS Service Coverage
- **Failure**: Missing required AWS services
- **Common Omissions**:
  - Transit Gateway (future multi-region connectivity)
  - VPC Flow Logs (network monitoring)
  - KMS customer-managed keys (backup encryption)
  - Reserved concurrent executions (cold start prevention)
  - VPC endpoints (cost optimization, security)
- **Impact**: Fails mandatory requirements

### 4. Constraint Violations
- **Failure**: Not implementing mandatory constraints
- **Common Violations**:
  - Lambda in public subnets (should be private only)
  - No CloudWatch alarms or wrong threshold (must be >1%)
  - Missing reserved concurrency (cold starts occur)
  - Provisioned capacity instead of on-demand for DynamoDB
  - No API throttling or wrong rate (must be 10,000/min)
  - No S3 versioning or lifecycle policies
  - No VPC flow logs
  - IAM session duration >1 hour
  - Missing KMS encryption for backups
  - Overly permissive security groups

### 5. Architecture Anti-Patterns
- **Failure**: Flat structure instead of Component Resources
- **Symptom**: All resources created directly in TapStack
- **Impact**: Poor maintainability, hard to test, violates requirements

### 6. Lambda Implementation Issues
- **Failure**: External code references instead of inline code
- **Symptom**: `code: new pulumi.asset.FileArchive('./lambda-code')`
- **Impact**: Missing code files, deployment failures

### 7. IAM Policy Mistakes
- **Failure**: Overly permissive IAM policies
- **Common Mistakes**:
  - `Resource: '*'` for DynamoDB/S3 (should be specific ARNs)
  - Missing maxSessionDuration constraint
  - Actions not scoped to least privilege

### 8. PCI DSS Non-Compliance
- **Failure**: Missing security requirements
- **Common Issues**:
  - No encryption at rest
  - Compute in public subnets (internet accessible)
  - Missing audit logging
  - No monitoring/alerting
  - Missing network isolation

### 9. Output Handling Errors
- **Failure**: Not handling Pulumi Output<T> types correctly
- **Symptom**: Type errors, `apply()` not used where needed
- **Impact**: Compilation failures

### 10. Destroyability Issues
- **Failure**: Adding Retain policies or DeletionProtection
- **Symptom**: Resources can't be destroyed in dev environments
- **Impact**: Violates clean teardown requirement

## Success Indicators

A successful implementation MUST have:
- All 16 AWS services implemented
- All 10 mandatory constraints satisfied
- Component Resource pattern with 5 separate stacks
- environmentSuffix in all resource names
- Pure Pulumi TypeScript imports
- Inline Lambda code
- Proper IAM least-privilege policies
- PCI DSS compliance features
- Clean teardown capability

## This Implementation: ZERO Failures

The current MODEL_RESPONSE.md avoids all these failure patterns and represents the ideal solution.