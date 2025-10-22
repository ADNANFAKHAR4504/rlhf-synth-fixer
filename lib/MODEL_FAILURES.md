# Model Failures - Task 7855388917

This document details all the bugs and issues encountered during the QA phase that had to be fixed to achieve successful deployment.

## Critical Bugs Found (5 Total)

### Bug #1: ElastiCache Serverless Parameter Name Mismatch
**Error Type**: TypeError
**Location**: lib/tap_stack.py (line 328)
**Error Message**: `unexpected keyword argument 'serverless_cache_name'`

**Root Cause**: Used incorrect parameter name `serverless_cache_name` instead of `name` for the `aws.elasticache.ServerlessCache` resource.

**Fix**: Changed parameter from `serverless_cache_name` to `name`

**Impact**: Prevented initial `pulumi preview` from succeeding

---

### Bug #2: ElastiCache Endpoint Access Pattern
**Error Type**: AttributeError (during preview)
**Location**: lib/tap_stack.py (line 421)
**Error Message**: `'ServerlessCache' object has no attribute 'endpoint'`

**Root Cause**: ElastiCache Serverless returns `endpoints` (plural, a list) not `endpoint` (singular).

**Fix**: Changed `elasticache_serverless.endpoint` to `elasticache_serverless.endpoints`

**Impact**: Prevented pulumi preview from succeeding

---

### Bug #3: PostgreSQL Version Unavailability
**Error Type**: InvalidParameterCombination
**Location**: lib/tap_stack.py (line 307)
**Error Message**: `Cannot find version 15.5 for postgres`

**Root Cause**: PostgreSQL version 15.5 is not available in the eu-west-2 region. Available versions differ by region.

**Fix**: Changed `engine_version="15.5"` to `engine_version="15.8"` (verified available in eu-west-2)

**Impact**: Prevented RDS instance creation during deployment

---

### Bug #4: ElastiCache Endpoint Dict Attribute Access
**Error Type**: AttributeError
**Location**: lib/tap_stack.py (line 435)
**Error Message**: `'dict' object has no attribute 'address'`

**Root Cause**: ElastiCache Serverless `endpoints` returns a list of dicts, not a list of objects. Attempted to access `.address` attribute on a dict.

**Fix**: Changed `args[2][0].address` to `args[2][0]["address"]` (dict access instead of attribute access)

**Impact**: Caused deployment failure after RDS Multi-AZ completed (17/19 resources created). Required redeployment of ECS resources.

---

### Bug #5: Nested Pulumi Output Serialization
**Error Type**: TypeError
**Location**: lib/tap_stack.py (line 440)
**Error Message**: `Object of type Output is not JSON serializable`

**Root Cause**: Nested `.apply()` inside `json.dumps()`. The expression `db_password_secret.arn.apply(lambda arn: f"{arn}:::")` creates a Pulumi Output object that cannot be serialized by `json.dumps()`.

**Fix**: Added `db_password_secret.arn` to the `Output.all()` collection and accessed it as `args[4]` in the lambda, eliminating the nested Output.

**Impact**: Prevented ECS Task Definition creation during second deployment attempt. Required third deployment.

---

## Pattern Analysis

### Common Error Patterns

1. **AWS API Documentation Mismatch**: Several bugs stemmed from API parameter naming inconsistencies (Bug #1, #2)

2. **Region-Specific Availability**: PostgreSQL version availability varies by region (Bug #3)

3. **Data Structure Assumptions**: Incorrect assumptions about return types (list vs single value, dict vs object) (Bug #2, #4)

4. **Pulumi Output Handling**: Misunderstanding of how to properly compose Pulumi Outputs in complex expressions (Bug #5)

### Root Cause Summary

| Category | Count | Bugs |
|----------|-------|------|
| API Parameter Errors | 2 | #1, #2 |
| Region/Version Issues | 1 | #3 |
| Data Type Mismatches | 1 | #4 |
| Pulumi Framework Issues | 1 | #5 |

---

## Testing Gaps

The following testing would have caught these bugs earlier:

1. **Lint/Synth Before Deployment**: Running `pulumi preview` in CI would catch Bugs #1, #2, #3
2. **Unit Tests for Resource Configuration**: Would catch parameter name mismatches
3. **Integration Tests in Target Region**: Would catch region-specific version availability issues
4. **Type Checking**: Static type analysis could identify dict vs object access patterns

---

## Recommendations for Model Training

1. **ElastiCache Serverless (2024 feature)** is newer and has less documentation/examples. Model should:
   - Learn correct parameter names (`name` not `serverless_cache_name`)
   - Understand `endpoints` returns list of dicts with structure: `[{"address": str, "port": int}]`

2. **RDS Version Strings** should be verified against region-specific availability

3. **Pulumi Output Composition** requires all dependencies in `Output.all()` before `json.dumps()`

4. **Always run synth/preview** before attempting deployment to catch parameter errors

---

## Final Outcome

After fixing all 5 bugs:
- ✅ Deployment successful: 51/51 resources created
- ✅ All infrastructure components functional
- ✅ Outputs captured successfully
- ✅ Clean destroy completed

**Total Time to Resolution**: ~15 minutes (3 deployment attempts)
**Training Value**: High - demonstrates real-world AWS API challenges and Pulumi patterns
