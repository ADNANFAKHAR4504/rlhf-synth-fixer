# Model Failures and Fixes

This document details all errors found in the MODEL_RESPONSE and the corrections applied in IDEAL_RESPONSE.

## Error 1: Missing S3 Versioning on Raw Bucket

**Location**: `lib/tap_stack.py` - RawBucket creation

**Issue**: Raw bucket did not have versioning enabled, violating the requirement "S3 buckets must have versioning enabled"

**Original Code**:
```python
raw_bucket = s3.Bucket(
    self, "RawBucket",
    bucket_name=f"etl-raw-{env_suffix.value_as_string}",
    removal_policy=RemovalPolicy.RETAIN,  # Also wrong
    lifecycle_rules=[...]
)
```

**Fixed Code**:
```python
raw_bucket = s3.Bucket(
    self, "RawBucket",
    bucket_name=f"etl-raw-{env_suffix.value_as_string}",
    versioned=True,  # ADDED
    removal_policy=RemovalPolicy.DESTROY,
    auto_delete_objects=True,
    lifecycle_rules=[...]
)
```

**Impact**: Without versioning, the bucket cannot maintain audit trail of file modifications, violating compliance requirements.

---

## Error 2: Incorrect RemovalPolicy on Raw Bucket

**Location**: `lib/tap_stack.py` - RawBucket creation

**Issue**: Raw bucket used `RemovalPolicy.RETAIN` instead of `DESTROY`, preventing complete stack deletion

**Original Code**:
```python
removal_policy=RemovalPolicy.RETAIN
```

**Fixed Code**:
```python
removal_policy=RemovalPolicy.DESTROY,
auto_delete_objects=True
```

**Impact**: Prevents automated testing and cleanup. Stack deletion would fail, leaving orphaned resources.

---

## Error 3: Missing Point-in-Time Recovery on DynamoDB

**Location**: `lib/tap_stack.py` - ProcessingTable creation

**Issue**: DynamoDB table did not have point-in-time recovery enabled, violating requirement "DynamoDB must use on-demand billing mode with point-in-time recovery enabled"

**Original Code**:
```python
processing_table = dynamodb.Table(
    self, "ProcessingTable",
    table_name=f"etl-processing-status-{env_suffix.value_as_string}",
    partition_key=dynamodb.Attribute(
        name="file_id",
        type=dynamodb.AttributeType.STRING
    ),
    billing_mode=dynamodb.BillingMode.ON_DEMAND,
    removal_policy=RemovalPolicy.DESTROY
)
```

**Fixed Code**:
```python
processing_table = dynamodb.Table(
    self, "ProcessingTable",
    table_name=f"etl-processing-status-{env_suffix.value_as_string}",
    partition_key=dynamodb.Attribute(
        name="file_id",
        type=dynamodb.AttributeType.STRING
    ),
    billing_mode=dynamodb.BillingMode.ON_DEMAND,
    point_in_time_recovery=True,  # ADDED
    removal_policy=RemovalPolicy.DESTROY
)
```

**Impact**: Without PITR, data cannot be recovered in case of accidental deletion or corruption, violating data protection requirements.

---

## Error 4: Wrong Lambda Runtime Version

**Location**: `lib/tap_stack.py` - ValidationFunction creation

**Issue**: Validation function used Python 3.9 instead of required Python 3.11, violating "Lambda functions must use Python 3.11 runtime"

**Original Code**:
```python
validation_function = lambda_.Function(
    self, "ValidationFunction",
    function_name=f"etl-validation-{env_suffix.value_as_string}",
    runtime=lambda_.Runtime.PYTHON_3_9,  # WRONG
    handler="validation.handler",
    code=lambda_.Code.from_asset("lib/lambda/validation"),
    memory_size=3072,
    timeout=Duration.minutes(5),
    environment={...}
)
```

**Fixed Code**:
```python
validation_function = lambda_.Function(
    self, "ValidationFunction",
    function_name=f"etl-validation-{env_suffix.value_as_string}",
    runtime=lambda_.Runtime.PYTHON_3_11,  # FIXED
    handler="validation.handler",
    code=lambda_.Code.from_asset("lib/lambda/validation"),
    memory_size=3072,
    timeout=Duration.minutes(5),
    log_retention=logs.RetentionDays.ONE_MONTH,  # Also added
    environment={...}
)
```

**Impact**: Using wrong runtime version may cause compatibility issues and does not meet specified requirements.

---

## Error 5: Missing CloudWatch Log Retention

**Location**: `lib/tap_stack.py` - Both Lambda function creations

**Issue**: Lambda functions did not specify log retention, violating "Implement CloudWatch Logs with 30-day retention for all Lambda functions"

**Original Code**:
```python
validation_function = lambda_.Function(
    self, "ValidationFunction",
    ...
    timeout=Duration.minutes(5),
    environment={...}
)
# No log_retention parameter
```

**Fixed Code**:
```python
validation_function = lambda_.Function(
    self, "ValidationFunction",
    ...
    timeout=Duration.minutes(5),
    log_retention=logs.RetentionDays.ONE_MONTH,  # ADDED
    environment={...}
)
```

**Import Added**:
```python
from aws_cdk import (
    ...
    aws_logs as logs,  # ADDED
    ...
)
```

**Impact**: Logs retained indefinitely incur unnecessary costs and violate compliance requirements for 30-day retention.

---

## Error 6: Missing Exponential Backoff Retry Configuration

