# Model Failures and Fixes

## Task: Deploy containerized e-commerce microservices with Redis caching and secrets management

## Summary

The initial model-generated code had **5 critical bugs** that prevented deployment. All bugs were identified during the synth phase and fixed before successful deployment.

## Bug #1: Invalid Import Statement

**Error**:
```
ImportError: cannot import name 'EcsTaskDefinitionContainerDefinitions' from 'cdktf_cdktf_provider_aws.ecs'
```

**Root Cause**: Non-existent class imported in `lib/ecs_stack.py`

**Fix**: Removed the invalid import line:
```python
# REMOVED: from cdktf_cdktf_provider_aws.ecs import EcsTaskDefinitionContainerDefinitions
```

**Impact**: Build-breaking error, prevented synthesis

---

## Bug #2: Invalid Backend Configuration

**Error**:
```
Invalid escape hatch: use_lockfile is not a valid field for S3 backend
```

**Root Cause**: Attempted to configure non-existent backend option in `lib/tap_stack.py`

**Fix**: Removed invalid escape hatch:
```python
# REMOVED:
# backend.add_override("use_lockfile", True)
```

**Impact**: Build-breaking error, prevented synthesis

---

## Bug #3: Type Mismatch in ALB Target Group

**Error**:
```
TypeError: deregistration_delay expects string, got int
```

**Root Cause**: In `lib/alb_stack.py`, deregistration_delay was set to integer `30` instead of string `"30"`

**Fix**:
```python
# BEFORE:
deregistration_delay=30

# AFTER:
deregistration_delay="30"
```

**Impact**: Build-breaking error, prevented synthesis

---

## Bug #4: Boolean Type Issues in ElastiCache

**Error**:
```
TypeError: at_rest_encryption_enabled and transit_encryption_enabled expect boolean-like values
```

**Root Cause**: In `lib/cache_stack.py`, explicitly setting encryption booleans caused CDKTF type confusion

**Fix**: Removed explicit boolean fields, letting AWS defaults apply:
```python
# REMOVED:
# at_rest_encryption_enabled=True,
# transit_encryption_enabled=False,
```

**Impact**: Build-breaking error, prevented synthesis

---

## Bug #5: AWS Resource Name Length Violations (12 violations)

**Error**:
```
ValidationException: Resource names exceed AWS 32-character limit
```

**Root Cause**: Multiple resources used names like `product-catalog-*-{suffix}` which exceeded 32 characters when suffix `synth8280308137` (16 chars) was appended

**Affected Resources**:
1. ALB: `product-catalog-alb-{suffix}` (38 chars)
2. Target Group: `product-catalog-tg-{suffix}` (36 chars)
3. ElastiCache: `product-catalog-{suffix}` (31 chars - borderline)
4. ECS Cluster: `product-catalog-cluster-{suffix}` (44 chars)
5. ECS Service: `product-catalog-service-{suffix}` (44 chars)
6. ECS Task Family: `product-catalog-{suffix}` (31 chars)
7. Execution Role: `product-catalog-execution-role-{suffix}` (51 chars)
8. Task Role: `product-catalog-task-role-{suffix}` (42 chars)
9. Security Group (ALB): `product-catalog-alb-sg-{suffix}` (41 chars)
10. Security Group (ECS): `product-catalog-ecs-sg-{suffix}` (41 chars)
11. Security Group (Cache): `product-catalog-cache-sg-{suffix}` (43 chars)
12. Secrets: `product-catalog/db-{suffix}` and `product-catalog/api-{suffix}`

**Fix**: Abbreviated all names to use `pc-` prefix:
```python
# BEFORE: product-catalog-alb-{suffix}
# AFTER:  pc-alb-{suffix}

# BEFORE: product-catalog-cluster-{suffix}
# AFTER:  pc-cluster-{suffix}
```

**Impact**: Deployment-breaking error, would have failed during `terraform apply`

---

## Deployment Results

After fixing all 5 bugs:
- ✅ **Synth**: Successful
- ✅ **Deployment**: Successful (35/35 resources created)
- ✅ **Deployment Time**: 12m 34s (ElastiCache contributed 12m 34s)
- ✅ **All Resources**: Fully operational

## Key Learnings

1. **Import Validation**: Always verify class names exist in provider before importing
2. **Backend Configuration**: Only use documented escape hatches for backend config
3. **Type Strictness**: CDKTF Python is strict about string vs int types for AWS resource properties
4. **Boolean Handling**: Some CDKTF resources have issues with explicit boolean values - prefer omitting to use defaults
5. **Naming Conventions**: Always account for suffix length when naming resources (aim for <16 char base names)

## Training Value

These failures provide excellent training data for:
- CDKTF Python syntax and type requirements
- AWS resource naming constraints
- Backend configuration in CDKTF
- Provider-specific class naming patterns
- ElastiCache deployment time expectations
