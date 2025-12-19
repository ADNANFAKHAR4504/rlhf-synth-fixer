# Event-Driven Inventory Processing System - Pulumi Python Infrastructure

## File: lib/tap_stack.py

```python
"""
tap_stack.py

Main Pulumi stack for event-driven inventory processing system.
"""

from typing import Optional
import json
import pulumi
from pulumi import ResourceOptions, Output
from pulumi_aws import s3, iam, dynamodb, lambda_, cloudwatch, sqs, events, logs
import pulumi_aws as aws

class TapStackArgs:
    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}

class TapStack(pulumi.ComponentResource):
    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {**args.tags, 'Environment': self.environment_suffix}

        # Create S3 bucket for inventory uploads
        self.inventory_bucket = s3.Bucket(
            f"inventory-uploads-{self.environment_suffix}",
            versioning=s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=s3.BucketServerSideEncryptionConfigurationArgs(
                rule=s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create DynamoDB table for inventory data
        self.inventory_table = dynamodb.Table(
            f"inventory-data-{self.environment_suffix}",
            name=f"inventory-data-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="product_id",
            range_key="timestamp",
            attributes=[
                dynamodb.TableAttributeArgs(name="product_id", type="S"),
                dynamodb.TableAttributeArgs(name="timestamp", type="N"),
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery=dynamodb.TablePointInTimeRecoveryArgs(enabled=True),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create SQS Dead Letter Queue
        self.dlq = sqs.Queue(
            f"inventory-processing-dlq-{self.environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch Log Group for Lambda
        self.lambda_log_group = logs.LogGroup(
            f"/aws/lambda/inventory-processor-{self.environment_suffix}",
            retention_in_days=7,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for Lambda
        lambda_assume_role = iam.get_policy_document(statements=[
            iam.GetPolicyDocumentStatementArgs(
                effect="Allow",
                principals=[iam.GetPolicyDocumentStatementPrincipalArgs(
                    type="Service",
                    identifiers=["lambda.amazonaws.com"]
                )],
                actions=["sts:AssumeRole"]
            )
        ])

        self.lambda_role = iam.Role(
            f"inventory-processor-role-{self.environment_suffix}",
            assume_role_policy=lambda_assume_role.json,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Lambda execution policy
        lambda_policy_doc = iam.get_policy_document(statements=[
            iam.GetPolicyDocumentStatementArgs(
                effect="Allow",
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=[f"arn:aws:logs:*:*:log-group:/aws/lambda/*"]
            ),
            iam.GetPolicyDocumentStatementArgs(
                effect="Allow",
                actions=[
                    "s3:GetObject",
                    "s3:ListBucket"
                ],
                resources=[
                    self.inventory_bucket.arn,
                    Output.concat(self.inventory_bucket.arn, "/*")
                ]
            ),
            iam.GetPolicyDocumentStatementArgs(
                effect="Allow",
                actions=[
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:BatchWriteItem"
                ],
                resources=[self.inventory_table.arn]
            ),
            iam.GetPolicyDocumentStatementArgs(
                effect="Allow",
                actions=[
                    "sqs:SendMessage",
                    "sqs:GetQueueUrl"
                ],
                resources=[self.dlq.arn]
            ),
            iam.GetPolicyDocumentStatementArgs(
                effect="Allow",
                actions=[
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords"
                ],
                resources=["*"]
            ),
            iam.GetPolicyDocumentStatementArgs(
                effect="Allow",
                actions=[
                    "cloudwatch:PutMetricData"
                ],
                resources=["*"]
            )
        ])

        self.lambda_policy = iam.RolePolicy(
            f"inventory-processor-policy-{self.environment_suffix}",
            role=self.lambda_role.id,
            policy=lambda_policy_doc.json,
            opts=ResourceOptions(parent=self)
        )

        # Lambda function for inventory processing
        self.inventory_processor = lambda_.Function(
            f"inventory-processor-{self.environment_suffix}",
            code=pulumi.FileArchive("./lib/lambda"),
            handler="inventory_processor.handler",
            runtime="python3.10",
            role=self.lambda_role.arn,
            timeout=60,
            memory_size=512,
            environment=lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE_NAME": self.inventory_table.name,
                    "DLQ_URL": self.dlq.url,
                    "ENVIRONMENT": self.environment_suffix
                }
            ),
            dead_letter_config=lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.dlq.arn
            ),
            tracing_config=lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.lambda_policy])
        )

        # EventBridge Rule for S3 uploads
        s3_event_rule = events.Rule(
            f"inventory-upload-rule-{self.environment_suffix}",
            event_pattern=json.dumps({
                "source": ["aws.s3"],
                "detail-type": ["Object Created"],
                "detail": {
                    "bucket": {"name": [self.inventory_bucket.id]}
                }
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Grant EventBridge permission to invoke Lambda
        lambda_permission = lambda_.Permission(
            f"eventbridge-invoke-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.inventory_processor.name,
            principal="events.amazonaws.com",
            source_arn=s3_event_rule.arn,
            opts=ResourceOptions(parent=self)
        )

        # EventBridge Target for Lambda
        events.Target(
            f"inventory-lambda-target-{self.environment_suffix}",
            rule=s3_event_rule.name,
            arn=self.inventory_processor.arn,
            opts=ResourceOptions(parent=self, depends_on=[lambda_permission])
        )

        # S3 Event Notification to EventBridge
        s3.BucketNotification(
            f"inventory-bucket-notification-{self.environment_suffix}",
            bucket=self.inventory_bucket.id,
            eventbridge=True,
            opts=ResourceOptions(parent=self)
        )

        # Daily summary Lambda function
        self.summary_processor = lambda_.Function(
            f"inventory-summary-processor-{self.environment_suffix}",
            code=pulumi.FileArchive("./lib/lambda"),
            handler="summary_processor.handler",
            runtime="python3.10",
            role=self.lambda_role.arn,
            timeout=120,
            memory_size=256,
            environment=lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE_NAME": self.inventory_table.name,
                    "ENVIRONMENT": self.environment_suffix
                }
            ),
            tracing_config=lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.lambda_policy])
        )

        # EventBridge Scheduler for daily summary
        scheduler_role = iam.Role(
            f"scheduler-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "scheduler.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        scheduler_policy = iam.RolePolicy(
            f"scheduler-policy-{self.environment_suffix}",
            role=scheduler_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": ["lambda:InvokeFunction"],
                    "Resource": self.summary_processor.arn
                }]
            }),
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Alarm for Lambda errors
        self.error_alarm = cloudwatch.MetricAlarm(
            f"inventory-processor-error-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=0.01,
            alarm_description="Alarm when Lambda error rate exceeds 1%",
            dimensions={"FunctionName": self.inventory_processor.name},
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Dashboard
        dashboard_body = Output.all(
            self.inventory_processor.name,
            self.summary_processor.name,
            self.inventory_table.name
        ).apply(lambda args: json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Duration", {"stat": "Average", "label": "Avg Duration"}],
                            [".", ".", {"stat": "Maximum", "label": "Max Duration"}],
                            [".", "Errors", {"stat": "Sum", "label": "Errors"}],
                            [".", "Invocations", {"stat": "Sum", "label": "Invocations"}]
                        ],
                        "view": "timeSeries",
                        "stacked": False,
                        "region": "us-east-1",
                        "title": "Lambda Metrics",
                        "dimensions": [["FunctionName", args[0]]]
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
                            [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}]
                        ],
                        "view": "timeSeries",
                        "stacked": False,
                        "region": "us-east-1",
                        "title": "DynamoDB Metrics",
                        "dimensions": [["TableName", args[2]]]
                    }
                }
            ]
        }))

        self.dashboard = cloudwatch.Dashboard(
            f"inventory-dashboard-{self.environment_suffix}",
            dashboard_body=dashboard_body,
            dashboard_name=f"inventory-processing-{self.environment_suffix}",
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "bucket_name": self.inventory_bucket.id,
            "table_name": self.inventory_table.name,
            "processor_function": self.inventory_processor.name,
            "summary_function": self.summary_processor.name,
            "dlq_url": self.dlq.url,
            "dashboard_url": Output.concat(
                "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=",
                self.dashboard.dashboard_name
            )
        })
```

