# MODEL_FAILURES.md - Issues Found in MODEL_RESPONSE

This document catalogs all issues, errors, and missing requirements found in the initial MODEL_RESPONSE.md implementation.

## Critical Issues

### 1. Missing AWS WAF Integration for API Gateway
**Severity**: Critical
**Location**: `lib/tap_stack.py` - API Gateway configuration
**Issue**: The PROMPT.md explicitly requires "Configure API Gateway with AWS WAF integration using managed rule sets" but the MODEL_RESPONSE does not create:
- AWS WAFv2 WebACL
- WAF association with API Gateway
- Managed rule groups (AWSManagedRulesCommonRuleSet, etc.)

**Impact**: Security requirement not met, API Gateway is not protected against common web exploits.

**Required Fix**: Add WAFv2 WebACL with managed rule sets and associate it with the API Gateway stage.

---

### 2. Missing VPC Endpoints for SNS and SQS
**Severity**: Critical
**Location**: `lib/tap_stack.py` - VPC configuration
**Issue**: Only DynamoDB VPC endpoint is created. PROMPT.md requires "VPC endpoints for AWS services (no internet routing)" but missing:
- SQS VPC endpoint (com.amazonaws.us-east-2.sqs)
- SNS VPC endpoint (com.amazonaws.us-east-2.sns)
- CloudWatch Logs VPC endpoint (com.amazonaws.us-east-2.logs)

**Impact**: Lambda functions in VPC cannot access SQS, SNS, or CloudWatch Logs without internet gateway/NAT, causing failures.

**Required Fix**: Add Interface VPC endpoints for SQS, SNS, and CloudWatch Logs with proper security group configuration.

---

### 3. Incomplete VPC Endpoint Configuration
**Severity**: High
**Location**: `lib/tap_stack.py` - Line 93-100
**Issue**: DynamoDB VPC endpoint has `route_table_ids=[]` (empty list). Gateway endpoints require route table associations to work.

**Impact**: DynamoDB traffic may route through internet gateway instead of VPC endpoint.

**Required Fix**: Create route tables for private subnets and associate with DynamoDB endpoint.

---

### 4. Missing Route Tables for Private Subnets
**Severity**: High
**Location**: `lib/tap_stack.py` - VPC configuration
**Issue**: Private subnets are created but no route tables are defined. Subnets need explicit route tables for VPC endpoint routing.

**Impact**: Network routing undefined, VPC endpoints won't function properly.

**Required Fix**: Create route tables, associate with private subnets, and reference in VPC endpoint configuration.

---

### 5. Incorrect CloudWatch Dashboard Metrics Configuration
**Severity**: Medium
**Location**: `lib/tap_stack.py` - Lines 476-525
**Issue**: Dashboard widgets use generic metric references without function-specific dimensions. The metrics array uses:
```python
["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Validator Invocations"}]
```
But doesn't specify which Lambda function, so it will aggregate ALL Lambda functions in the account.

**Impact**: Dashboard shows incorrect metrics, aggregating data from unrelated Lambda functions.

**Required Fix**: Add `"dimensions": {"FunctionName": function_name}` to each metric specification.

---

### 6. Insufficient CloudWatch Alarms
**Severity**: Medium
**Location**: `lib/tap_stack.py` - Lines 529-545
**Issue**: Only one alarm created for validator function errors. PROMPT.md requires "CloudWatch Alarms for Lambda errors exceeding 1%" for ALL Lambda functions.

**Impact**: Missing alarms for fraud_detector and failed_handler functions.

**Required Fix**: Create error alarms for all three Lambda functions with proper error rate calculation (errors/invocations > 0.01).

---

### 7. Incorrect Alarm Threshold for Error Rate
**Severity**: Medium
**Location**: `lib/tap_stack.py` - Line 539
**Issue**: Alarm threshold is set to `1.0` (absolute count) but PROMPT requires "1% error rate". Current alarm triggers on 1 error, not 1% of invocations.

**Impact**: Alarm will trigger too frequently, causing alert fatigue.

**Required Fix**: Use math expression to calculate error rate: `(errors/invocations) * 100` and set threshold to 1.0 (percent).

