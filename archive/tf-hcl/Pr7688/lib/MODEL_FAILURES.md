### **Issue 1 — Invalid Reference to pr_number**

**Error:**

```text
Error: Invalid reference
A reference to a resource type must be followed by at least one attribute access
```

**Root Cause:** Referenced `pr_number` directly instead of `var.pr_number` in `locals`.
**Fix:** Changed `${pr_number}` to `${var.pr_number}`.

### **Issue 2 — Invalid Data Source aws_sagemaker_model**

**Error:**

```text
The provider hashicorp/aws does not support data source "aws_sagemaker_model".
```

**Root Cause:** The `aws_sagemaker_model` data source does not exist in the AWS provider.
**Fix:** Removed the unused data source block.

### **Issue 3 — Unsupported Argument auth_token_enabled**

**Error:**

```text
An argument named "auth_token_enabled" is not expected here.
```

**Root Cause:** `auth_token_enabled` is not a valid argument for `aws_elasticache_replication_group` in the current
provider version.
**Fix:** Removed `auth_token_enabled = true`.

### **Issue 4 — Unsupported Argument buffer_size/interval**

**Error:**

```text
An argument named "buffer_size" is not expected here.
```

**Root Cause:** The arguments are named `buffering_size` and `buffering_interval`.
**Fix:** Renamed `buffer_size` to `buffering_size` and `buffer_interval` to `buffering_interval`.

### **Issue 5 — Missing schema_configuration**

**Error:**

```text
Insufficient schema_configuration blocks ... At least 1 "schema_configuration" blocks are required.
```

**Root Cause:** `data_format_conversion_configuration` requires a schema source (Glue table), but none is provided.
**Fix:** Removed `data_format_conversion_configuration` block.

### **Issue 6 — Invalid PostgreSQL Version**

**Error:**

```text
InvalidParameterCombination: Cannot find version 15.3 for postgres
```

**Root Cause:** PostgreSQL 15.3 not available or deprecated in the selected region.
**Fix:** Updated `engine_version` to **15.14**, a supported version.

### **Issue 7 — Missing KMS Permissions**

**Error:**

```text
AccessDeniedException: The ciphertext refers to a customer master key that does not exist, does not exist in this region, or you are not allowed to access.
```

**Root Cause:** IAM roles (Lambda, Firehose, Glue) lacked explicit permissions (`kms:Decrypt`, `kms:GenerateDataKey`)
to access the CMKs used for S3 and SNS encryption.
**Fix:** Added explicit `kms:Decrypt`, `kms:GenerateDataKey`, and `kms:Encrypt` permissions to `aws_iam_role_policy`
resources for Lambda, Firehose, and Glue.

### **Issue 8 — Invalid CloudWatch Anomaly Detection Syntax**

**Error:**

```text
ValidationError: Error in expression 'e1': Function 'ANOMALY_DETECTOR' not found
ValidationError: Metrics expression that return multi time series are only allowed for MetricsInsights expression with an ORDER BY clause
ValidationError: Exactly two elements of the metrics list should return data.
```

**Root Cause:** `ANOMALY_DETECTOR` is not a valid function, and using `ANOMALY_DETECTION_BAND` with a static threshold
is incorrect usage. Also, `return_data` was not explicitly set for the metric.
**Fix:** Changed expression to `ANOMALY_DETECTION_BAND(m1, 2)`, set `threshold_metric_id` to `e1`, removed static
`threshold`, and set `return_data = true` for the metric query.

### **Issue 9 — Firehose KMS Configuration**

**Error:**

```text
InvalidArgumentException: Firehose is unable to access the specified bucket
```

**Root Cause:** Firehose requires explicit `kms_key_arn` in `extended_s3_configuration` when the target bucket uses
SSE-KMS, in addition to IAM permissions. Also added `s3:PutObjectAcl`.
**Fix:** Added `kms_key_arn = aws_kms_key.s3.arn` to `extended_s3_configuration` and `s3:PutObjectAcl` to IAM policy.

### **Issue 10 — Firehose Metadata Extraction**

**Error:**

```text
InvalidArgumentException: MetadataExtraction processor should be present when S3 Prefix has partitionKeyFromQuery namespace.
```

**Root Cause:** Dynamic partitioning with `partitionKeyFromQuery` requires a `MetadataExtraction` processor to be defined.
**Fix:** Added `MetadataExtraction` processor to Firehose configuration.

### **Issue 11 — Aurora Engine Mode**

**Error:**

```text
InvalidParameterValue: The engine mode provisioned is not supported for Aurora Serverless v2.
```

**Root Cause:** Explicitly setting `engine_mode = "provisioned"` can cause issues with some API versions or
configurations for Serverless v2, although it is the default.
**Fix:** Removed explicit `engine_mode` configuration.

### **Issue 12 — Firehose Buffer Size**

**Error:**

```text
InvalidArgumentException: BufferingHints.SizeInMBs must be at least 64 when Dynamic Partitioning is enabled.
```

**Root Cause:** Dynamic partitioning requires a minimum buffer size of 64MB.
**Fix:** Updated `buffer_size_mb` to 64 in `dev.tfvars` and `staging.tfvars`.

### **Issue 13 — Aurora Engine Version**

**Error:**

```text
InvalidParameterCombination: Cannot find version 15.5 for aurora-postgresql
```

**Root Cause:** Version 15.5 is not available in the selected region/configuration.
**Fix:** Checked available versions and set `engine_version` to **15.14**.

### **Issue 14 — Reserved Master Username**

**Error:**

```text
InvalidParameterValue: MasterUsername admin cannot be used as it is a reserved word used by the engine
```

**Root Cause:** "admin" is a reserved username in Aurora PostgreSQL.
**Fix:** Changed `master_username` to "dbadmin" in all `.tfvars` files.

### **Issue 15 — Step Functions Logging Permissions**

**Error:**

```text
AccessDeniedException: The state machine IAM Role is not authorized to access the Log Destination
```

**Root Cause:** Step Functions IAM role lacked permissions to configure and write logs to CloudWatch.
**Fix:** Added `logs:CreateLogDelivery`, `logs:GetLogDelivery`, `logs:UpdateLogDelivery`, `logs:DeleteLogDelivery`,
`logs:ListLogDeliveries`, `logs:PutResourcePolicy`, `logs:DescribeResourcePolicies`, `logs:DescribeLogGroups` to the
Step Functions IAM policy.
