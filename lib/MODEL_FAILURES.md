### **Issue 1 — Invalid PostgreSQL Version**

**Error:**

```
InvalidParameterCombination: Cannot find version 15.4 for postgres
```

**Root Cause:** PostgreSQL 15.4 not available in the selected region.
**Fix:** Updated `engine_version` to **15.14**, a supported version.

### **Issue 2 — Excessive Logging Load**

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

### **Issue 5 — Missing KMS Key Policy Permissions**

**Error:**
```
AccessDeniedException: ... User: arn:aws:sts::... is not authorized to perform: kms:GenerateDataKey ...
```
(or similar errors from CloudWatch Logs, SNS, SQS)

**Root Cause:** The default KMS key policy only trusted the account root. Service principals (CloudWatch Logs, SNS, SQS) require explicit permissions in the key policy to encrypt/decrypt data using the CMK.
**Fix:** Added a comprehensive `aws_iam_policy_document` for the KMS key, explicitly granting access to:
*   `logs.${var.aws_region}.amazonaws.com` (with encryption context condition)
*   `sns.amazonaws.com`
*   `sqs.amazonaws.com`

### **Issue 6 — S3 Lifecycle Configuration Warning**

**Error:**
```
Warning: Invalid Attribute Combination ... No attribute specified when one (and only one) of [rule[0].filter,rule[0].prefix] is required
```

**Root Cause:** The `aws_s3_bucket_lifecycle_configuration` resource requires a `filter` block (even if empty) or a `prefix` to define the scope of the rule. Missing this attribute triggers a validation warning in newer AWS provider versions.
**Fix:** Added an empty `filter {}` block to the lifecycle rule to explicitly apply it to all objects in the bucket.