---

### 8. Missing SNS Email Subscription
**Severity**: Medium
**Location**: `lib/tap_stack.py` - SNS configuration
**Issue**: SNS topic `fraud_topic` is created but PROMPT.md requires "SNS topic for alerting on fraud detection with email subscription". No subscription is created.

**Impact**: Fraud alerts are published but not delivered to anyone.

**Required Fix**: Add `aws.sns.TopicSubscription` resource with email protocol (note: email will require manual confirmation).

---

### 9. Missing X-Ray for API Gateway
**Severity**: Medium
**Location**: `lib/tap_stack.py` - API Gateway configuration
**Issue**: PROMPT.md requires "X-Ray tracing for all Lambda functions and API Gateway" but API Gateway stage doesn't enable X-Ray tracing.

**Impact**: Incomplete distributed tracing, cannot trace requests through API Gateway.

**Required Fix**: Set `xray_tracing_enabled=True` on the API Gateway stage (requires using `aws.apigateway.Stage` resource).

---

### 10. Hard-Coded Stage Name in Deployment
**Severity**: Low
**Location**: `lib/tap_stack.py` - Line 441
**Issue**: API Gateway deployment uses hard-coded `stage_name="prod"` which violates environment-agnostic design.

**Impact**: All deployments use "prod" stage regardless of actual environment.

**Required Fix**: Use dynamic stage name like `f"{self.environment_suffix}"` or `"api"`.

---

### 11. Missing CloudWatch Dashboard URL in Exports
**Severity**: Low
**Location**: `lib/tap_stack.py` - Lines 553-556, 569-572
**Issue**: Dashboard URL is constructed but duplicated in both `pulumi.export()` and `self.register_outputs()`. The URL format is correct but redundant.

**Impact**: Minor code duplication, no functional issue.

**Recommended Fix**: Remove duplication, use only `pulumi.export()` (or consolidate into register_outputs).

---

## Lambda Code Issues

### 12. Missing X-Ray SDK Instrumentation
**Severity**: Medium
**Location**: All Lambda functions (`lib/lambda/*/index.py`)
**Issue**: Lambda functions have X-Ray tracing enabled in configuration but the Python code doesn't import or use the X-Ray SDK. Without `aws_xray_sdk.core.patch_all()`, boto3 calls won't be traced.

**Impact**: X-Ray traces will show Lambda invocation but not downstream service calls (DynamoDB, SQS, SNS).

**Required Fix**: Add X-Ray SDK:
```python
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all
patch_all()
```

---

### 13. Incorrect DynamoDB Query in Fraud Detector
**Severity**: High
**Location**: `lib/lambda/fraud_detector/index.py` - Lines 699-702
**Issue**: Query uses `KeyConditionExpression='transaction_id = :tid'` but transaction_id is the partition key and each transaction has a unique ID. This query will only return the current transaction, not historical ones for fraud pattern detection.

**Impact**: Fraud detection logic doesn't work as intended, cannot detect patterns.

**Required Fix**: Query should use merchant_id or implement GSI for merchant-based queries, or use a different fraud detection approach.

---

### 14. Missing Lambda Dependencies
**Severity**: High
**Location**: Lambda function directories
**Issue**: Lambda functions use `boto3` and `aws_xray_sdk` but no `requirements.txt` files are provided in the lambda directories. While boto3 is available by default, specific versions and X-Ray SDK need to be packaged.

**Impact**: X-Ray SDK not available at runtime, causing import errors.

**Required Fix**: Create `requirements.txt` in each Lambda directory:
```txt
aws-xray-sdk==2.12.0
```

---

### 15. Missing Error Handling for SQS Message Deletion
**Severity**: Low
**Location**: `lib/lambda/fraud_detector/index.py`, `lib/lambda/failed_handler/index.py`
**Issue**: Lambda functions process SQS messages but don't explicitly delete them. While Lambda auto-deletes on successful return, errors would cause reprocessing without DLQ handling.

**Impact**: If Lambda fails after processing but before return, message may be reprocessed.

**Recommended Fix**: Explicit error handling and logging for partial failures.

