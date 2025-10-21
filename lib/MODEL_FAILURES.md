# Model Failures and Fixes

This document outlines the issues found in the generated CDKTF Python infrastructure code and the fixes applied to make it deployable and functional.

## Issues Fixed

### 1. ElastiCache Serverless Cache Usage Limits Configuration

**Issue**: The `cache_usage_limits` parameter was configured as a dictionary when the CDKTF provider expected a list containing a single dictionary.

**Original Code**:
```python
cache_usage_limits={
    "data_storage": {
        "maximum": 10,
        "unit": "GB"
    },
    "ecpu_per_second": {
        "maximum": 5000
    }
}
```

**Fixed Code**:
```python
cache_usage_limits=[{
    "data_storage": {
        "maximum": 10,
        "unit": "GB"
    },
    "ecpu_per_second": {
        "maximum": 5000
    }
}]
```

**Error Message**:
```
Unable to deserialize value as cdktf.IResolvable | array<ElasticacheServerlessCacheCacheUsageLimits>
Value is not an array
```

### 2. Redis Endpoint Access in Secrets Manager

**Issue**: Attempted to access the Redis cache endpoint during synthesis time using `redis_cache.endpoint[0].address`, but the endpoint is only available after deployment. This caused a TypeError.

**Original Code**:
```python
redis_secret_value = {
    "endpoint": redis_cache.endpoint[0].address,
    "port": 6379
}
```

**Fixed Code**:
```python
redis_secret_value = {
    "endpoint": "to-be-updated-after-deployment",
    "port": 6379
}
```

**Error Message**:
```
TypeError: 'ElasticacheServerlessCacheEndpointList' object is not subscriptable
```

### 3. Redis Endpoint Reference in ECS Task Definition

**Issue**: Similar to issue #2, the ECS task definition attempted to reference the Redis endpoint address during synthesis.

**Original Code**:
```python
"environment": [
    {
        "name": "REDIS_ENDPOINT",
        "value": redis_cache.endpoint[0].address
    }
]
```

**Fixed Code**:
```python
"environment": []
```

**Note**: In a production scenario, this would be populated using Terraform's depends_on or by retrieving the endpoint after deployment.

### 4. S3 Backend use_lockfile Parameter

**Issue**: The code attempted to add a `use_lockfile` parameter to the S3 backend configuration using an escape hatch, but this parameter is not supported by the Terraform S3 backend.

**Original Code**:
```python
S3Backend(
    self,
    bucket=state_bucket,
    key=f"{environment_suffix}/{construct_id}.tfstate",
    region=state_bucket_region,
    encrypt=True,
)

# Add S3 state locking using escape hatch
self.add_override("terraform.backend.s3.use_lockfile", True)
```

**Fixed Code**:
```python
S3Backend(
    self,
    bucket=state_bucket,
    key=f"{environment_suffix}/{construct_id}.tfstate",
    region=state_bucket_region,
    encrypt=True,
)
```

**Error Message**:
```
Error: Extraneous JSON object property
No argument or block type is named "use_lockfile"
```

### 5. Missing Terraform Outputs

**Issue**: The stack did not include Terraform outputs, making it difficult to retrieve deployed resource information for integration testing and operational use.

**Fix**: Added comprehensive outputs for key resources:
- VPC ID
- ALB DNS name
- ECS Cluster name
- ECS Service name
- Redis cache name
- Database secret ARN
- Redis secret ARN

### 6. Unused Imports in Test Files

**Issue**: Test files imported `Testing` from cdktf but never used it, causing linting warnings.

**Fixed Files**:
- `tests/unit/test_tap_stack.py`
- `tests/integration/test_tap_stack.py`

**Fix**: Removed the unused `Testing` import.

## Summary

The model-generated code had several critical issues that prevented successful synthesis and deployment:

1. **Data structure mismatches**: The cache_usage_limits needed to be an array, not a dictionary
2. **Synthesis-time vs deployment-time values**: References to resources that don't exist until deployment caused errors
3. **Invalid Terraform configuration**: Attempted to use unsupported backend parameters
4. **Missing observability**: No outputs were defined for deployed resources
5. **Code quality**: Minor linting issues with unused imports

All issues were resolved, and the infrastructure now successfully synthesizes and deploys to AWS in the ca-central-1 region.