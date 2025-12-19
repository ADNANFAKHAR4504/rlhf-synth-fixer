# Initial Model Response - Transaction Processing Pipeline

This document contains the initial infrastructure code generated for the transaction processing pipeline.

## File: __main__.py

```python
"""Transaction processing pipeline infrastructure"""
import pulumi
import pulumi_aws as aws
import json

# Get the environment suffix for unique naming
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or "dev"

# Tags for all resources
common_tags = {
    "Environment": "production",
    "Project": "transaction-processor"
}

# S3 Bucket for transaction uploads
transaction_bucket = aws.s3.Bucket(
    f"transaction-uploads-{environment_suffix}",
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True
    ),
    lifecycle_rules=[aws.s3.BucketLifecycleRuleArgs(
        enabled=True,
        expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
            days=90
        )
    )],
    tags=common_tags
)

# DynamoDB table for transactions
transactions_table = aws.dynamodb.Table(
    f"transactions-{environment_suffix}",
    attributes=[
        aws.dynamodb.TableAttributeArgs(
            name="transaction_id",
            type="S"
        ),
        aws.dynamodb.TableAttributeArgs(
            name="timestamp",
            type="N"
        )
    ],
    hash_key="transaction_id",
    range_key="timestamp",
    billing_mode="PAY_PER_REQUEST",
    stream_enabled=True,
    stream_view_type="NEW_AND_OLD_IMAGES",
    tags=common_tags
)

# SNS Topic for anomaly alerts
alerts_topic = aws.sns.Topic(
    f"transaction-alerts-{environment_suffix}",
    tags=common_tags
)

# IAM role for validation Lambda
validation_lambda_role = aws.iam.Role(
    f"validation-lambda-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            }
        }]
    }),
    tags=common_tags
)

# Policy for validation Lambda
validation_lambda_policy = aws.iam.RolePolicy(
    f"validation-lambda-policy-{environment_suffix}",
    role=validation_lambda_role.id,
    policy=pulumi.Output.all(transaction_bucket.arn, transactions_table.arn).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:GetObjectVersion"
                    ],
                    "Resource": f"{args[0]}/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem"
                    ],
                    "Resource": args[1]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "xray:PutTraceSegments",
                        "xray:PutTelemetryRecords"
                    ],
                    "Resource": "*"
                }
            ]
        })
    )
)

# CloudWatch Log Group for validation Lambda
validation_log_group = aws.cloudwatch.LogGroup(
    f"validation-lambda-logs-{environment_suffix}",
    name=f"/aws/lambda/validation-lambda-{environment_suffix}",
    retention_in_days=7,
    tags=common_tags
)

# Validation Lambda function
validation_lambda = aws.lambda_.Function(
    f"validation-lambda-{environment_suffix}",
    runtime="python3.9",
    handler="validation.handler",
    role=validation_lambda_role.arn,
    memory_size=512,
    reserved_concurrent_executions=10,
    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambda")
    }),
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "DYNAMODB_TABLE": transactions_table.name,
            "ENVIRONMENT": "production"
        }
    ),
    tracing_config=aws.lambda_.FunctionTracingConfigArgs(
        mode="Active"
    ),
    tags=common_tags,
    opts=pulumi.ResourceOptions(depends_on=[validation_log_group])
)

# Lambda permission for S3 to invoke validation Lambda
s3_lambda_permission = aws.lambda_.Permission(
    f"s3-invoke-validation-{environment_suffix}",
    action="lambda:InvokeFunction",
    function=validation_lambda.name,
    principal="s3.amazonaws.com",
    source_arn=transaction_bucket.arn
)

# S3 bucket notification to trigger validation Lambda
bucket_notification = aws.s3.BucketNotification(
    f"transaction-bucket-notification-{environment_suffix}",
    bucket=transaction_bucket.id,
    lambda_functions=[aws.s3.BucketNotificationLambdaFunctionArgs(
        lambda_function_arn=validation_lambda.arn,
        events=["s3:ObjectCreated:*"],
        filter_prefix="uploads/",
        filter_suffix=".csv"
    )],
    opts=pulumi.ResourceOptions(depends_on=[s3_lambda_permission])
)

# IAM role for anomaly detection Lambda
anomaly_lambda_role = aws.iam.Role(
    f"anomaly-lambda-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            }
        }]
    }),
    tags=common_tags
)

# Policy for anomaly detection Lambda
anomaly_lambda_policy = aws.iam.RolePolicy(
    f"anomaly-lambda-policy-{environment_suffix}",
    role=anomaly_lambda_role.id,
    policy=pulumi.Output.all(transactions_table.stream_arn, alerts_topic.arn).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetRecords",
                        "dynamodb:GetShardIterator",
                        "dynamodb:DescribeStream",
                        "dynamodb:ListStreams"
                    ],
                    "Resource": args[0]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": args[1]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "xray:PutTraceSegments",
                        "xray:PutTelemetryRecords"
                    ],
                    "Resource": "*"
                }
            ]
        })
    )
)

# CloudWatch Log Group for anomaly Lambda
anomaly_log_group = aws.cloudwatch.LogGroup(
    f"anomaly-lambda-logs-{environment_suffix}",
    name=f"/aws/lambda/anomaly-lambda-{environment_suffix}",
    retention_in_days=7,
    tags=common_tags
)

# Anomaly detection Lambda function
anomaly_lambda = aws.lambda_.Function(
    f"anomaly-lambda-{environment_suffix}",
    runtime="python3.9",
    handler="anomaly_detection.handler",
    role=anomaly_lambda_role.arn,
    memory_size=512,
    reserved_concurrent_executions=10,
    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambda")
    }),
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "SNS_TOPIC_ARN": alerts_topic.arn,
            "ENVIRONMENT": "production"
        }
    ),
    tracing_config=aws.lambda_.FunctionTracingConfigArgs(
        mode="Active"
    ),
    tags=common_tags,
    opts=pulumi.ResourceOptions(depends_on=[anomaly_log_group])
)

# Event source mapping for DynamoDB stream
stream_mapping = aws.lambda_.EventSourceMapping(
    f"dynamodb-stream-mapping-{environment_suffix}",
    event_source_arn=transactions_table.stream_arn,
    function_name=anomaly_lambda.name,
    starting_position="LATEST",
    batch_size=100
)

# IAM role for API Lambda
api_lambda_role = aws.iam.Role(
    f"api-lambda-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            }
        }]
    }),
    tags=common_tags
)

# Policy for API Lambda
api_lambda_policy = aws.iam.RolePolicy(
    f"api-lambda-policy-{environment_suffix}",
    role=api_lambda_role.id,
    policy=pulumi.Output.all(transaction_bucket.arn, transactions_table.arn).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetObject"
                    ],
                    "Resource": f"{args[0]}/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:Query"
                    ],
                    "Resource": args[1]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "xray:PutTraceSegments",
                        "xray:PutTelemetryRecords"
                    ],
                    "Resource": "*"
                }
            ]
        })
    )
)

# CloudWatch Log Group for API Lambda
api_log_group = aws.cloudwatch.LogGroup(
    f"api-lambda-logs-{environment_suffix}",
    name=f"/aws/lambda/api-lambda-{environment_suffix}",
    retention_in_days=7,
    tags=common_tags
)

# API Lambda function
api_lambda = aws.lambda_.Function(
    f"api-lambda-{environment_suffix}",
    runtime="python3.9",
    handler="api_handler.handler",
    role=api_lambda_role.arn,
    memory_size=512,
    reserved_concurrent_executions=10,
    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambda")
    }),
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "S3_BUCKET": transaction_bucket.id,
            "DYNAMODB_TABLE": transactions_table.name,
            "ENVIRONMENT": "production"
        }
    ),
    tracing_config=aws.lambda_.FunctionTracingConfigArgs(
        mode="Active"
    ),
    tags=common_tags,
    opts=pulumi.ResourceOptions(depends_on=[api_log_group])
)

# API Gateway REST API
api = aws.apigateway.RestApi(
    f"transaction-api-{environment_suffix}",
    description="Transaction processing API",
    tags=common_tags
)

# API Gateway resource for /upload
upload_resource = aws.apigateway.Resource(
    f"upload-resource-{environment_suffix}",
    rest_api=api.id,
    parent_id=api.root_resource_id,
    path_part="upload"
)

# POST method for /upload
upload_method = aws.apigateway.Method(
    f"upload-method-{environment_suffix}",
    rest_api=api.id,
    resource_id=upload_resource.id,
    http_method="POST",
    authorization="NONE",
    api_key_required=True
)

# Integration for /upload
upload_integration = aws.apigateway.Integration(
    f"upload-integration-{environment_suffix}",
    rest_api=api.id,
    resource_id=upload_resource.id,
    http_method=upload_method.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=api_lambda.invoke_arn
)

# API Gateway resource for /status
status_resource = aws.apigateway.Resource(
    f"status-resource-{environment_suffix}",
    rest_api=api.id,
    parent_id=api.root_resource_id,
    path_part="status"
)

# API Gateway resource for /status/{transaction_id}
status_id_resource = aws.apigateway.Resource(
    f"status-id-resource-{environment_suffix}",
    rest_api=api.id,
    parent_id=status_resource.id,
    path_part="{transaction_id}"
)

# GET method for /status/{transaction_id}
status_method = aws.apigateway.Method(
    f"status-method-{environment_suffix}",
    rest_api=api.id,
    resource_id=status_id_resource.id,
    http_method="GET",
    authorization="NONE",
    api_key_required=True
)

# Integration for /status/{transaction_id}
status_integration = aws.apigateway.Integration(
    f"status-integration-{environment_suffix}",
    rest_api=api.id,
    resource_id=status_id_resource.id,
    http_method=status_method.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=api_lambda.invoke_arn
)

# API Gateway deployment
deployment = aws.apigateway.Deployment(
    f"api-deployment-{environment_suffix}",
    rest_api=api.id,
    opts=pulumi.ResourceOptions(depends_on=[upload_integration, status_integration])
)

# API Gateway stage
stage = aws.apigateway.Stage(
    f"api-stage-{environment_suffix}",
    rest_api=api.id,
    deployment=deployment.id,
    stage_name="prod",
    xray_tracing_enabled=True,
    tags=common_tags
)

# API key
api_key = aws.apigateway.ApiKey(
    f"api-key-{environment_suffix}",
    enabled=True,
    tags=common_tags
)

# Usage plan
usage_plan = aws.apigateway.UsagePlan(
    f"usage-plan-{environment_suffix}",
    api_stages=[aws.apigateway.UsagePlanApiStageArgs(
        api_id=api.id,
        stage=stage.stage_name
    )],
    quota_settings=aws.apigateway.UsagePlanQuotaSettingsArgs(
        limit=10000,
        period="MONTH"
    ),
    throttle_settings=aws.apigateway.UsagePlanThrottleSettingsArgs(
        burst_limit=500,
        rate_limit=1000
    ),
    tags=common_tags
)

# Associate API key with usage plan
usage_plan_key = aws.apigateway.UsagePlanKey(
    f"usage-plan-key-{environment_suffix}",
    key_id=api_key.id,
    key_type="API_KEY",
    usage_plan_id=usage_plan.id
)

# Lambda permission for API Gateway to invoke API Lambda
api_lambda_permission = aws.lambda_.Permission(
    f"apigateway-invoke-api-lambda-{environment_suffix}",
    action="lambda:InvokeFunction",
    function=api_lambda.name,
    principal="apigateway.amazonaws.com",
    source_arn=pulumi.Output.concat(api.execution_arn, "/*/*")
)

# Export outputs
pulumi.export("bucket_name", transaction_bucket.id)
pulumi.export("dynamodb_table_name", transactions_table.name)
pulumi.export("sns_topic_arn", alerts_topic.arn)
pulumi.export("api_endpoint", pulumi.Output.concat("https://", api.id, ".execute-api.us-east-1.amazonaws.com/prod"))
pulumi.export("api_key_id", api_key.id)
```