**Location**: `lib/tap_stack.py` - Step Functions task definitions

**Issue**: Step Functions tasks did not implement exponential backoff retry logic, violating "Step Functions must implement exponential backoff retry logic with maximum 3 attempts"

**Original Code**:
```python
validation_task = tasks.LambdaInvoke(
    self, "ValidateFile",
    lambda_function=validation_function,
    output_path="$.Payload"
)

transformation_task = tasks.LambdaInvoke(
    self, "TransformFile",
    lambda_function=transformation_function,
    output_path="$.Payload",
    retry_on_service_exceptions=True
)
```

**Fixed Code**:
```python
validation_task = tasks.LambdaInvoke(
    self, "ValidateFile",
    lambda_function=validation_function,
    output_path="$.Payload",
    retry_on_service_exceptions=True,
    # ADDED exponential backoff configuration
    max_attempts=3,
    backoff_rate=2.0,
    interval=Duration.seconds(2),
    errors=["States.TaskFailed", "States.Timeout"]
)

transformation_task = tasks.LambdaInvoke(
    self, "TransformFile",
    lambda_function=transformation_function,
    output_path="$.Payload",
    retry_on_service_exceptions=True,
    # ADDED exponential backoff configuration
    max_attempts=3,
    backoff_rate=2.0,
    interval=Duration.seconds(2),
    errors=["States.TaskFailed", "States.Timeout"]
)
```

**Impact**: Without retry logic, transient failures would cause immediate workflow failure, reducing reliability.

---

## Error 7: Missing File Extension Filter in EventBridge

**Location**: `lib/tap_stack.py` - EventBridge rule configuration

**Issue**: EventBridge rule did not filter for .csv and .json extensions, violating "EventBridge rules must filter for .csv and .json file extensions only"

**Original Code**:
```python
rule = events.Rule(
    self, "S3EventRule",
    rule_name=f"etl-s3-event-{env_suffix.value_as_string}",
    event_pattern=events.EventPattern(
        source=["aws.s3"],
        detail_type=["Object Created"],
        detail={
            "bucket": {
                "name": [raw_bucket.bucket_name]
            }
        }
    )
)
```

**Fixed Code**:
```python
# First enable EventBridge on bucket
raw_bucket.enable_event_bridge_notification()  # ADDED

rule = events.Rule(
    self, "S3EventRule",
    rule_name=f"etl-s3-event-{env_suffix.value_as_string}",
    event_pattern=events.EventPattern(
        source=["aws.s3"],
        detail_type=["Object Created"],
        detail={
            "bucket": {
                "name": [raw_bucket.bucket_name]
            },
            # ADDED file extension filter
            "object": {
                "key": [
                    {"suffix": ".csv"},
                    {"suffix": ".json"}
                ]
            }
        }
    )
)
```

**Impact**: Without filtering, all file uploads would trigger the pipeline regardless of file type, wasting resources and potentially causing errors.

---

## Error 8: Incorrect CloudWatch Alarm Configuration

**Location**: `lib/tap_stack.py` - CloudWatch alarm creation

**Issue**: Alarms monitored absolute error count instead of percentage-based error rate, violating "CloudWatch alarms for Lambda errors exceeding 5% threshold"

**Original Code**:
```python
cloudwatch.Alarm(
    self, "ValidationErrorAlarm",
    alarm_name=f"etl-validation-errors-{env_suffix.value_as_string}",
    metric=validation_function.metric_errors(),  # Absolute count
    threshold=5,  # 5 errors, not 5%
    evaluation_periods=1,
    datapoints_to_alarm=1
)
```

**Fixed Code**:
```python
validation_error_rate = cloudwatch.MathExpression(
    expression="(errors / invocations) * 100",
    using_metrics={
        "errors": validation_function.metric_errors(
            statistic="Sum",
            period=Duration.minutes(5)
        ),
        "invocations": validation_function.metric_invocations(
            statistic="Sum",
            period=Duration.minutes(5)
        )
    }
)

cloudwatch.Alarm(
    self, "ValidationErrorAlarm",
    alarm_name=f"etl-validation-errors-{env_suffix.value_as_string}",
    metric=validation_error_rate,  # Percentage
    threshold=5,  # 5% error rate
    evaluation_periods=2,
    datapoints_to_alarm=2,
    comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
)
```

**Impact**: Original alarm would trigger after 5 total errors regardless of volume, causing false positives during high-load periods.

---

## Additional Improvements Made

### Resource Tagging

**Added**: Stack-level tags for all resources
```python
Tags.of(self).add("Environment", "Production")
Tags.of(self).add("Project", "ETL-Pipeline")
```

**Impact**: Enables proper resource tracking, cost allocation, and compliance monitoring.

---

## Summary

**Total Errors Fixed**: 8

**Categories**:
- Configuration errors (versioning, PITR, runtime): 3
- Missing functionality (log retention, retry logic, filtering): 3
- Resource policy errors (RemovalPolicy): 1
- Monitoring errors (alarm configuration): 1

**All requirements from PROMPT.md are now satisfied**:
- S3 versioning enabled on both buckets
- Complete destroyability with DESTROY policy
- DynamoDB with point-in-time recovery
- Lambda functions using Python 3.11
- CloudWatch logs with 30-day retention
- Step Functions with exponential backoff (3 attempts, 2x rate)
- EventBridge filtering for .csv and .json only
- CloudWatch alarms monitoring 5% error rate threshold
- Resource tagging for Environment and Project
