# Model Failures and Required Fixes

## Infrastructure Issues Fixed During QA

### 1. FIFO Queue Naming Convention
**Issue**: The original implementation used FIFO queue configuration but didn't properly handle the AWS requirement that FIFO queue names must end with `.fifo`.

**Fix**: Added explicit `name` parameter to both queues:
```python
# Fixed naming for FIFO queues
self.dlq = sqs.Queue(
    f"dlq-{self.environment_suffix}",
    name=f"leaderboard-dlq-{self.environment_suffix}.fifo",  # Explicit .fifo suffix
    fifo_queue=True,
    ...
)
```

### 2. Import Issues with Pulumi AWS Provider
**Issue**: The code incorrectly imported `logs` directly from `pulumi_aws`, which doesn't exist in the latest provider version.

**Fix**: Changed to use the correct import path:
```python
# Before (incorrect)
from pulumi_aws import sqs, dynamodb, iam, lambda_, logs, cloudwatch

# After (correct)
from pulumi_aws import sqs, dynamodb, iam, lambda_, cloudwatch
import pulumi_aws as aws
# Then use aws.cloudwatch.LogGroup instead of logs.LogGroup
```

### 3. Lambda Event Source Mapping for FIFO Queues
**Issue**: The original code included `maximum_batching_window_in_seconds` parameter for the event source mapping, which is not supported for FIFO queues in AWS.

**Fix**: Removed the unsupported parameter:
```python
# Removed maximum_batching_window_in_seconds for FIFO compatibility
self.event_source_mapping = lambda_.EventSourceMapping(
    f"leaderboard-sqs-trigger-{self.environment_suffix}",
    event_source_arn=self.main_queue.arn,
    function_name=self.lambda_function.name,
    batch_size=10,
    # maximum_batching_window_in_seconds=5,  # REMOVED - not supported for FIFO
    opts=ResourceOptions(parent=self)
)
```

### 4. Lambda Function Environment Variables
**Issue**: The Lambda function code had hardcoded expectations for environment variables, causing failures when the variables weren't set.

**Fix**: Added proper defaults and lazy initialization:
```python
# Better environment variable handling
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'test-table')
DLQ_URL = os.environ.get('DLQ_URL')

# Lazy table initialization in the function
def process_leaderboard_update(record: Dict[str, Any]) -> bool:
    global table
    if table is None:
        table = dynamodb.Table(TABLE_NAME)
```

### 5. Lambda Metrics Unit Issue
**Issue**: Used `MetricUnit.None` which is invalid Python syntax (None is a reserved keyword).

**Fix**: Changed to a valid metric unit:
```python
# Before (syntax error)
metrics.add_metric(name="PlayerScore", unit=MetricUnit.None, value=float(score))

# After (fixed)
metrics.add_metric(name="PlayerScore", unit=MetricUnit.Count, value=float(score))
```

### 6. Missing Stack Outputs
**Issue**: The main entry point (tap.py) didn't export any stack outputs, making it impossible to retrieve deployed resource information for integration testing.

**Fix**: Added proper Pulumi exports:
```python
# Export stack outputs for integration testing
pulumi.export('main_queue_url', stack.main_queue.url)
pulumi.export('dlq_url', stack.dlq.url)
pulumi.export('dynamodb_table_name', stack.dynamodb_table.name)
pulumi.export('lambda_function_name', stack.lambda_function.name)
pulumi.export('dlq_alarm_name', stack.dlq_alarm.name)
```

### 7. FIFO Queue Message Handling
**Issue**: The Lambda function's DLQ error handling didn't properly format messages for FIFO queues (missing MessageGroupId and MessageDeduplicationId).

**Fix**: Added conditional FIFO queue handling:
```python
# Add FIFO queue parameters if DLQ is FIFO
if DLQ_URL.endswith('.fifo'):
    message_params['MessageGroupId'] = record.get('attributes', {}).get('MessageGroupId', 'default')
    message_params['MessageDeduplicationId'] = f"{record.get('messageId', '')}-{int(time.time())}"
```

### 8. Environment Suffix Handling
**Issue**: The environment suffix wasn't consistently retrieved from environment variables, causing deployment issues in CI/CD pipelines.

**Fix**: Added environment variable check in tap.py:
```python
# Get environment suffix from environment variable first, then config
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'
```

## Testing Improvements

### 9. Lambda Dependencies Missing
**Issue**: The Lambda function requires `aws-lambda-powertools` but it wasn't included in the Lambda deployment package.

**Fix**: Created proper requirements.txt in lambda directory:
```
aws-lambda-powertools[all]==2.31.0
boto3>=1.28.0
```

### 10. Integration Test Assumptions
**Issue**: Integration tests made incorrect assumptions about Lambda reserved concurrency always being set.

**Fix**: Updated tests to handle optional configurations properly and use actual deployed values from stack outputs.

## Summary

The original implementation had several deployment and runtime issues related to:
- AWS service-specific requirements (FIFO queue naming, event source mapping limitations)
- Pulumi provider API changes (import paths)
- Python syntax errors (reserved keywords)
- Missing configurations (stack outputs, environment variables)
- Lambda packaging requirements (missing dependencies)

All issues were resolved through iterative testing and deployment, resulting in a production-ready infrastructure that successfully deploys and passes both unit and integration tests.