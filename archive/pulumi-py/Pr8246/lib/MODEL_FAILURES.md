# Model Failures and Corrections

This document catalogs all errors, design flaws, and improvements made between MODEL_RESPONSE and IDEAL_RESPONSE.

## Critical Errors

### 1. Invalid Event Source Mapping Configuration
**Issue**: Lambda EventSourceMapping incorrectly configured with Lambda ARN instead of SQS/DynamoDB Stream
```python
# INCORRECT (MODEL_RESPONSE)
event_source_mapping = aws.lambda_.EventSourceMapping(
    f"router-event-source-{self.environment_suffix}",
    event_source_arn=self.validator_lambda.arn,  # WRONG - Lambda ARN
    function_name=self.router_lambda.name,
    enabled=True,
    batch_size=10,
)
```

**Root Cause**: EventSourceMapping cannot use Lambda ARN as event source. Lambda functions trigger other functions via direct invocation, SQS, or DynamoDB Streams.

**Correction**: Router Lambda should be invoked by validator Lambda directly using asynchronous invocation after validation succeeds. Remove invalid EventSourceMapping and update validator Lambda code to invoke router.

**Impact**: CRITICAL - Deployment would fail. EventSourceMapping requires valid event source (SQS, DynamoDB, Kinesis, etc.)

### 2. Router Lambda Design Flaw
**Issue**: Router Lambda expects API Gateway event format (`event['body']`) but would receive different format if triggered by EventSourceMapping

```python
# INCORRECT assumption in router code
def handler(event, context):
    body = json.loads(event['body'])  # Assumes API Gateway format
```

**Root Cause**: Mismatch between invocation method and event structure parsing

**Correction**: Router Lambda should be invoked asynchronously by validator Lambda with clean JSON payload, not API Gateway event wrapper

**Impact**: CRITICAL - Runtime error if EventSourceMapping worked

### 3. Missing Async Invocation from Validator to Router
**Issue**: Validator Lambda doesn't invoke router Lambda, creating a broken processing pipeline

**Root Cause**: Validator returns response to API Gateway but doesn't trigger downstream processing

**Correction**: Validator should invoke router Lambda asynchronously after storing event in DynamoDB

**Impact**: CRITICAL - Router Lambda never executes, events never reach SQS queues

## Design Flaws

### 4. Incomplete IAM Permissions
**Issue**: Validator Lambda role missing permission to invoke router Lambda

**Root Cause**: No IAM policy allowing `lambda:InvokeFunction` on router Lambda

**Correction**: Add inline policy to validator role granting invoke permission on router Lambda

**Impact**: HIGH - Validator cannot invoke router, pipeline broken

### 5. Model Name Conflict
**Issue**: API Gateway Model uses static name "WebhookModel" which may conflict in multi-environment deployments

```python
# PROBLEMATIC
request_model = aws.apigateway.Model(
    f"webhook-model-{self.environment_suffix}",
    name="WebhookModel",  # No environment suffix
    ...
)
```

**Root Cause**: Model name should include environment suffix for uniqueness

**Correction**: Change name to `f"WebhookModel-{self.environment_suffix}"`

**Impact**: MEDIUM - Potential conflict if deploying multiple environments to same API Gateway

### 6. Missing Deployment Trigger
**Issue**: API Gateway deployment doesn't have a unique trigger, may not redeploy on changes

**Root Cause**: Pulumi may not detect changes requiring redeployment

**Correction**: Add `triggers` parameter with hash of deployment configuration or timestamp to force redeployment

**Impact**: MEDIUM - API Gateway may serve stale configuration after updates

## Security Issues

### 7. Overly Permissive Lambda Permissions
**Issue**: API Gateway Lambda permission uses wildcard path `/*/*/*`

```python
source_arn=pulumi.Output.all(self.api.execution_arn, webhook_resource.path).apply(
    lambda args: f"{args[0]}/*/*/*"
)
```

**Root Cause**: Permission allows ANY stage, method, resource path

**Correction**: Restrict to specific stage and path: `{execution_arn}/prod/POST/webhook`

**Impact**: LOW - Overly permissive but functionally acceptable

### 8. Missing Encryption Configuration
**Issue**: SQS queues and DynamoDB don't explicitly configure encryption

**Root Cause**: While AWS provides default encryption, explicit configuration is best practice

**Correction**: Add `sqs_managed_sse_enabled=True` for SQS and encryption configuration for DynamoDB (already using AWS managed by default)

**Impact**: LOW - AWS provides default encryption, but explicit is better

## Code Quality Issues

### 9. Lambda Code Uses datetime.utcnow() (Deprecated)
**Issue**: Python 3.11 deprecates `datetime.utcnow()`

```python
'processed_at': datetime.utcnow().isoformat()
```

**Root Cause**: Using deprecated API

**Correction**: Use `datetime.now(timezone.utc).isoformat()`

**Impact**: LOW - Still works but generates deprecation warnings

### 10. Missing Error Handling in Router Lambda
**Issue**: Router Lambda doesn't handle router invocation failures gracefully

**Root Cause**: No retry logic or error propagation

**Correction**: Add try-except with proper error logging and status code handling

**Impact**: LOW - Errors would still be logged but less gracefully

## Missing Requirements

### 11. Incomplete DynamoDB TTL Configuration
**Issue**: No TTL configured for DynamoDB table cleanup

**Root Cause**: Events accumulate indefinitely, increasing storage costs

**Correction**: Add TTL attribute for automatic cleanup of old events (e.g., 30 days)

**Impact**: MEDIUM - Cost accumulation over time

### 12. Missing CloudWatch Alarms
**Issue**: No monitoring alarms for DLQ messages, Lambda errors, or API Gateway errors

**Root Cause**: Not explicitly required but important for production

**Correction**: Add CloudWatch alarms for critical metrics

**Impact**: LOW - Operational visibility gap

### 13. Missing Lambda Layer for Shared Dependencies
**Issue**: Both Lambdas import boto3, duplicating dependency

**Root Cause**: Inline code doesn't optimize for shared dependencies

**Correction**: Consider Lambda layer for shared libraries (though boto3 is included in runtime)

**Impact**: VERY LOW - Boto3 already in Lambda runtime

## Testing Gaps

### 14. Lambda Timeout Not Configured
**Issue**: Lambdas use default timeout (3 seconds) which may be insufficient

**Root Cause**: No explicit timeout configuration

**Correction**: Set appropriate timeout (e.g., 30 seconds for validator, 60 for router)

**Impact**: MEDIUM - Lambda may timeout during DynamoDB or SQS operations

### 15. Missing Memory Configuration
**Issue**: Lambdas use default memory (128 MB)

**Root Cause**: No explicit memory configuration

**Correction**: Set appropriate memory (e.g., 256 MB) for better performance

**Impact**: LOW - May work but could be slow

## Summary of Corrections

**Critical Fixes Required:**
1. Remove invalid EventSourceMapping
2. Update validator Lambda to invoke router asynchronously
3. Add IAM permission for validator to invoke router
4. Fix router Lambda event parsing for direct invocation

**Important Improvements:**
5. Add environment suffix to model name
6. Add deployment triggers for API Gateway
7. Configure explicit timeouts and memory
8. Fix deprecated datetime usage
9. Add DynamoDB TTL
10. Add SQS encryption explicitly

**Total Issues:** 15
**Critical:** 4
**High:** 1
**Medium:** 4
**Low:** 6

All critical and high-priority issues are fixed in IDEAL_RESPONSE.md.
