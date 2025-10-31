# Model Failures and Architectural Improvements

This document details the 10 critical failures in the model response and demonstrates our significant architectural improvements with code comparisons.

---

## 1. DynamoDB Schema Mismatch & Missing Contributor Insights

### Problem

The table is created with primary key `id` + `timestamp` instead of the required **partition key `symbol` and sort key `timestamp`**. Contributor Insights configuration is not present.

### Model Response (Incorrect)

```python
table = aws.dynamodb.Table(
    "data-table",
    name=table_name,
    billing_mode="PAY_PER_REQUEST",
    hash_key="id",  # WRONG - should be 'symbol'
    range_key="timestamp",
    attributes=[
        aws.dynamodb.TableAttributeArgs(name="id", type="S"),
        aws.dynamodb.TableAttributeArgs(name="timestamp", type="N")
    ]
    # Missing: Contributor Insights
)
```

### Our Solution (Correct)

```python
table = aws.dynamodb.Table(
    "data-table",
    name=table_name,
    billing_mode="PAY_PER_REQUEST",
    hash_key=self.config.dynamodb_partition_key,  # 'symbol'
    range_key=self.config.dynamodb_sort_key,  # 'timestamp'
    attributes=[
        aws.dynamodb.TableAttributeArgs(
            name=self.config.dynamodb_partition_key,  # 'symbol'
            type="S"
        ),
        aws.dynamodb.TableAttributeArgs(
            name=self.config.dynamodb_sort_key,  # 'timestamp'
            type="N"
        )
    ],
    point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
        enabled=True
    ),
    server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
        enabled=True
    ),
    tags=self.config.get_common_tags(),
    opts=opts
)

# Enable contributor insights
if self.config.enable_contributor_insights:
    aws.dynamodb.ContributorInsights(
        "data-table-insights",
        table_name=table.name,
        opts=opts
    )
```

**Impact**: CRITICAL - Correct data model enables proper querying by symbol and ensures observability.

---

## 2. Lambda Sizing / Timeout / Concurrency Wrong & DLQs Mis-Implemented

### Problem

The prompt requires Lambdas with **3 GB memory, 5-minute timeout, X-Ray,** each with its **own SQS DLQ (max 2 retries)**, and the processing Lambda reserved concurrency **100**. The model code uses smaller memory values (512/1024 MB), incorrect timeouts, and uses `EventSourceMapping` instead of proper SQS DLQs.

### Model Response (Incorrect)

```python
# Config uses wrong values
lambda_memory_size = 512  # WRONG - should be 3072 (3GB)
lambda_timeout = 30  # WRONG - should be 300 (5 minutes)

function = aws.lambda_.Function(
    "processing-lambda",
    runtime="python3.11",
    handler="index.handler",
    role=role.arn,
    code=FileArchive("./lambda"),
    timeout=30,  # WRONG - should be 300
    memory_size=512,  # WRONG - should be 3072
    # Missing: reserved_concurrent_executions
    # Missing: proper DLQ configuration
)

# WRONG: Uses EventSourceMapping instead of SQS DLQ
event_source = aws.lambda_.EventSourceMapping(
    "lambda-dlq-mapping",
    event_source_arn=queue_arn,
    function_name=function.name
)
```

### Our Solution (Correct)

