# Critical Blocking Issues Preventing Deployment

## Issue 1: Route53 Health Check API Parameter Error

**Location**: `lib/stacks/global_stack.py` lines 67 and 84

**Problem**: Code uses `fully_qualified_domain_name` parameter which doesn't exist in CDKTF AWS provider.

**Current Code**:
```python
primary_health_check = Route53HealthCheck(
    self,
    "primary-health-check",
    type="HTTPS",
    resource_path="/health",
    fully_qualified_domain_name=primary_health_check_url.replace("https://", "").split("/")[0],  # WRONG PARAMETER
    port=443,
    ...
)
```

**Required Fix**: Change to `fqdn` parameter:
```python
fqdn=primary_health_check_url.replace("https://", "").split("/")[0],
```

**Impact**: Synth will fail, deployment blocked.

---

## Issue 2: Lambda Deployment Package Missing

**Location**: `lib/constructs/lambda_health_check.py` line 146

**Problem**: Code references `filename="lambda/health_check.zip"` but this file doesn't exist.

**Current Code**:
```python
self.function = LambdaFunction(
    ...
    filename="lambda/health_check.zip",  # FILE DOESN'T EXIST
    source_code_hash=base64.b64encode(lambda_code.encode()).decode(),
    ...
)
```

**Required Fix**: Either:
1. Create actual ZIP file with Lambda code
2. Use inline code with `code` parameter instead of `filename`
3. Use S3 bucket for code deployment

**Impact**: Lambda creation will fail during deployment.

---

## Issue 3: Aurora Global Database Deployment Complexity

**Location**: `lib/constructs/aurora_global.py`

**Problem**: Aurora Global Database requires complex multi-step deployment:

1. Primary global cluster must be created and reach "available" state (15-20 minutes)
2. Only then can secondary cluster attach to global cluster
3. Secondary cluster must reference global cluster ID from primary
4. Stack dependencies alone are insufficient - need explicit waits

**Current Code Issue**:
```python
# In secondary_stack:
global_cluster_identifier=f"aurora-global-{environment_suffix}",  # Hard-coded reference
```

**Required Fix**:
1. Pass global cluster ID from primary stack to secondary stack
2. Add explicit depends_on for global cluster resource
3. Add wait conditions or manual deployment steps

**Impact**: Deployment will fail with "GlobalCluster not found" or "GlobalCluster not available" errors.

---

## Issue 4: IAM Role Reference Error

**Location**: `lib/constructs/aurora_global.py` line 138

**Problem**: Code references pre-existing IAM role that doesn't exist:

```python
monitoring_role_arn=f"arn:aws:iam::{region}:role/rds-monitoring-role",  # Pre-existing role
```

**Required Fix**: Create the RDS monitoring role in the construct or remove monitoring config.

**Impact**: RDS instance creation will fail.

---

## Deployment Feasibility Assessment

**Estimated Time**: 40-60 minutes for full deployment (if all fixes applied)
**Estimated Cost**: $50-100 for testing (Aurora Global Database is expensive)
**Success Probability**: Medium (requires multiple deployment iterations)

**Recommendation**: Fix critical API errors first, then attempt deployment with monitoring.

---

## Summary

**Total Critical Issues**: 4
**Blocking Deployment**: YES
**Quick Fixes Available**: Issues #1 and #2 (API parameters)
**Complex Fixes Required**: Issues #3 and #4 (architecture)

