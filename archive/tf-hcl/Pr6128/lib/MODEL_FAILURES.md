## Attempt 1 — Initial Configuration Errors

### Failure Type

Critical Failures


### **Issue 1 — Invalid S3 Backend Configuration**

**Error:** Deprecated parameter `dynamodb_table` in backend configuration
**Root Cause:** The backend used a deprecated parameter instead of the new `use_lockfile` flag.
**Fix:** Switched backend to **local** for dev. Added commented S3 backend config for prod with `use_lockfile` parameter.


### **Issue 2 — Missing Filter in S3 Lifecycle Rule**

**Error:** Missing required `filter` or `prefix` attribute in lifecycle rule.
**Root Cause:** AWS provider v5.x enforces one of these attributes in S3 lifecycle rules.
**Fix:** Added an empty filter block:

```hcl
filter {
  prefix = ""
}
```


### **Issue 3 — Invalid VPC Flow Log Parameter**

**Error:** Unsupported argument `log_destination_arn`.
**Root Cause:** Correct attributes are `log_destination` and `log_destination_type`.
**Fix:**

```hcl
log_destination      = aws_cloudwatch_log_group.vpc_flow_logs.arn
log_destination_type = "cloud-watch-logs"
```


### **Issue 4 — Missing ECR Repository**

**Error:** Data source for `payment-api` ECR failed — resource not found.
**Root Cause:** ECR repository was referenced before creation.
**Fix:** Converted data source to resource. Created `aws_ecr_repository` with image scanning, encryption, and lifecycle policy.


## Attempt 2 — RDS Deployment Errors

### Failure Type

Critical Failures


### **Issue 1 — Invalid PostgreSQL Version**

**Error:**

```
InvalidParameterCombination: Cannot find version 15.4 for postgres
```

**Root Cause:** PostgreSQL 15.4 not available in the selected region.
**Fix:** Updated `engine_version` to **15.14**, a supported version.


### **Issue 2 — Excessive Logging Configuration**

**Error:** `log_statement='all'` created excessive logging load.
**Root Cause:** Full-statement logging incompatible with CloudWatch export; impacts performance.
**Fix:** Changed `log_statement` to `"ddl"` to log only schema changes.


### **Issue 3 — Invalid IOPS Configuration**

**Error:** Explicit IOPS and throughput specified for <400GB gp3 volume.
**Root Cause:** RDS gp3 defaults (3000 IOPS, 125 MB/s) apply automatically; explicit settings invalid for small volumes.
**Fix:** Removed explicit `iops` and `storage_throughput` parameters.


### **Issue 4 — Invalid effective_cache_size Value**

**Error:** Exceeded PostgreSQL integer range.
**Root Cause:** Formula `{DBInstanceClassMemory*3/4}` produced an overflow.
**Fix:** Set static value `393216` (3GB in 8KB pages), suitable for t3.micro/small instances.