## File: lambda/validation.py

```python
import json
import boto3
import csv
import io
import os
from datetime import datetime

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Validates CSV transaction files uploaded to S3
    """
    try:
        # Get bucket and key from S3 event
        bucket = event['Records'][0]['s3']['bucket']['name']
        key = event['Records'][0]['s3']['object']['key']

        print(f"Processing file: {bucket}/{key}")

        # Get object from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)
        csv_content = response['Body'].read().decode('utf-8')

        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(csv_content))

        processed_count = 0
        error_count = 0

        for row in csv_reader:
            try:
                # Validate required fields
                if not all(k in row for k in ['transaction_id', 'amount', 'merchant_id', 'card_number']):
                    print(f"Missing required fields in row: {row}")
                    error_count += 1
                    continue

                # Validate data types
                amount = float(row['amount'])
                timestamp = int(datetime.utcnow().timestamp())

                # Store in DynamoDB
                table.put_item(
                    Item={
                        'transaction_id': row['transaction_id'],
                        'timestamp': timestamp,
                        'amount': amount,
                        'merchant_id': row['merchant_id'],
                        'card_number': row['card_number'][-4:],  # Store only last 4 digits
                        'status': 'validated',
                        'source_file': key
                    }
                )

                processed_count += 1

            except Exception as e:
                print(f"Error processing row {row}: {str(e)}")
                error_count += 1

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'File processed successfully',
                'processed': processed_count,
                'errors': error_count
            })
        }

    except Exception as e:
        print(f"Error processing file: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing file',
                'error': str(e)
            })
        }
```