```python
# Config with correct values
self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '300'))  # 5 minutes
self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '3072'))  # 3GB
self.lambda_max_retries = int(os.getenv('LAMBDA_MAX_RETRIES', '2'))
self.processing_lambda_concurrency = int(
    os.getenv('PROCESSING_LAMBDA_CONCURRENCY', '100')
)

# Create proper SQS DLQ
dlq = aws.sqs.Queue(
    "processing-lambda-dlq",
    name=queue_name,
    message_retention_seconds=1209600,  # 14 days
    visibility_timeout_seconds=self.config.lambda_timeout * 6,
    tags=self.config.get_common_tags(),
    opts=opts
)

# Lambda with correct configuration
function = aws.lambda_.Function(
    "processing-lambda",
    name=function_name,
    runtime=self.config.lambda_runtime,
    handler="processing_handler.lambda_handler",
    role=role.arn,
    code=FileArchive(lambda_code_path),
    timeout=self.config.lambda_timeout,  # 300 seconds
    memory_size=self.config.lambda_memory_size,  # 3072 MB
    reserved_concurrent_executions=self.config.processing_lambda_concurrency,  # 100
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "DYNAMODB_TABLE_NAME": self.dynamodb_table_name,
            "S3_BUCKET_NAME": self.s3_bucket_name
        }
    ),
    tracing_config=aws.lambda_.FunctionTracingConfigArgs(
        mode="Active" if self.config.enable_xray_tracing else "PassThrough"
    ),
    tags=self.config.get_common_tags(),
    opts=opts
)

# Proper DLQ configuration with FunctionEventInvokeConfig
aws.lambda_.FunctionEventInvokeConfig(
    "processing-lambda-invoke-config",
    function_name=function.name,
    maximum_retry_attempts=self.config.lambda_max_retries,  # 2
    destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
        on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
            destination=dlq_arn
        )
    ),
    opts=opts
)
```

**Impact**: CRITICAL - Production-ready Lambda configuration with proper error handling and performance.

---

## 3. S3 Event Notification / Object Format / Lifecycle Rules Wrong

### Problem

The prompt requires triggers for files uploaded under `incoming/` with CSV processing and lifecycle to **delete processed files after 30 days**. The model code uses wrong prefix (`uploads/`), wrong suffix (`.json`), and incorrect lifecycle rules.

### Model Response (Incorrect)

```python
# Wrong prefix and suffix
aws.s3.BucketNotification(
    "bucket-notification",
    bucket=bucket.id,
    lambda_functions=[
        aws.s3.BucketNotificationLambdaFunctionArgs(
            lambda_function_arn=lambda_arn,
            events=["s3:ObjectCreated:*"],
            filter_prefix="uploads/",  # WRONG - should be 'incoming/'
            filter_suffix=".json"  # WRONG - should be '.csv'
        )
    ]
)

# Wrong lifecycle rule - only handles versions, not processed files
aws.s3.BucketLifecycleConfiguration(
    "bucket-lifecycle",
    bucket=bucket.id,
    rules=[
        aws.s3.BucketLifecycleConfigurationRuleArgs(
            id="expire-old-versions",
            status="Enabled",
            noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                noncurrent_days=30  # Only handles versions, not processed files
            )
        )
    ]
)
```

### Our Solution (Correct)

```python
# Correct prefix and suffix from config
self.s3_incoming_prefix = os.getenv('S3_INCOMING_PREFIX', 'incoming/')
self.s3_file_suffix = os.getenv('S3_FILE_SUFFIX', '.csv')
self.s3_lifecycle_delete_days = int(os.getenv('S3_LIFECYCLE_DELETE_DAYS', '30'))

# Correct event notification
aws.s3.BucketNotification(
    "data-bucket-notification",
    bucket=self.data_bucket.id,
    lambda_functions=[
        aws.s3.BucketNotificationLambdaFunctionArgs(
            lambda_function_arn=lambda_function_arn,
            events=["s3:ObjectCreated:*"],
            filter_prefix=self.config.s3_incoming_prefix,  # 'incoming/'
            filter_suffix=self.config.s3_file_suffix  # '.csv'
        )
    ],
    opts=opts
)

# Comprehensive lifecycle rules
aws.s3.BucketLifecycleConfiguration(
    "data-bucket-lifecycle",
    bucket=bucket.id,
    rules=[
        aws.s3.BucketLifecycleConfigurationRuleArgs(
            id="delete-processed-files",
            status="Enabled",
            filter=aws.s3.BucketLifecycleConfigurationRuleFilterArgs(
                prefix="processed/"  # Files moved after processing
            ),
            expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                days=self.config.s3_lifecycle_delete_days  # 30 days
            )
        ),
        aws.s3.BucketLifecycleConfigurationRuleArgs(
            id="expire-old-versions",
            status="Enabled",
            noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                noncurrent_days=30
            )
        ),
        aws.s3.BucketLifecycleConfigurationRuleArgs(
            id="abort-incomplete-uploads",
            status="Enabled",
            abort_incomplete_multipart_upload=aws.s3.BucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadArgs(
                days_after_initiation=7
            )
        )
    ],
    opts=opts
)
```

