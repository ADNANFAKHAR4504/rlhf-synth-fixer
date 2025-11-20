# Serverless ETL Pipeline - CDK Implementation (Corrected)

Complete serverless ETL pipeline using AWS CDK with Python, with all errors corrected.

## File: lib/tap_stack.py

```python
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
    aws_events as events,
    aws_events_targets as targets,
    aws_cloudwatch as cloudwatch,
    aws_logs as logs,
    Duration,
    RemovalPolicy,
    CfnParameter,
    Tags,
)
from constructs import Construct

class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Environment suffix parameter
        env_suffix = CfnParameter(
            self, "EnvironmentSuffix",
            type="String",
            description="Environment suffix for resource naming"
        )

        # S3 Buckets - FIXED: Added versioning to raw bucket
        raw_bucket = s3.Bucket(
            self, "RawBucket",
            bucket_name=f"etl-raw-{env_suffix.value_as_string}",
            versioned=True,  # FIXED: Added versioning
            removal_policy=RemovalPolicy.DESTROY,  # FIXED: Changed from RETAIN
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ]
        )

        processed_bucket = s3.Bucket(
            self, "ProcessedBucket",
            bucket_name=f"etl-processed-{env_suffix.value_as_string}",
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ]
        )

        # DynamoDB Table - FIXED: Added point_in_time_recovery
        processing_table = dynamodb.Table(
            self, "ProcessingTable",
            table_name=f"etl-processing-status-{env_suffix.value_as_string}",
            partition_key=dynamodb.Attribute(
                name="file_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.ON_DEMAND,
            point_in_time_recovery=True,  # FIXED: Added PITR
            removal_policy=RemovalPolicy.DESTROY
        )

        # Lambda Functions - FIXED: Using Python 3.11 for both, added log retention
        validation_function = lambda_.Function(
            self, "ValidationFunction",
            function_name=f"etl-validation-{env_suffix.value_as_string}",
            runtime=lambda_.Runtime.PYTHON_3_11,  # FIXED: Changed from 3.9
            handler="validation.handler",
            code=lambda_.Code.from_asset("lib/lambda/validation"),
            memory_size=3072,
            timeout=Duration.minutes(5),
            log_retention=logs.RetentionDays.ONE_MONTH,  # FIXED: Added log retention
            environment={
                "TABLE_NAME": processing_table.table_name,
                "RAW_BUCKET": raw_bucket.bucket_name
            }
        )

        transformation_function = lambda_.Function(
            self, "TransformationFunction",
            function_name=f"etl-transformation-{env_suffix.value_as_string}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="transformation.handler",
            code=lambda_.Code.from_asset("lib/lambda/transformation"),
            memory_size=3072,
            timeout=Duration.minutes(5),
            log_retention=logs.RetentionDays.ONE_MONTH,  # FIXED: Added log retention
            environment={
                "TABLE_NAME": processing_table.table_name,
                "RAW_BUCKET": raw_bucket.bucket_name,
                "PROCESSED_BUCKET": processed_bucket.bucket_name
            }
        )

        # Grant permissions
        processing_table.grant_read_write_data(validation_function)
        processing_table.grant_read_write_data(transformation_function)
        raw_bucket.grant_read(validation_function)
        raw_bucket.grant_read(transformation_function)
        processed_bucket.grant_write(transformation_function)

        # Step Functions State Machine - FIXED: Added exponential backoff retry
        validation_task = tasks.LambdaInvoke(
            self, "ValidateFile",
            lambda_function=validation_function,
            output_path="$.Payload",
            retry_on_service_exceptions=True,
            # FIXED: Added exponential backoff retry configuration
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
            # FIXED: Added exponential backoff retry configuration
            max_attempts=3,
            backoff_rate=2.0,
            interval=Duration.seconds(2),
            errors=["States.TaskFailed", "States.Timeout"]
        )

        fail_state = sfn.Fail(
            self, "ProcessingFailed",
            cause="File processing failed",
            error="ValidationError"
        )

        success_state = sfn.Succeed(
            self, "ProcessingSucceeded"
        )

        definition = validation_task.add_catch(
            fail_state,
            errors=["States.ALL"],
            result_path="$.error"
        ).next(transformation_task).add_catch(
            fail_state,
            errors=["States.ALL"],
            result_path="$.error"
        ).next(success_state)

        state_machine = sfn.StateMachine(
            self, "ETLStateMachine",
            state_machine_name=f"etl-pipeline-{env_suffix.value_as_string}",
            definition=definition,
            timeout=Duration.minutes(15)
        )

        # S3 Event Notification to EventBridge
        raw_bucket.enable_event_bridge_notification()

        # EventBridge Rule - FIXED: Added file extension filter for .csv and .json
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
                    # FIXED: Added file extension filter
                    "object": {
                        "key": [
                            {"suffix": ".csv"},
                            {"suffix": ".json"}
                        ]
                    }
                }
            )
        )

        rule.add_target(
            targets.SfnStateMachine(
                state_machine,
                input=events.RuleTargetInput.from_event_path("$.detail")
            )
        )

        # CloudWatch Alarms - FIXED: Changed to percentage-based error rate (5%)
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
            metric=validation_error_rate,
            threshold=5,  # 5% error rate
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        transformation_error_rate = cloudwatch.MathExpression(
            expression="(errors / invocations) * 100",
            using_metrics={
                "errors": transformation_function.metric_errors(
                    statistic="Sum",
                    period=Duration.minutes(5)
                ),
                "invocations": transformation_function.metric_invocations(
                    statistic="Sum",
                    period=Duration.minutes(5)
                )
            }
        )

        cloudwatch.Alarm(
            self, "TransformationErrorAlarm",
            alarm_name=f"etl-transformation-errors-{env_suffix.value_as_string}",
            metric=transformation_error_rate,
            threshold=5,  # 5% error rate
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        # Add tags to all resources
        Tags.of(self).add("Environment", "Production")
        Tags.of(self).add("Project", "ETL-Pipeline")
```

