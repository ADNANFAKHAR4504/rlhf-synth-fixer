### **Issue 1 — Invalid RDS Password Characters**

**Error:**

```text
InvalidParameterValue: The parameter MasterUserPassword is not a valid password. Only printable ASCII characters besides '/', '@', '"', ' ' may be used.
```

**Root Cause:** The `random_password` resource included invalid characters (`@`, `/`, `"`, ` `) by default.
**Fix:** Added `override_special = "!#$%&*()-_=+[]{}<>:?"` to exclude the forbidden characters.

### **Issue 2 — Invalid S3 Lifecycle Configuration**

**Error:**

```text
Warning: Invalid Attribute Combination ... No attribute specified when one (and only one) of [rule[0].filter,rule[0].prefix] is required
```

**Root Cause:** The `aws_s3_bucket_lifecycle_configuration` resource was missing the required `filter` block in the
lifecycle rule.
**Fix:** Added an empty `filter {}` block to apply the rule to all objects in the bucket.

### **Issue 3 — Deprecated API Gateway Attribute**

**Error:**

```text
Warning: Deprecated attribute ... "invoke_url" is deprecated
```

**Root Cause:** The `aws_api_gateway_deployment` resource's `invoke_url` attribute is deprecated.
**Fix:** Updated the output to use `aws_api_gateway_stage.main.invoke_url` instead.

### **Issue 4 — Invalid Redis Endpoint Attribute**

**Error:**

```text
Invalid Parameter: configuration_endpoint_address is not available for Cluster Mode Disabled
```

**Root Cause:** The code used `configuration_endpoint_address` which is only valid for Redis Cluster Mode Enabled. The
configuration uses Cluster Mode Disabled (SIP).
**Fix:** Changed the endpoint reference to `primary_endpoint_address`.

### **Issue 5 — Connectivity Issue: VPC Endpoints**

**Error:**

```text
Connection Timeout: Lambda functions cannot connect to VPC Endpoints
```

**Root Cause:** The `lambda_vpc` security group, used by both Lambda functions and VPC Endpoints, lacked an ingress
rule to allow traffic from itself.
**Fix:** Added an ingress rule to the `lambda_vpc` security group allowing all traffic (`protocol = "-1"`) from `self`.

### **Issue 6 — Invalid PostgreSQL Version**

**Error:**

```text
InvalidParameterCombination: Cannot find version 15.4 for postgres
```

**Root Cause:** PostgreSQL version 15.4 is not available or supported in the selected region for Aurora.
**Fix:** Updated `engine_version` to `15.14` as a supported version.

### **Issue 7 — Reserved Lambda Environment Variable**

**Error:**

```text
InvalidParameterValueException: Lambda was unable to configure your environment variables ... Reserved keys used in this request: AWS_REGION
```

**Root Cause:** `AWS_REGION` is a reserved environment variable in AWS Lambda and cannot be set manually.
**Fix:** Removed `AWS_REGION` from the `lambda_env_vars` local map.

### **Issue 8 — KMS Key Policy Access Denied**

**Error:**

```text
AccessDeniedException: The specified KMS key does not exist or is not allowed to be used with Arn ...
```

**Root Cause:** The KMS keys created (for PHI and CloudWatch Logs) did not have explicit key policies allowing the
necessary services (CloudWatch Logs, Lambda, S3, etc.) to use them.
**Fix:** Added `aws_kms_key_policy` resources for both `phi_encryption` and `cloudwatch_logs` keys, explicitly
granting permissions to the root account and relevant AWS services.

### **Issue 9 — Conflicting SQS Configuration**

**Error:**

```text
Error: Conflicting configuration arguments ... "kms_master_key_id": conflicts with sqs_managed_sse_enabled
```

**Root Cause:** The SQS queue resources specified both `kms_master_key_id` (for SSE-KMS) and
`sqs_managed_sse_enabled = false` (to disable SSE-SQS). These arguments are mutually exclusive in the Terraform
provider.
**Fix:** Removed `sqs_managed_sse_enabled = false` from all SQS queues where `kms_master_key_id` is present.

### **Issue 10 — Deprecated API Gateway Stage Name**

**Error:**

```text
Warning: stage_name is deprecated. Use the aws_api_gateway_stage resource instead.
```

**Root Cause:** The `stage_name` argument in `aws_api_gateway_deployment` is deprecated.
**Fix:** Removed `stage_name` from the `aws_api_gateway_deployment` resource, relying on the `aws_api_gateway_stage`
resource for stage configuration.

### **Issue 11 — Invalid SQS Queue Policy Address**

**Error:**

```text
InvalidAddress: The address arn:aws:sqs:... is not valid for this endpoint.
```

**Root Cause:** The `aws_sqs_queue_policy` resource expects a Queue URL for the `queue_url` argument, but the
configuration was passing the Queue ARN.
**Fix:** Updated the `aws_sqs_queue_policy` resource to use the Queue URL (`.id`) for the `queue_url` argument and
the Queue ARN (`.arn`) for the policy resource field.

### **Issue 12 — Redis Parameter Group Not Found**

**Error:**

```text
CacheParameterGroupNotFound: CacheParameterGroup not found: default.redis7.0
```

**Root Cause:** The parameter group name `default.redis7.0` is incorrect for Redis 7.x.
**Fix:** Updated `parameter_group_name` to `default.redis7`.

### **Issue 13 — SNS FIFO Topic Mismatch**

**Error:**

```text
InvalidParameter: Invalid parameter: Endpoint Reason: FIFO SQS Queues can not be subscribed to standard SNS topics
```

**Root Cause:** The `pharmacy_fulfillment` queue is FIFO, but it was trying to subscribe to the `prescription_approved`
SNS topic, which was Standard. FIFO queues can only subscribe to FIFO SNS topics.
**Fix:** Converted `aws_sns_topic.prescription_approved` to a FIFO topic by setting `fifo_topic = true`,
`content_based_deduplication = true`, and appending `.fifo` to the topic name.

### **Issue 14 — SQS DLQ Type Mismatch**

**Error:**

```text
InvalidParameterValue: Value ... for parameter RedrivePolicy is invalid. Reason: Dead-letter queue must be same type of queue as the source.
```

**Root Cause:** The `patient_prescriptions` queue is FIFO, but its configured Dead Letter Queue (`patient_prescriptions_dlq`)
was Standard. FIFO queues must use FIFO DLQs.
**Fix:** Converted `patient_prescriptions_dlq` to a FIFO queue by adding `fifo_queue = true` and updating the name to
end with `.fifo`.

### **Issue 15 — Lambda SQS Permission Race Condition**

**Error:**

```text
InvalidParameterValueException: The function execution role does not have permissions to call ReceiveMessage on SQS
```

**Root Cause:** The Lambda event source mapping was being created before the IAM policy granting SQS permissions was
fully attached to the Lambda execution role, leading to a race condition.
**Fix:** Added `depends_on = [aws_iam_role_policy_attachment.lambda_base]` to the `aws_lambda_event_source_mapping`
resources to ensure permissions are in place before mapping creation.
