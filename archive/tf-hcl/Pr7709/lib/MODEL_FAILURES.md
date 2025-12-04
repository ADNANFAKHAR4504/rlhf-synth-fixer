### **Issue 1 — Invalid PostgreSQL Version**

**Error:**

```text
InvalidParameterCombination: Cannot find version 15.4 for postgres
```

**Root Cause:** PostgreSQL 15.4 not available in the selected region.
**Fix:** Updated `engine_version` to **15.14**, a supported version.

### **Issue 2 — Excessive Logging Load**

**Error:**

```text
log_statement='all' created excessive logging load.
```

**Root Cause:** Full-statement logging incompatible with CloudWatch export; impacts performance.
**Fix:** Changed `log_statement` to `"ddl"` to log only schema changes.

### **Issue 3 — Invalid IOPS Configuration**

**Error:**

```text
Invalid IOPS Configuration: Explicit IOPS and throughput specified for <400GB gp3 volume.
```

**Root Cause:** RDS gp3 defaults (3000 IOPS, 125 MB/s) apply automatically; explicit settings invalid for small volumes.
**Fix:** Removed explicit `iops` and `storage_throughput` parameters.

### **Issue 4 — Invalid effective_cache_size Value**

**Error:**

```text
Invalid effective_cache_size Value: Exceeded PostgreSQL integer range.
```

**Root Cause:** Formula `{DBInstanceClassMemory*3/4}` produced an overflow.
**Fix:** Set static value `393216` (3GB in 8KB pages), suitable for t3.micro/small instances.

### **Issue 5 — Invalid Data Source**

**Error:**

```text
The provider hashicorp/aws does not support data source "aws_sagemaker_endpoint".
```

**Root Cause:** The `aws_sagemaker_endpoint` data source does not exist in the AWS provider.
**Fix:** Removed the invalid data source block.

### **Issue 6 — Invalid ElastiCache Argument**

**Error:**

```text
The argument "description" is required, but no definition was found.
An argument named "replication_group_description" is not expected here.
```

**Root Cause:** In AWS Provider v5, `replication_group_description` was renamed to `description`.
**Fix:** Renamed `replication_group_description` to `description`.

### **Issue 7 — Missing S3 Lifecycle Filter**

**Error:**

```text
No attribute specified when one (and only one) of [rule[0].filter,rule[0].prefix] is required
```

**Root Cause:** The `aws_s3_bucket_lifecycle_configuration` resource requires a `filter` block in provider v5.
**Fix:** Added `filter { prefix = "" }` to apply the rule to all objects.

### **Issue 8 — API Gateway Route Authorization**

**Error:**

```text
BadRequestException: Currently, authorization is restricted to the $connect route only
```

**Root Cause:** WebSocket APIs in API Gateway only support authorization on the `$connect` route.
**Fix:** Removed `authorization_type = "AWS_IAM"` from `$disconnect` and custom routes.

### **Issue 9 — Missing Lambda SQS Permissions**

**Error:**

```text
InvalidParameterValueException: The function execution role does not have permissions to call ReceiveMessage on SQS
```

**Root Cause:** The `lambda_queue_consumer` role lacked an IAM policy granting SQS permissions.
**Fix:** Added `aws_iam_role_policy` for `lambda_queue_consumer` with SQS and CloudWatch Logs permissions.

### **Issue 10 — Missing Lambda Kinesis Permissions**

**Error:**

```text
InvalidParameterValueException: Cannot access stream ... Please ensure the role can perform the GetRecords... Actions on your stream.
```

**Root Cause:** The `lambda_moderator` role lacked an IAM policy granting Kinesis, DynamoDB, and SNS permissions.
**Fix:** Added `aws_iam_role_policy` for `lambda_moderator` with Kinesis, DynamoDB, SNS, and CloudWatch Logs permissions.

### **Issue 11 — SNS-SQS FIFO Mismatch**

**Error:**

```text
InvalidParameter: Endpoint Reason: FIFO SQS Queues can not be subscribed to standard SNS topics
```

**Root Cause:** The `email` queue was configured as FIFO, but subscribed to a Standard SNS topic.
This combination is not supported.
**Fix:** Changed `email` queue configuration to `fifo = false` (Standard queue).

### **Issue 12 — Invalid WAF Rule Action**

**Error:**

```text
WAFInvalidParameterException: Error reason: A reference in your rule statement is not valid., field: RULE, parameter: Statement
```

**Root Cause:** Managed rule groups (`managed_rule_group_statement`) require `override_action` instead of `action`.
The `action` block is only for standard rules.
**Fix:** Replaced `action { block {} }` with `override_action { none {} }` for `AWSManagedRulesSQLiRuleSet` and `AWSManagedRulesCommonRuleSet`.

### **Issue 13 — Invalid RDS Password Characters**

**Error:**

```text
InvalidParameterValue: The parameter MasterUserPassword is not a valid password. Only printable ASCII characters besides '/', '@', '"', ' ' may be used.
```

**Root Cause:** The `random_password` resource included invalid characters (`@`, `/`, `"`, ` `) by default.
**Fix:** Added `override_special = "!#$%&*()-_=+[]{}<>:?"` to exclude the forbidden characters.

### **Issue 14 — Lambda Reserved Concurrency Limit**

**Error:**

```text
InvalidParameterValueException: Specified ReservedConcurrentExecutions for function decreases account's UnreservedConcurrentExecution below its minimum value of [100].
```

**Root Cause:** Setting `reserved_concurrent_executions` for multiple functions in an account with a low concurrency
limit violated the minimum unreserved concurrency requirement.
**Fix:** Set `lambda_concurrency` to `-1` for the `dev` environment to remove the reserved concurrency limit.

### **Issue 15 — Invalid Redis Endpoint Attribute**

**Error:**

```text
Redis endpoint is missing or null in outputs and Lambda environment variables.
```

**Root Cause:** The code used `configuration_endpoint_address`, which is only available when Redis Cluster Mode is
enabled. The current configuration has Cluster Mode disabled.
**Fix:** Changed `configuration_endpoint_address` to `primary_endpoint_address` in outputs and Lambda environment variables.