## File: lib/lambda/inventory_processor.py

```python
"""
inventory_processor.py

Lambda function to process inventory updates from S3 uploads.
"""

import json
import os
import csv
import time
import boto3
from datetime import datetime
from decimal import Decimal
import logging
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')
sqs = boto3.client('sqs')

# Environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
DLQ_URL = os.environ.get('DLQ_URL')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')

def handler(event, context):
    """
    Process inventory update files uploaded to S3.
    """
    start_time = time.time()
    records_processed = 0
    file_size = 0

    try:
        # Parse EventBridge event
        if 'detail' in event:
            # EventBridge event format
            bucket_name = event['detail']['bucket']['name']
            object_key = event['detail']['object']['key']
        else:
            # Direct S3 event format (fallback)
            record = event['Records'][0]
            bucket_name = record['s3']['bucket']['name']
            object_key = record['s3']['object']['key']

        logger.info(f"Processing file: s3://{bucket_name}/{object_key}")

        # Get the object from S3
        response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        file_size = response['ContentLength']
        content = response['Body'].read().decode('utf-8')

        # Parse CSV content
        csv_reader = csv.DictReader(content.splitlines())

        # Get DynamoDB table
        table = dynamodb.Table(TABLE_NAME)

        # Process each row
        batch_items = []
        for row in csv_reader:
            try:
                # Prepare item for DynamoDB
                item = {
                    'product_id': row['product_id'],
                    'timestamp': Decimal(str(time.time())),
                    'quantity': Decimal(row.get('quantity', '0')),
                    'price': Decimal(row.get('price', '0')),
                    'warehouse_id': row.get('warehouse_id', 'default'),
                    'last_updated': datetime.utcnow().isoformat(),
                    'source_file': object_key,
                    'environment': ENVIRONMENT
                }

                # Add any additional fields from CSV
                for key, value in row.items():
                    if key not in item and value:
                        try:
                            # Try to convert to Decimal for numeric values
                            item[key] = Decimal(value)
                        except:
                            item[key] = value

                batch_items.append(item)

                # Write in batches of 25 (DynamoDB limit)
                if len(batch_items) >= 25:
                    write_batch_to_dynamodb(table, batch_items)
                    records_processed += len(batch_items)
                    batch_items = []

            except Exception as e:
                logger.error(f"Error processing row: {row}, Error: {str(e)}")
                send_to_dlq({"row": row, "error": str(e), "file": object_key})

        # Write remaining items
        if batch_items:
            write_batch_to_dynamodb(table, batch_items)
            records_processed += len(batch_items)

        # Calculate processing time
        processing_time = time.time() - start_time

        # Send custom metrics to CloudWatch
        send_metrics(records_processed, file_size, processing_time)

        logger.info(f"Successfully processed {records_processed} records in {processing_time:.2f} seconds")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Inventory processed successfully',
                'records_processed': records_processed,
                'processing_time': processing_time,
                'file_size': file_size
            })
        }

    except Exception as e:
        logger.error(f"Error processing inventory: {str(e)}")

        # Send error to DLQ
        if DLQ_URL:
            send_to_dlq({
                "event": event,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            })

        # Send error metric
        cloudwatch.put_metric_data(
            Namespace='InventoryProcessing',
            MetricData=[
                {
                    'MetricName': 'ProcessingErrors',
                    'Value': 1,
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                }
            ]
        )

        raise

def write_batch_to_dynamodb(table, items):
    """
    Write a batch of items to DynamoDB.
    """
    try:
        with table.batch_writer() as batch:
            for item in items:
                batch.put_item(Item=item)
    except ClientError as e:
        logger.error(f"Error writing batch to DynamoDB: {str(e)}")
        raise

def send_to_dlq(message):
    """
    Send failed messages to Dead Letter Queue.
    """
    if not DLQ_URL:
        return

    try:
        sqs.send_message(
            QueueUrl=DLQ_URL,
            MessageBody=json.dumps(message),
            MessageAttributes={
                'Environment': {
                    'StringValue': ENVIRONMENT,
                    'DataType': 'String'
                }
            }
        )
    except Exception as e:
        logger.error(f"Error sending message to DLQ: {str(e)}")

def send_metrics(records_processed, file_size, processing_time):
    """
    Send custom metrics to CloudWatch.
    """
    try:
        cloudwatch.put_metric_data(
            Namespace='InventoryProcessing',
            MetricData=[
                {
                    'MetricName': 'RecordsProcessed',
                    'Value': records_processed,
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                },
                {
                    'MetricName': 'FileSize',
                    'Value': file_size,
                    'Unit': 'Bytes',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                },
                {
                    'MetricName': 'ProcessingDuration',
                    'Value': processing_time * 1000,  # Convert to milliseconds
                    'Unit': 'Milliseconds',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                }
            ]
        )
    except Exception as e:
        logger.error(f"Error sending metrics to CloudWatch: {str(e)}")
```