---

## Infrastructure Configuration Issues

### 16. Missing Route Table for VPC Endpoint
**Severity**: High
**Location**: `lib/tap_stack.py` - DynamoDB endpoint
**Issue**: DynamoDB Gateway endpoint requires route table IDs but passes empty list `route_table_ids=[]`.

**Impact**: Endpoint not properly configured, traffic may not route through endpoint.

**Required Fix**: Create route tables for private subnets and pass their IDs.

---

### 17. Missing Security Group for VPC Endpoints
**Severity**: High
**Location**: `lib/tap_stack.py` - VPC configuration
**Issue**: Interface VPC endpoints (SQS, SNS, Logs) will need security groups to allow inbound traffic from Lambda security group on port 443.

**Impact**: Lambda functions won't be able to connect to VPC endpoints.

**Required Fix**: Create security group for VPC endpoints with ingress rule allowing port 443 from Lambda SG.

---

### 18. Missing Stage Configuration for API Gateway
**Severity**: Medium
**Location**: `lib/tap_stack.py` - API Gateway deployment
**Issue**: Using `aws.apigateway.Deployment` with `stage_name` parameter creates an implicit stage, but explicit `aws.apigateway.Stage` resource is needed for:
- X-Ray tracing configuration
- Access logging
- Stage-level settings

**Impact**: Cannot configure stage-specific features like X-Ray tracing, access logs, or throttling.

**Required Fix**: Create explicit `aws.apigateway.Stage` resource with X-Ray enabled.

---

### 19. Missing API Gateway Access Logs
**Severity**: Low
**Location**: `lib/tap_stack.py` - API Gateway configuration
**Issue**: Best practice for production APIs is to enable CloudWatch access logs, but this is not configured.

**Impact**: Cannot audit API access or troubleshoot request issues.

**Recommended Fix**: Create CloudWatch log group for API Gateway and configure access logging on stage.

---

### 20. Missing Lambda Function Dead Letter Queue Configuration
**Severity**: Medium
**Location**: `lib/tap_stack.py` - Lambda function configurations
**Issue**: PROMPT requires DLQ for SQS queues (correctly implemented), but Lambda functions themselves don't have DLQ configuration for async invocation failures.

**Impact**: If API Gateway invokes validator Lambda asynchronously and it fails, no DLQ captures the event.

**Note**: This may be intentional since API Gateway uses synchronous invocation, but best practice for Lambda is to configure DLQ.

**Recommended Fix**: Add `dead_letter_config` to Lambda functions pointing to an SNS topic or SQS queue.

---

## Testing and Operational Issues

### 21. Missing Integration Test Hooks
**Severity**: Low
**Location**: General infrastructure
**Issue**: No test-specific resources or outputs to facilitate integration testing (e.g., test merchant data, sample transaction format).

**Impact**: Integration tests will need to manually populate DynamoDB and construct requests.

**Recommended Fix**: Add output with sample transaction JSON format and create test merchant entry.

---

### 22. Missing Resource Tagging
**Severity**: Low
**Location**: Various resources
**Issue**: While provider has default tags, some resources might benefit from specific tags like "Component" or "Purpose".

**Impact**: Resource organization and cost allocation could be improved.

**Recommended Fix**: Add resource-specific tags where helpful.

---

## Summary

**Total Issues Found**: 22
- **Critical**: 2
- **High**: 6
- **Medium**: 9
- **Low**: 5

**Blocker Issues** (must fix before deployment):
1. Missing VPC endpoints for SQS, SNS, CloudWatch Logs
2. Empty route_table_ids for DynamoDB endpoint
3. Missing route tables for private subnets
4. Missing security group for VPC endpoints
5. Missing AWS WAF integration
6. Incorrect fraud detection query logic

**High Priority** (should fix before production):
7. Missing X-Ray SDK instrumentation in Lambda code
8. Incomplete CloudWatch alarms
9. Missing SNS email subscription
10. Incorrect alarm threshold calculation

All issues are documented with specific line numbers, severity ratings, and required fixes to bring MODEL_RESPONSE up to IDEAL_RESPONSE quality.