## File: lib/lambda/validation/validation.py

```python
import json
import boto3
import os
from datetime import datetime

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    """Validate incoming transaction files"""

    # Extract file information
    bucket = event['bucket']['name']
    key = event['object']['key']
    file_id = key.split('/')[-1]

    table_name = os.environ['TABLE_NAME']
    table = dynamodb.Table(table_name)

    # Update status to processing
    table.put_item(
        Item={
            'file_id': file_id,
            'status': 'VALIDATING',
            'timestamp': datetime.utcnow().isoformat(),
            'bucket': bucket,
            'key': key
        }
    )

    try:
        # Download file
        response = s3_client.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read().decode('utf-8')

        # Basic validation
        if key.endswith('.csv'):
            validate_csv(content)
        elif key.endswith('.json'):
            validate_json(content)
        else:
            raise ValueError(f"Unsupported file format: {key}")

        # Update status
        table.update_item(
            Key={'file_id': file_id},
            UpdateExpression='SET #status = :status, validated_at = :timestamp',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'VALIDATED',
                ':timestamp': datetime.utcnow().isoformat()
            }
        )

        return {
            'statusCode': 200,
            'file_id': file_id,
            'bucket': bucket,
            'key': key,
            'validation': 'passed'
        }

    except Exception as e:
        table.update_item(
            Key={'file_id': file_id},
            UpdateExpression='SET #status = :status, error = :error',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'VALIDATION_FAILED',
                ':error': str(e)
            }
        )
        raise

def validate_csv(content):
    """Validate CSV format"""
    lines = content.split('\n')
    if len(lines) < 2:
        raise ValueError("CSV file must have header and at least one data row")

    header = lines[0].split(',')
    required_fields = ['transaction_id', 'amount', 'date', 'account_id']

    for field in required_fields:
        if field not in header:
            raise ValueError(f"Missing required field: {field}")

def validate_json(content):
    """Validate JSON format"""
    data = json.loads(content)

    if not isinstance(data, list):
        raise ValueError("JSON file must contain an array of transactions")

    if len(data) == 0:
        raise ValueError("JSON file must contain at least one transaction")

    required_fields = ['transaction_id', 'amount', 'date', 'account_id']
    for transaction in data:
        for field in required_fields:
            if field not in transaction:
                raise ValueError(f"Transaction missing required field: {field}")
```

## File: lib/lambda/transformation/transformation.py

