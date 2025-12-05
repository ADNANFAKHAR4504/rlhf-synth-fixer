### **Issue 1 — Invalid PostgreSQL Version**

**Error:**

```text
InvalidParameterCombination: Cannot find version 15.3 for postgres
```

**Root Cause:** PostgreSQL 15.3 not available or deprecated in the selected region.
**Fix:** Updated `engine_version` to **15.14**, a supported version.

### **Issue 2 — Excessive Logging**

**Error:**

```text
log_statement='all' created excessive logging load.
```

**Root Cause:** Full-statement logging incompatible with CloudWatch export; impacts performance.
**Fix:** Created parameter group and set `log_statement` to `"ddl"` to log only schema changes.

### **Issue 3 — Invalid effective_cache_size Value**

**Error:**

```text
Exceeded PostgreSQL integer range.
```

**Root Cause:** Formula `{DBInstanceClassMemory*3/4}` produced an overflow.
**Fix:** Set static value `393216` (3GB in 8KB pages), suitable for t3.micro/small instances.

### **Issue 4 — Missing KMS Key Policy Permissions**

**Error:**

```text
AccessDeniedException: The ciphertext refers to a customer master key that does not exist, does not exist in this region, or you are not allowed to access.
```

**Root Cause:** The created KMS keys for S3 and SNS lacked explicit key policies allowing access from dependent AWS
services (CloudWatch, EventBridge, S3, RDS, Lambda).
**Fix:** Added `aws_iam_policy_document` data sources for both S3 and SNS keys, explicitly granting `kms:Encrypt`,
`kms:Decrypt`, `kms:GenerateDataKey*`, etc., to relevant service principals (`s3.amazonaws.com`, `rds.amazonaws.com`,
`lambda.amazonaws.com`, `events.amazonaws.com`, `sns.amazonaws.com`, `sqs.amazonaws.com`). Attached these policies to
the `aws_kms_key` resources.

### **Issue 5 — S3 Lifecycle Configuration Warning**

**Error:**

```text
Warning: Invalid Attribute Combination: No attribute specified when one (and only one) of [rule[0].filter,rule[0].prefix] is required
```

**Root Cause:** The `aws_s3_bucket_lifecycle_configuration` resource requires a `filter` block (even if empty) to apply
the rule to all objects, as `prefix` is deprecated.
**Fix:** Added an empty `filter {}` block to the lifecycle rules for both the archive and Athena results buckets.

### **Issue 6 — Invalid Arguments for ElastiCache Resources**

**Error:**

```text
Error: Missing required argument: The argument "name" is required.
Error: Unsupported argument: An argument named "name_prefix" is not expected here.
```

**Root Cause:** The `aws_elasticache_subnet_group` and `aws_elasticache_parameter_group` resources do not support the
`name_prefix` argument; they require `name`.
**Fix:** Changed `name_prefix` to `name` for both the ElastiCache subnet group and parameter group resources.

### **Issue 7 — FIFO SQS Subscription to Standard SNS**

**Error:**

```text
InvalidParameter: Invalid parameter: Endpoint Reason: FIFO SQS Queues can not be subscribed to standard SNS topics
```

**Root Cause:** The `achievements_queue` is configured as a FIFO queue, but the `watched_complete` SNS topic was a
standard topic. AWS requires that FIFO queues only subscribe to FIFO SNS topics.
**Fix:** Updated `aws_sns_topic.watched_complete` to be a FIFO topic (`fifo_topic = true`) and appended `.fifo` to its
name.

### **Issue 8 — Invalid Characters in Aurora Password**

**Error:**

```text
InvalidParameterValue: The parameter MasterUserPassword is not a valid password. Only printable ASCII characters besides '/', '@', '"', ' ' may be used.
```

**Root Cause:** The `random_password` resource generated a password containing special characters that are restricted
by Aurora PostgreSQL.
**Fix:** Updated `random_password.aurora` to exclude problematic characters by setting
`override_special = "!#$%&*()-_=+[]{}<>:?"`.

### **Issue 9 — Missing API Gateway CloudWatch Role**

**Error:**

```text
BadRequestException: CloudWatch Logs role ARN must be set in account settings to enable logging
```

**Root Cause:** API Gateway requires a global account-level IAM role to push logs to CloudWatch, which was not
configured.
**Fix:** Added `aws_api_gateway_account` resource and an associated IAM role with
`AmazonAPIGatewayPushToCloudWatchLogs` policy.

### **Issue 10 — Step Functions Logging Permission**

**Error:**

```text
AccessDeniedException: The state machine IAM Role is not authorized to access the Log Destination
```

**Root Cause:** The IAM role for Step Functions lacked sufficient permissions to write to the CloudWatch Log Group.
**Fix:** Updated the Step Functions IAM policy to include `logs:DescribeLogGroups`, `logs:DescribeLogStreams`, and
`logs:GetLogEvents` in addition to creation and put events.

### **Issue 11 — API Gateway Account Setting Race Condition**

**Error:**

```text
BadRequestException: CloudWatch Logs role ARN must be set in account settings to enable logging
```

**Root Cause:** The `aws_api_gateway_stage` resource attempted to enable logging before the `aws_api_gateway_account`
resource had fully propagated the CloudWatch role setting.
**Fix:** Added an explicit `depends_on = [aws_api_gateway_account.main]` to the `aws_api_gateway_stage` resource.

### **Issue 12 — Missing Step Functions Log Delivery Permissions**

**Error:**

```text
AccessDeniedException: The state machine IAM Role is not authorized to access the Log Destination
```

**Root Cause:** Step Functions "Vended Logs" require specific `logs:*LogDelivery` permissions, not just
`logs:PutLogEvents`.
**Fix:** Updated the Step Functions IAM policy to include `logs:CreateLogDelivery`, `logs:GetLogDelivery`,
`logs:UpdateLogDelivery`, `logs:DeleteLogDelivery`, `logs:ListLogDeliveries`, `logs:PutResourcePolicy`,
`logs:DescribeResourcePolicies`, and `logs:DescribeLogGroups`.

### **Issue 13 — Lambda Parallelization Factor Conflict**

**Error:**

```text
InvalidParameterValueException: Parallelization factor must be equal to 1 when tumbling window period is configured
```

**Root Cause:** The `aws_lambda_event_source_mapping` for Kinesis was configured with both `parallelization_factor = 10`
and `tumbling_window_in_seconds = 60`. AWS Lambda does not support using a parallelization factor greater than 1 when
tumbling windows are enabled.
**Fix:** Set `parallelization_factor` to `1` in the Kinesis event source mapping.

### **Issue 14 — Lambda Missing SQS SendMessage Permission**

**Error:**

```text
InvalidParameterValueException: The function execution role does not have permissions to call SendMessage on SQS
```

**Root Cause:** The Lambda execution role lacked `sqs:SendMessage` permission, which is required for sending failed
events to the configured Dead-Letter Queue (DLQ).
**Fix:** Updated `aws_iam_policy.lambda_policy` to include `sqs:SendMessage` and added the DLQ ARNs (`analytics_dlq`
and `achievements_dlq`) to the allowed resources.