**Impact**: CRITICAL - Correct event handling and automated cleanup of processed files.

---

## 4. CloudWatch Logs Retention / Metrics Mismatches

### Problem

The request specified **7-day** retention for Lambda logs; the implementation creates log groups with 30 or 90 days.

### Model Response (Incorrect)

```python
log_group = aws.cloudwatch.LogGroup(
    "lambda-logs",
    name=f"/aws/lambda/{function_name}",
    retention_in_days=30,  # WRONG - should be 7
    opts=opts
)
```

### Our Solution (Correct)

```python
# Config with correct retention
self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '7'))

# Log group with correct retention
log_group = aws.cloudwatch.LogGroup(
    "processing-lambda-logs",
    name=f"/aws/lambda/{function_name}",
    retention_in_days=self.config.log_retention_days,  # 7 days
    tags=self.config.get_common_tags(),
    opts=opts
)
```

**Impact**: MEDIUM - Cost optimization and compliance with requirements.

---

## 5. Alarms Implement Absolute Thresholds, Not Error-Rate (>1%)

### Problem

Lambda alarm uses `threshold=5` (absolute errors) rather than a metric-math expression to detect **errors > 1% of invocations**.

### Model Response (Incorrect)

```python
alarm = aws.cloudwatch.MetricAlarm(
    "lambda-errors",
    name=alarm_name,
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="Errors",
    namespace="AWS/Lambda",
    period=300,
    statistic="Sum",
    threshold=5,  # WRONG - absolute count, not percentage
    dimensions={"FunctionName": function_name}
)
```

### Our Solution (Correct)

```python
# Config with percentage threshold
self.alarm_error_rate_threshold = float(
    os.getenv('ALARM_ERROR_RATE_THRESHOLD', '0.01')  # 1%
)

# Alarm with metric math for percentage calculation
alarm = aws.cloudwatch.MetricAlarm(
    f"lambda-error-alarm-{alarm_name_suffix}",
    name=alarm_name,
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    threshold=self.config.alarm_error_rate_threshold * 100,  # 1.0%
    treat_missing_data="notBreaching",
    alarm_description=f"Lambda error rate > {self.config.alarm_error_rate_threshold * 100}%",
    metric_queries=[
        aws.cloudwatch.MetricAlarmMetricQueryArgs(
            id="errors",
            metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                metric_name="Errors",
                namespace="AWS/Lambda",
                period=300,
                stat="Sum",
                dimensions={"FunctionName": function_name}
            ),
            return_data=False
        ),
        aws.cloudwatch.MetricAlarmMetricQueryArgs(
            id="invocations",
            metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                metric_name="Invocations",
                namespace="AWS/Lambda",
                period=300,
                stat="Sum",
                dimensions={"FunctionName": function_name}
            ),
            return_data=False
        ),
        aws.cloudwatch.MetricAlarmMetricQueryArgs(
            id="error_rate",
            expression="(errors / invocations) * 100",  # Percentage calculation
            label="Error Rate (%)",
            return_data=True
        )
    ],
    tags=self.config.get_common_tags(),
    opts=opts
)
```

**Impact**: HIGH - Proper monitoring that scales with traffic volume.

---

## 6. IAM / Least-Privilege Violations and Unscoped Resource ARNs

### Problem