## File: lib/lambda/summary_processor.py

```python
"""
summary_processor.py

Lambda function to generate daily inventory summary reports.
"""

import json
import os
import boto3
from datetime import datetime, timedelta
from decimal import Decimal
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')

class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to float for JSON serialization."""
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

def handler(event, context):
    """
    Generate daily inventory summary report.
    """
    try:
        logger.info("Starting daily inventory summary generation")

        # Get DynamoDB table
        table = dynamodb.Table(TABLE_NAME)

        # Calculate time range for the last 24 hours
        end_time = Decimal(str(datetime.utcnow().timestamp()))
        start_time = Decimal(str((datetime.utcnow() - timedelta(days=1)).timestamp()))

        # Scan table for recent updates (in production, consider using GSI for better performance)
        response = table.scan(
            FilterExpression='#ts BETWEEN :start AND :end',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={
                ':start': start_time,
                ':end': end_time
            }
        )

        items = response.get('Items', [])

        # Continue scanning if there are more items
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression='#ts BETWEEN :start AND :end',
                ExpressionAttributeNames={'#ts': 'timestamp'},
                ExpressionAttributeValues={
                    ':start': start_time,
                    ':end': end_time
                },
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            items.extend(response.get('Items', []))

        # Generate summary statistics
        summary = {
            'date': datetime.utcnow().isoformat(),
            'environment': ENVIRONMENT,
            'total_updates': len(items),
            'unique_products': len(set(item['product_id'] for item in items)),
            'warehouses': list(set(item.get('warehouse_id', 'unknown') for item in items)),
            'total_inventory_value': sum(
                float(item.get('quantity', 0)) * float(item.get('price', 0))
                for item in items
            )
        }

        # Group by product for detailed summary
        product_summary = {}
        for item in items:
            product_id = item['product_id']
            if product_id not in product_summary:
                product_summary[product_id] = {
                    'total_quantity': 0,
                    'average_price': 0,
                    'update_count': 0,
                    'warehouses': set()
                }

            product_summary[product_id]['total_quantity'] += float(item.get('quantity', 0))
            product_summary[product_id]['average_price'] += float(item.get('price', 0))
            product_summary[product_id]['update_count'] += 1
            product_summary[product_id]['warehouses'].add(item.get('warehouse_id', 'unknown'))

        # Calculate averages
        for product_id, data in product_summary.items():
            if data['update_count'] > 0:
                data['average_price'] = data['average_price'] / data['update_count']
            data['warehouses'] = list(data['warehouses'])

        summary['product_details'] = product_summary

        # Send metrics to CloudWatch
        send_summary_metrics(summary)

        logger.info(f"Summary generated successfully: {json.dumps(summary, cls=DecimalEncoder)}")

        return {
            'statusCode': 200,
            'body': json.dumps(summary, cls=DecimalEncoder)
        }

    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")

        # Send error metric
        cloudwatch.put_metric_data(
            Namespace='InventoryProcessing',
            MetricData=[
                {
                    'MetricName': 'SummaryGenerationErrors',
                    'Value': 1,
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                }
            ]
        )

        raise

def send_summary_metrics(summary):
    """
    Send summary metrics to CloudWatch.
    """
    try:
        cloudwatch.put_metric_data(
            Namespace='InventoryProcessing',
            MetricData=[
                {
                    'MetricName': 'DailyUpdates',
                    'Value': summary['total_updates'],
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                },
                {
                    'MetricName': 'UniqueProducts',
                    'Value': summary['unique_products'],
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                },
                {
                    'MetricName': 'TotalInventoryValue',
                    'Value': summary['total_inventory_value'],
                    'Unit': 'None',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                }
            ]
        )
    except Exception as e:
        logger.error(f"Error sending summary metrics: {str(e)}")
```

## File: lib/lambda/requirements.txt

```txt
boto3>=1.26.0
```

## File: requirements.txt

```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## File: Pulumi.dev.yaml

```yaml
config:
  aws:region: us-east-1
```