## File: lambda/anomaly_detection.py

```python
import json
import boto3
import os
from decimal import Decimal

sns_client = boto3.client('sns')
topic_arn = os.environ['SNS_TOPIC_ARN']

def handler(event, context):
    """
    Detects anomalies in transaction stream from DynamoDB
    """
    try:
        anomalies = []

        for record in event['Records']:
            if record['eventName'] in ['INSERT', 'MODIFY']:
                # Get new image
                new_image = record['dynamodb'].get('NewImage', {})

                if not new_image:
                    continue

                # Extract transaction data
                transaction_id = new_image.get('transaction_id', {}).get('S', '')
                amount = float(new_image.get('amount', {}).get('N', 0))

                # Simple anomaly detection rules
                is_anomaly = False
                reason = []

                # Rule 1: High transaction amount
                if amount > 10000:
                    is_anomaly = True
                    reason.append(f"High transaction amount: ${amount}")

                # Rule 2: Very low transaction amount (potential card testing)
                if amount < 1:
                    is_anomaly = True
                    reason.append(f"Suspicious low amount: ${amount}")

                if is_anomaly:
                    anomalies.append({
                        'transaction_id': transaction_id,
                        'amount': amount,
                        'reasons': reason
                    })

        # Send alerts for detected anomalies
        if anomalies:
            message = {
                'alert_type': 'Transaction Anomaly',
                'count': len(anomalies),
                'anomalies': anomalies
            }

            sns_client.publish(
                TopicArn=topic_arn,
                Subject='Transaction Anomaly Detected',
                Message=json.dumps(message, indent=2)
            )

            print(f"Sent alert for {len(anomalies)} anomalies")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Stream processed successfully',
                'anomalies_detected': len(anomalies)
            })
        }

    except Exception as e:
        print(f"Error processing stream: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing stream',
                'error': str(e)
            })
        }
```