Policies rely on wildcard patterns (e.g., `*-serverless-bucket/*`, `arn:aws:dynamodb:*:*:table/*-serverless-table`). Roles are not tightly scoped to environment-specific resource ARNs.

### Model Response (Incorrect)

```python
# Wildcard ARNs - NOT least privilege
s3_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": ["s3:GetObject", "s3:PutObject"],
        "Resource": "arn:aws:s3:::*-serverless-bucket/*"  # WRONG - wildcard
    }]
}

dynamodb_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": ["dynamodb:PutItem", "dynamodb:Query"],
        "Resource": "arn:aws:dynamodb:*:*:table/*-serverless-table"  # WRONG - wildcard
    }]
}
```

### Our Solution (Correct)

```python
# Scoped ARNs with Output.all() for proper resolution
def create_lambda_role(
    self,
    name: str,
    s3_bucket_arns: List[Output[str]],
    dynamodb_table_arns: List[Output[str]],
    sqs_queue_arns: List[Output[str]],
    kms_key_arn: Output[str]
) -> aws.iam.Role:
    # ... role creation ...

    # Attach scoped policies using Output.all
    Output.all(
        s3_arns=s3_bucket_arns,
        dynamodb_arns=dynamodb_table_arns,
        sqs_arns=sqs_queue_arns,
        kms_arn=kms_key_arn
    ).apply(lambda args: self._attach_lambda_policies(
        role, role_name, args['s3_arns'], args['dynamodb_arns'],
        args['sqs_arns'], args['kms_arn'], opts
    ))

def _attach_lambda_policies(
    self,
    role: aws.iam.Role,
    role_name: str,
    s3_arns: List[str],
    dynamodb_arns: List[str],
    sqs_arns: List[str],
    kms_arn: str,
    opts: Optional[ResourceOptions]
) -> None:
    # S3 policy with specific bucket ARNs
    if s3_arns:
        s3_resources = s3_arns + [f"{arn}/*" for arn in s3_arns]
        s3_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
                "Resource": s3_resources  # Specific ARNs only
            }]
        }
        aws.iam.RolePolicy(f"{role_name}-s3-access", role=role.name,
                          policy=pulumi.Output.json_dumps(s3_policy), opts=opts)

    # DynamoDB policy with specific table ARNs including indexes
    if dynamodb_arns:
        dynamodb_resources = dynamodb_arns + [f"{arn}/index/*" for arn in dynamodb_arns]
        dynamodb_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem",
                          "dynamodb:Query", "dynamodb:Scan", "dynamodb:BatchWriteItem"],
                "Resource": dynamodb_resources  # Specific ARNs only
            }]
        }
        aws.iam.RolePolicy(f"{role_name}-dynamodb-access", role=role.name,
                          policy=pulumi.Output.json_dumps(dynamodb_policy), opts=opts)
```

**Impact**: CRITICAL - Security best practice, prevents unauthorized access.

---

## 7. API Gateway Throttling / Usage-Plan Values Don't Match Prompt

### Problem

The prompt required throttling **1000 RPS** with burst **2000**; model uses much larger defaults (rate_limit 10000, burst_limit 5000).

### Model Response (Incorrect)

```python
# Wrong throttling values
aws.apigateway.MethodSettings(
    "api-method-settings",
    rest_api=api.id,
    stage_name=stage.stage_name,
    method_path="*/*",
    settings=aws.apigateway.MethodSettingsSettingsArgs(
        throttling_burst_limit=5000,  # WRONG - should be 2000
        throttling_rate_limit=10000,  # WRONG - should be 1000
        logging_level="INFO",
        metrics_enabled=True
    )
)
```

### Our Solution (Correct)

