
### **Issue 1 — Reserved Master Username**

**Error:**

```text
InvalidParameterValue: MasterUsername admin cannot be used as it is a reserved word used by the engine
```

**Root Cause:** "admin" is a reserved username in Aurora.
**Fix:** Changed `master_username` to "dbadmin" in all files.

### **Issue 2 — Invalid RDS Password Characters**

**Error:**

```text
InvalidParameterValue: The parameter MasterUserPassword is not a valid password. Only printable ASCII characters besides '/', '@', '"', ' ' may be used.
```

**Root Cause:** The `random_password` resource included invalid characters (`@`, `/`, `"`, ` `) by default.
**Fix:** Added `override_special = "!#$%&*()-_=+[]{}<>:?"` to exclude the forbidden characters.

### **Issue 3 — Invalid API Gateway Stage Throttling Configuration**

**Error:**

```text
Error: Unsupported argument
on tap_stack.tf line 2138, in resource "aws_api_gateway_stage" "orders":
2138:   throttle_settings {
An argument named "throttle_settings" is not expected here.
```

**Root Cause:** `throttle_settings` is not a valid argument for `aws_api_gateway_stage`. Throttling should be configured
in `aws_api_gateway_method_settings`.
**Fix:** Removed the `throttle_settings` block from `aws_api_gateway_stage`.

### **Issue 4 — Invalid WebSocket API Stage Throttling Arguments**

**Error:**

```text
Error: Unsupported argument
on tap_stack.tf line 2240, in resource "aws_apigatewayv2_stage" "websocket":
2240:     throttle_rate_limit  = var.throttle_rate_limit
An argument named "throttle_rate_limit" is not expected here.
```

**Root Cause:** The arguments for throttling in `aws_apigatewayv2_stage` `default_route_settings` are
`throttling_rate_limit` and `throttling_burst_limit`, not `throttle_rate_limit` and `throttle_burst_limit`.
**Fix:** Renamed `throttle_rate_limit` to `throttling_rate_limit` and `throttle_burst_limit` to `throttling_burst_limit`.

### **Issue 5 — IAM Role Name Prefix Too Long**

**Error:**

```text
Error: expected length of name_prefix to be in the range (1 - 38), got tap-delivery-dev-pr1234-rds-monitoring-
```

**Root Cause:** The generated `name_prefix` for IAM roles (project name + env + PR number + suffix) exceeded the AWS
limit of 38 characters.
**Fix:** Shortened the suffixes for IAM roles (e.g., `rds-monitoring` to `rds-mon`, `step-functions` to `sfn`).

### **Issue 6 — Invalid Lambda Event Source Mapping Configuration**

**Error:**

```text
Error: creating Lambda Event Source Mapping: InvalidParameterValueException: Maximum batch window in seconds must be greater than 0 if maximum batch size is greater than 10
```

**Root Cause:** The `aws_lambda_event_source_mapping` for `sqs_customer` had a `batch_size` of 25 but no
`maximum_batching_window_in_seconds` defined. SQS requires a batch window if batch size > 10.
**Fix:** Added `maximum_batching_window_in_seconds = 2` to the `sqs_customer` event source mapping.

### **Issue 7 — Invalid Lambda Concurrency Configuration**

**Error:**

```text
InvalidParameterValueException: Specified ReservedConcurrentExecutions for function decreases account's UnreservedConcurrentExecution below its minimum value of [100].
```

**Root Cause:** The sum of `reserved_concurrent_executions` for all functions in the stack (12 functions * 10 = 120),
combined with the account's unreserved minimum (100), exceeded the account's available concurrency limit (likely 1000
or lower in this sandbox environment).
**Fix:** Updated `capacity_map` in `tap_stack.tf` to set `lambda_concurrent` to `-1` for the `dev` environment. This
configures the functions to use unreserved concurrency, avoiding the limit.