## File: lambda/api_handler.py

```python
import json
import boto3
import os
from datetime import datetime, timedelta

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

bucket_name = os.environ['S3_BUCKET']
table_name = os.environ['DYNAMODB_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Handles API Gateway requests for presigned URLs and status checks
    """
    try:
        path = event.get('path', '')
        http_method = event.get('httpMethod', '')

        # Handle POST /upload - generate presigned URL
        if path == '/upload' and http_method == 'POST':
            return handle_upload_request(event)

        # Handle GET /status/{transaction_id}
        elif path.startswith('/status/') and http_method == 'GET':
            return handle_status_request(event)

        else:
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'message': 'Not found'
                })
            }

    except Exception as e:
        print(f"Error handling request: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Internal server error',
                'error': str(e)
            })
        }

def handle_upload_request(event):
    """
    Generate presigned URL for file upload
    """
    try:
        # Generate unique filename
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        filename = f"uploads/transactions-{timestamp}.csv"

        # Generate presigned URL (valid for 15 minutes)
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket_name,
                'Key': filename,
                'ContentType': 'text/csv'
            },
            ExpiresIn=900
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'upload_url': presigned_url,
                'filename': filename,
                'expires_in': 900
            })
        }

    except Exception as e:
        print(f"Error generating presigned URL: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error generating upload URL',
                'error': str(e)
            })
        }

def handle_status_request(event):
    """
    Check transaction processing status
    """
    try:
        # Extract transaction_id from path
        path_parameters = event.get('pathParameters', {})
        transaction_id = path_parameters.get('transaction_id', '')

        if not transaction_id:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'message': 'Missing transaction_id'
                })
            }

        # Query DynamoDB
        response = table.query(
            KeyConditionExpression='transaction_id = :tid',
            ExpressionAttributeValues={
                ':tid': transaction_id
            },
            ScanIndexForward=False,
            Limit=1
        )

        items = response.get('Items', [])

        if not items:
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'message': 'Transaction not found',
                    'transaction_id': transaction_id
                })
            }

        transaction = items[0]

        # Convert Decimal to float for JSON serialization
        if 'amount' in transaction:
            transaction['amount'] = float(transaction['amount'])
        if 'timestamp' in transaction:
            transaction['timestamp'] = int(transaction['timestamp'])

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'transaction': transaction
            })
        }

    except Exception as e:
        print(f"Error checking transaction status: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error checking transaction status',
                'error': str(e)
            })
        }
```

## File: Pulumi.yaml

```yaml
name: transaction-processor
runtime: python
description: Serverless transaction processing pipeline
```

## File: requirements.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```