```python
# Config with correct throttling values
self.api_throttle_rate_limit = int(os.getenv('API_THROTTLE_RATE_LIMIT', '1000'))
self.api_throttle_burst_limit = int(os.getenv('API_THROTTLE_BURST_LIMIT', '2000'))

# Method settings with correct throttling
aws.apigateway.MethodSettings(
    "api-method-settings",
    rest_api=self.api.id,
    stage_name=self.stage.stage_name,
    method_path="*/*",
    settings=aws.apigateway.MethodSettingsSettingsArgs(
        throttling_burst_limit=self.config.api_throttle_burst_limit,  # 2000
        throttling_rate_limit=self.config.api_throttle_rate_limit,  # 1000
        logging_level="INFO",
        data_trace_enabled=True,
        metrics_enabled=True
    ),
    opts=opts
)
```

**Impact**: HIGH - Correct rate limiting prevents API abuse and cost overruns.

---

## 8. Integration & Permission Wiring is Brittle/Incorrect

### Problem

Lambda invoke permissions and API Gateway invocation `source_arn` are constructed via fragile string concatenation (e.g., `api.execution_arn + "/*/*"`).

### Model Response (Incorrect)

```python
# Brittle string concatenation
aws.lambda_.Permission(
    "lambda-permission",
    action="lambda:InvokeFunction",
    function=lambda_function.name,
    principal="apigateway.amazonaws.com",
    source_arn=api.execution_arn + "/*/*"  # WRONG - fragile concatenation
)
```

### Our Solution (Correct)

```python
# Proper Output.concat() for ARN construction
aws.lambda_.Permission(
    "upload-lambda-permission",
    action="lambda:InvokeFunction",
    function=lambda_function.name,
    principal="apigateway.amazonaws.com",
    source_arn=Output.concat(
        self.api.execution_arn,
        "/*/POST/upload"  # Specific method and path
    ),
    opts=opts
)

# Similar for other endpoints
aws.lambda_.Permission(
    "status-lambda-permission",
    action="lambda:InvokeFunction",
    function=lambda_function.name,
    principal="apigateway.amazonaws.com",
    source_arn=Output.concat(
        self.api.execution_arn,
        "/*/GET/status/*"
    ),
    opts=opts
)
```

**Impact**: CRITICAL - Prevents runtime failures and ensures reliable API Gateway → Lambda integration.

---

## 9. Step Functions Uses Raw Lambda ARNs (Not Service Integration Patterns)

### Problem

The state machine uses Lambda ARNs directly as `Resource` values rather than `arn:aws:states:::lambda:invoke` patterns with proper Parameters.

### Model Response (Incorrect)

```python
# Raw Lambda ARN - missing service integration pattern
definition = {
    "Comment": "Data processing workflow",
    "StartAt": "ProcessData",
    "States": {
        "ProcessData": {
            "Type": "Task",
            "Resource": lambda_arn,  # WRONG - raw ARN
            "End": True
        }
    }
}
```

### Our Solution (Correct)

```python
# Proper service integration pattern with Parameters
definition = Output.all(
    lambda_arn=processing_lambda_arn
).apply(lambda args: json.dumps({
    "Comment": "Data processing workflow with proper service integration",
    "StartAt": "ProcessData",
    "States": {
        "ProcessData": {
            "Type": "Task",
            "Resource": "arn:aws:states:::lambda:invoke",  # Service integration
            "Parameters": {
                "FunctionName": args['lambda_arn'],
                "Payload.$": "$"
            },
            "Retry": [
                {
                    "ErrorEquals": [
                        "Lambda.ServiceException",
                        "Lambda.AWSLambdaException",
                        "Lambda.SdkClientException"
                    ],
                    "IntervalSeconds": 2,
                    "MaxAttempts": self.config.lambda_max_retries,
                    "BackoffRate": 2
                }
            ],
            "Catch": [
                {
                    "ErrorEquals": ["States.ALL"],
                    "Next": "HandleError"
                }
            ],
            "Next": "ProcessingComplete"
        },
        "HandleError": {
            "Type": "Task",
            "Resource": "arn:aws:states:::sqs:sendMessage",  # Service integration
            "Parameters": {
                "QueueUrl": dlq_arn,
                "MessageBody.$": "$"
            },
            "Next": "ProcessingFailed"
        },
        "ProcessingFailed": {
            "Type": "Fail",
            "Error": "ProcessingError",
            "Cause": "Data processing failed after retries"
        },
        "ProcessingComplete": {
            "Type": "Succeed"
        }
    }
}))
```

