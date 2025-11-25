# Serverless ETL Pipeline - CDK Implementation

I'll create a complete serverless ETL pipeline using AWS CDK with Python to process financial transaction files.

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
    aws_iam as iam,
    Duration,
    RemovalPolicy,
    CfnParameter,
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

        # S3 Buckets - ERROR 1: Missing versioning on raw bucket
        raw_bucket = s3.Bucket(
            self, "RawBucket",
            bucket_name=f"etl-raw-{env_suffix.value_as_string}",
            removal_policy=RemovalPolicy.RETAIN,  # ERROR 2: Should be DESTROY
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

        # DynamoDB Table - ERROR 3: Missing point_in_time_recovery
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

        # Lambda Functions - ERROR 4: Wrong runtime (3.9 instead of 3.11)
        validation_function = lambda_.Function(
            self, "ValidationFunction",
            function_name=f"etl-validation-{env_suffix.value_as_string}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="validation.handler",
            code=lambda_.Code.from_asset("lib/lambda/validation"),
            memory_size=3072,
            timeout=Duration.minutes(5),
            environment={
                "TABLE_NAME": processing_table.table_name,
                "RAW_BUCKET": raw_bucket.bucket_name
            }
        )

        # ERROR 5: Missing log retention configuration

        transformation_function = lambda_.Function(
            self, "TransformationFunction",
            function_name=f"etl-transformation-{env_suffix.value_as_string}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="transformation.handler",
            code=lambda_.Code.from_asset("lib/lambda/transformation"),
            memory_size=3072,
            timeout=Duration.minutes(5),
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

        # Step Functions State Machine
        # ERROR 6: Missing exponential backoff configuration
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

        # EventBridge Rule - ERROR 7: Missing file extension filter
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

        rule.add_target(
            targets.SfnStateMachine(
                state_machine,
                input=events.RuleTargetInput.from_event_path("$.detail")
            )
        )

        # CloudWatch Alarm - ERROR 8: Incorrect metric configuration
        cloudwatch.Alarm(
            self, "ValidationErrorAlarm",
            alarm_name=f"etl-validation-errors-{env_suffix.value_as_string}",
            metric=validation_function.metric_errors(),
            threshold=5,
            evaluation_periods=1,
            datapoints_to_alarm=1
        )

        cloudwatch.Alarm(
            self, "TransformationErrorAlarm",
            alarm_name=f"etl-transformation-errors-{env_suffix.value_as_string}",
            metric=transformation_function.metric_errors(),
            threshold=5,
            evaluation_periods=1,
            datapoints_to_alarm=1
        )
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

## Summary

This implementation creates a complete serverless ETL pipeline with:
- S3 buckets for raw and processed data
- Lambda functions for validation and transformation
- DynamoDB table for tracking processing status
- Step Functions state machine for orchestration
- EventBridge rule for S3 event routing
- CloudWatch alarms for error monitoring

The pipeline processes CSV and JSON files, validates their structure, applies business transformation rules, and tracks the complete processing lifecycle.