```python
import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    """Transform validated transaction files"""

    # Extract file information from validation output
    file_id = event['file_id']
    bucket = event['bucket']
    key = event['key']

    table_name = os.environ['TABLE_NAME']
    processed_bucket = os.environ['PROCESSED_BUCKET']
    table = dynamodb.Table(table_name)

    # Update status
    table.update_item(
        Key={'file_id': file_id},
        UpdateExpression='SET #status = :status',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={':status': 'TRANSFORMING'}
    )

    try:
        # Download file
        response = s3_client.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read().decode('utf-8')

        # Transform based on format
        if key.endswith('.csv'):
            transformed = transform_csv(content)
        elif key.endswith('.json'):
            transformed = transform_json(content)

        # Upload to processed bucket
        output_key = f"processed/{file_id}.json"
        s3_client.put_object(
            Bucket=processed_bucket,
            Key=output_key,
            Body=json.dumps(transformed, indent=2),
            ContentType='application/json'
        )

        # Update status
        table.update_item(
            Key={'file_id': file_id},
            UpdateExpression='SET #status = :status, processed_at = :timestamp, output_key = :output',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'COMPLETED',
                ':timestamp': datetime.utcnow().isoformat(),
                ':output': output_key
            }
        )

        return {
            'statusCode': 200,
            'file_id': file_id,
            'output_bucket': processed_bucket,
            'output_key': output_key,
            'transformation': 'completed'
        }

    except Exception as e:
        table.update_item(
            Key={'file_id': file_id},
            UpdateExpression='SET #status = :status, error = :error',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'TRANSFORMATION_FAILED',
                ':error': str(e)
            }
        )
        raise

def transform_csv(content):
    """Transform CSV to JSON and apply business rules"""
    lines = content.strip().split('\n')
    header = lines[0].split(',')

    transactions = []
    for line in lines[1:]:
        if not line.strip():
            continue
        values = line.split(',')
        transaction = dict(zip(header, values))

        # Apply business rules
        transaction['amount'] = float(transaction['amount'])
        transaction['processed_timestamp'] = datetime.utcnow().isoformat()
        transaction['currency'] = 'USD'

        # Calculate fee (1% of transaction)
        transaction['fee'] = round(transaction['amount'] * 0.01, 2)

        transactions.append(transaction)

    return transactions

def transform_json(content):
    """Transform JSON and apply business rules"""
    data = json.loads(content)

    for transaction in data:
        # Apply business rules
        transaction['amount'] = float(transaction['amount'])
        transaction['processed_timestamp'] = datetime.utcnow().isoformat()
        transaction['currency'] = 'USD'

        # Calculate fee (1% of transaction)
        transaction['fee'] = round(transaction['amount'] * 0.01, 2)

    return data
```

## File: lib/lambda/validation/requirements.txt

```txt
boto3>=1.26.0
```

## File: lib/lambda/transformation/requirements.txt

```txt
boto3>=1.26.0
```

## File: lib/README.md

```markdown
# Serverless ETL Pipeline for Financial Transaction Processing

Production-ready serverless ETL pipeline using AWS CDK with Python for processing financial transaction files.

## Architecture

- **S3 Buckets**: Raw file uploads and processed data storage with versioning and lifecycle policies
- **Lambda Functions**: Validation and transformation functions with Python 3.11 runtime
- **DynamoDB**: Processing status tracking with on-demand billing and point-in-time recovery
- **Step Functions**: Workflow orchestration with exponential backoff retry logic
- **EventBridge**: Event routing from S3 to Step Functions with file extension filtering
- **CloudWatch**: Logs with 30-day retention and alarms for 5% error rate threshold

## Prerequisites

- AWS CDK 2.x
- Python 3.8+
- AWS CLI configured with appropriate permissions

## Deployment

```bash
# Install dependencies
pip install -r requirements.txt

# Deploy with environment suffix
cdk deploy --parameters EnvironmentSuffix=dev

# Destroy stack
cdk destroy
```

## Testing

Upload a CSV or JSON file to the raw bucket to trigger the pipeline:

```bash
aws s3 cp test-transactions.csv s3://etl-raw-dev/test-transactions.csv
```

Monitor processing status in DynamoDB table `etl-processing-status-dev`.

## AWS Services Used

- S3
- Lambda
- DynamoDB
- Step Functions
- EventBridge
- CloudWatch Logs
- CloudWatch Alarms
- IAM

## Key Features

- Event-driven architecture with S3 event notifications
- Exponential backoff retry (3 attempts, 2x backoff rate)
- CloudWatch monitoring with 5% error rate alarms
- 30-day log retention for compliance
- Versioning enabled on all S3 buckets
- Point-in-time recovery for DynamoDB
- Complete audit trail of file processing
```

## Summary

All errors have been corrected:

1. **FIXED**: Added versioning to raw S3 bucket
2. **FIXED**: Changed RemovalPolicy from RETAIN to DESTROY on raw bucket
3. **FIXED**: Added point_in_time_recovery to DynamoDB table
4. **FIXED**: Changed validation Lambda runtime from Python 3.9 to 3.11
5. **FIXED**: Added log retention (30 days) to both Lambda functions
6. **FIXED**: Added exponential backoff retry configuration to Step Functions tasks
7. **FIXED**: Added file extension filter (.csv, .json) to EventBridge rule
8. **FIXED**: Changed CloudWatch alarms to percentage-based error rate (5%)

Additional improvements:
- Added auto_delete_objects to S3 buckets for complete destroyability
- Added enable_event_bridge_notification() to raw bucket
- Added resource tags (Environment=Production, Project=ETL-Pipeline)
- Improved alarm configuration with proper evaluation periods and missing data handling