**Impact**: CRITICAL - Correct orchestration with proper error handling and retry logic.

---

## 10. Packaging / Deployment Reproducibility Missing

### Problem

Lambdas use local `FileArchive` folders with no CI/build/vendoring instructions, no artifact publishing strategy for multi-region/production.

### Model Response (Incorrect)

```python
# No structure, no proper handler organization
function = aws.lambda_.Function(
    "lambda",
    code=FileArchive("./lambda"),  # Unstructured directory
    handler="index.handler",  # Generic handler
    # Missing: proper code organization
    # Missing: dependency management
    # Missing: Decimal type usage for DynamoDB
)
```

### Our Solution (Correct)

```python
# Structured Lambda code directory
lambda_code_path = os.path.join(
    os.path.dirname(__file__),
    "lambda_code"  # Organized directory structure
)

# Processing handler with proper imports and Decimal usage
# File: lib/infrastructure/lambda_code/processing_handler.py
import json
import csv
import os
from decimal import Decimal  # CRITICAL for DynamoDB
from datetime import datetime
import boto3

def lambda_handler(event, context):
    # Process CSV with Decimal types
    for row in csv_reader:
        item = {
            'symbol': row.get('symbol', ''),
            'timestamp': Decimal(str(row.get('timestamp', 0))),  # Decimal, not float
            'price': Decimal(str(row.get('price', 0))),  # Decimal, not float
            'volume': Decimal(str(row.get('volume', 0))),  # Decimal, not float
            'source_file': key,
            'processed_at': Decimal(str(datetime.utcnow().timestamp()))
        }
        items.append(item)

# API handlers with proper error handling
# File: lib/infrastructure/lambda_code/api_handler.py
def upload_handler(event, context):
    # Structured handler with comprehensive error handling
    try:
        # Process upload
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'message': 'Success'})
        }
    except Exception as e:
        error_details = {
            'error': str(e),
            'error_type': type(e).__name__
        }
        print(f"ERROR: {json.dumps(error_details)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(error_details)
        }

# Lambda function with proper configuration
function = aws.lambda_.Function(
    "processing-lambda",
    name=function_name,
    runtime=self.config.lambda_runtime,
    handler="processing_handler.lambda_handler",  # Specific handler
    role=role.arn,
    code=FileArchive(lambda_code_path),
    timeout=self.config.lambda_timeout,
    memory_size=self.config.lambda_memory_size,
    reserved_concurrent_executions=self.config.processing_lambda_concurrency,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "DYNAMODB_TABLE_NAME": self.dynamodb_table_name,
            "S3_BUCKET_NAME": self.s3_bucket_name,
            "ENVIRONMENT": self.config.environment,
            "ENVIRONMENT_SUFFIX": self.config.environment_suffix
        }
    ),
    tags=self.config.get_common_tags(),
    opts=opts
)
```

**Impact**: HIGH - Reliable deployments with proper data type handling prevents DynamoDB errors.

---

## Summary of Architectural Improvements

### Qualitative Improvements

- **Modularity**: 10 separate modules vs monolithic code
- **Security**: Scoped IAM policies, KMS encryption, least privilege
- **Observability**: Percentage-based alarms, X-Ray tracing, comprehensive logging
- **Reliability**: Proper DLQs, retry logic, error handling
- **Maintainability**: Centralized config, consistent naming, comprehensive documentation
- **Testability**: 90%+ unit test coverage achievable
- **Region Agnostic**: Easy multi-region deployment
- **Provider Stability**: Singleton pattern prevents drift
- **Data Integrity**: Decimal types for DynamoDB, correct schema
- **Cost Optimization**: 7-day log retention, lifecycle policies
