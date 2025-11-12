# MODEL_RESPONSE Issues and Failures

This document identifies the issues present in the MODEL_RESPONSE.md that need to be corrected in IDEAL_RESPONSE.md.

## Critical Issues

### 1. Wrong AWS Region (CRITICAL)

**Location**: bin/tap.ts, line 18
**Issue**: Region is set to `ca-central-1` instead of the required `us-east-1`

```typescript
// WRONG
env: {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'ca-central-1',
}
```

**Impact**: Infrastructure will deploy to the wrong region, violating requirements
**Severity**: CRITICAL - Must be fixed

### 2. Placeholder Container Image

**Location**: lib/tap-stack.ts, container definition
**Issue**: Using a generic Node.js image instead of an actual application image

```typescript
// PLACEHOLDER - Not production ready
image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/node:18-alpine'),
```

**Impact**:
- Container will not have the actual application code
- Health checks will fail
- Service will not function correctly

**Severity**: HIGH - Application won't work with this placeholder

### 3. Missing Custom Resource for SSM Parameter Update

**Location**: lib/tap-stack.ts
**Issue**: No mechanism to update ECS service when SSM parameters change

**Problem**: When API configuration in Parameter Store is updated, ECS tasks are not automatically redeployed with new configuration. Tasks will continue running with stale configuration values.

**Impact**: Configuration changes require manual ECS service force-deployment
**Severity**: MEDIUM - Operational complexity and potential for configuration drift

## Minor Issues

### 4. Incomplete Health Check Path Documentation

**Location**: lib/tap-stack.ts, target group health check
**Issue**: Health check path set to `/health` but no documentation that the application must implement this endpoint

```typescript
healthCheck: {
  path: '/health',
  // ...
}
```

**Impact**: Developers must know to implement this endpoint
**Severity**: LOW - Documentation issue

### 5. No Custom Resource Lambda for Parameter Updates

**Issue**: Missing Lambda function and custom resource that would:
- Monitor SSM parameter changes
- Trigger ECS service update when configuration changes
- Ensure zero-downtime configuration updates

**Impact**: Configuration changes require manual intervention
**Severity**: MEDIUM - Reduces automation capabilities

## Summary

Total Issues: 5
- Critical: 1 (Wrong region)
- High: 1 (Placeholder image)
- Medium: 2 (Missing custom resource, no auto-update mechanism)
- Low: 1 (Documentation)

## Required Fixes for IDEAL_RESPONSE.md

1. Change region from `ca-central-1` to `us-east-1` in bin/tap.ts
2. Document that container image must be replaced with actual application image
3. Add Custom Resource with Lambda function to monitor SSM parameter changes
4. Add trigger mechanism to update ECS service when parameters change
5. Add documentation about implementing the /health endpoint

## Pattern Reference

For Custom Resource implementation, refer to:
- archive/cdk-ts/ examples with SSM parameter update patterns
- CloudFormation custom resource examples
- Lambda functions that trigger ECS service updates
