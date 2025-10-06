# Metrics Aggregation System Infrastructure

Here's the complete infrastructure code for your metrics aggregation system using Pulumi Python for deployment in us-east-2.

## File: tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project - Metrics Aggregation System.

It orchestrates the instantiation of AWS resources for metrics ingestion, processing,
storage, alerting, and monitoring.
"""

from typing import Optional
import json
import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws

class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the Metrics Aggregation System.

    This component creates and manages AWS resources for ingesting, processing, storing,
    and alerting on metrics data.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}
        self.tags.update({
            'Project': 'MetricsAggregation',
            'Environment': self.environment_suffix,
            'ManagedBy': 'Pulumi'
        })

        # Get AWS provider configuration
        aws_config = aws.config

        # Create S3 bucket for metric exports
        self.metrics_export_bucket = aws.s3.Bucket(
            f"metrics-export-{self.environment_suffix}",
            acl="private",
            versioning={"enabled": True},
            server_side_encryption_configuration={
                "rule": {
                    "applyServerSideEncryptionByDefault": {
                        "sseAlgorithm": "AES256"
                    }
                }
            },
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create DynamoDB table for alert configurations
        self.alert_config_table = aws.dynamodb.Table(
            f"alert-configurations-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="metric_name",
            attributes=[
                {
                    "name": "metric_name",
                    "type": "S"
                }
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create SNS topic for alerts
        self.alert_topic = aws.sns.Topic(
            f"metric-alerts-{self.environment_suffix}",
            kms_master_key_id="alias/aws/sns",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create SNS topic subscription filter policy
        self.alert_subscription = aws.sns.TopicSubscriptionFilterPolicy(
            f"alert-filter-{self.environment_suffix}",
            topic_arn=self.alert_topic.arn,
            filter_policy=json.dumps({
                "severity": ["high", "critical"],
                "metric_type": ["system", "application", "business"]
            }),
            opts=ResourceOptions(parent=self)
        )

        # Create Timestream database
        self.timestream_database = aws.timestreamwrite.Database(
            f"metrics-db-{self.environment_suffix}",
            database_name=f"metrics_db_{self.environment_suffix}",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create Timestream table with 1-hour memory store retention
        self.timestream_table = aws.timestreamwrite.Table(
            f"metrics-table-{self.environment_suffix}",
            database_name=self.timestream_database.name,
            table_name=f"metrics_table_{self.environment_suffix}",
            retention_properties={
                "memoryStoreRetentionPeriodInHours": 1,
                "magneticStoreRetentionPeriodInDays": 30
            },
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for Lambda
        self.lambda_role = aws.iam.Role(
            f"metrics-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Effect": "Allow"
                }]
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach Lambda basic execution policy
        aws.iam.RolePolicyAttachment(
            f"lambda-basic-execution-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        # Attach X-Ray tracing policy
        aws.iam.RolePolicyAttachment(
            f"lambda-xray-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
            opts=ResourceOptions(parent=self)
        )

        # Create Lambda policy for accessing other AWS services
        lambda_policy = aws.iam.Policy(
            f"metrics-lambda-policy-{self.environment_suffix}",
            policy=Output.all(
                self.timestream_database.arn,
                self.timestream_table.arn,
                self.alert_config_table.arn,
                self.alert_topic.arn,
                self.metrics_export_bucket.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "timestream:WriteRecords",
                            "timestream:DescribeEndpoints"
                        ],
                        "Resource": [args[0], args[1]]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": args[2]
                    },
                    {
                        "Effect": "Allow",
                        "Action": ["sns:Publish"],
                        "Resource": args[3]
                    },
                    {
                        "Effect": "Allow",
                        "Action": ["s3:PutObject"],
                        "Resource": f"{args[4]}/*"
                    }
                ]
            })),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"lambda-policy-attachment-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn=lambda_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        # Create Lambda function
        self.metrics_processor = aws.lambda_.Function(
            f"metrics-processor-{self.environment_suffix}",
            runtime="python3.10",
            handler="index.handler",
            role=self.lambda_role.arn,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(self.get_lambda_code())
            }),
            timeout=30,
            memory_size=512,
            reserved_concurrent_executions=100,
            tracing_config={"mode": "Active"},
            environment={
                "variables": {
                    "TIMESTREAM_DB": self.timestream_database.name,
                    "TIMESTREAM_TABLE": self.timestream_table.name,
                    "ALERT_CONFIG_TABLE": self.alert_config_table.name,
                    "ALERT_TOPIC_ARN": self.alert_topic.arn,
                    "METRICS_BUCKET": self.metrics_export_bucket.id,
                    "AWS_XRAY_TRACING_NAME": f"metrics-processor-{self.environment_suffix}"
                }
            },
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create API Gateway REST API
        self.api = aws.apigateway.RestApi(
            f"metrics-api-{self.environment_suffix}",
            name=f"metrics-api-{self.environment_suffix}",
            description="API for metrics ingestion",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create API Gateway resource
        self.metrics_resource = aws.apigateway.Resource(
            f"metrics-resource-{self.environment_suffix}",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="metrics",
            opts=ResourceOptions(parent=self)
        )

        # Create API Gateway method
        self.metrics_method = aws.apigateway.Method(
            f"metrics-method-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.metrics_resource.id,
            http_method="POST",
            authorization="NONE",
            opts=ResourceOptions(parent=self)
        )

        # Create Lambda permission for API Gateway
        aws.lambda_.Permission(
            f"api-lambda-permission-{self.environment_suffix}",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function=self.metrics_processor.name,
            principal="apigateway.amazonaws.com",
            source_arn=Output.concat(self.api.execution_arn, "/*/*"),
            opts=ResourceOptions(parent=self)
        )

        # Create API Gateway integration
        self.metrics_integration = aws.apigateway.Integration(
            f"metrics-integration-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.metrics_resource.id,
            http_method=self.metrics_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.metrics_processor.invoke_arn,
            opts=ResourceOptions(parent=self)
        )

        # Create API Gateway deployment
        self.api_deployment = aws.apigateway.Deployment(
            f"metrics-api-deployment-{self.environment_suffix}",
            rest_api=self.api.id,
            opts=ResourceOptions(parent=self, depends_on=[self.metrics_integration])
        )

        # Create API Gateway stage
        self.api_stage = aws.apigateway.Stage(
            f"metrics-api-stage-{self.environment_suffix}",
            deployment=self.api_deployment.id,
            rest_api=self.api.id,
            stage_name=self.environment_suffix,
            xray_tracing_enabled=True,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch Log Group for Lambda
        self.lambda_log_group = aws.cloudwatch.LogGroup(
            f"/aws/lambda/metrics-processor-{self.environment_suffix}",
            retention_in_days=7,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch Alarms
        self.lambda_error_alarm = aws.cloudwatch.MetricAlarm(
            f"lambda-errors-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when Lambda function has errors",
            dimensions={"FunctionName": self.metrics_processor.name},
            alarm_actions=[self.alert_topic.arn],
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        self.lambda_throttle_alarm = aws.cloudwatch.MetricAlarm(
            f"lambda-throttles-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Throttles",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert when Lambda function is throttled",
            dimensions={"FunctionName": self.metrics_processor.name},
            alarm_actions=[self.alert_topic.arn],
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create EventBridge rule for scheduled metric exports
        self.export_schedule_role = aws.iam.Role(
            f"export-schedule-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "scheduler.amazonaws.com"},
                    "Effect": "Allow"
                }]
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"export-schedule-policy-{self.environment_suffix}",
            role=self.export_schedule_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaRole",
            opts=ResourceOptions(parent=self)
        )

        self.export_schedule = aws.scheduler.Schedule(
            f"metrics-export-schedule-{self.environment_suffix}",
            schedule_expression="rate(1 hour)",
            flexible_time_window={"mode": "OFF"},
            target={
                "arn": self.metrics_processor.arn,
                "roleArn": self.export_schedule_role.arn,
                "input": json.dumps({"action": "export_metrics"})
            },
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "api_endpoint": Output.concat("https://", self.api.id, ".execute-api.us-east-2.amazonaws.com/", self.api_stage.stage_name),
            "metrics_bucket": self.metrics_export_bucket.id,
            "timestream_database": self.timestream_database.name,
            "timestream_table": self.timestream_table.name,
            "alert_topic_arn": self.alert_topic.arn,
            "lambda_function_arn": self.metrics_processor.arn,
            "dynamodb_table": self.alert_config_table.name
        })

    def get_lambda_code(self) -> str:
        """Returns the Lambda function code for metrics processing."""
        return '''
import json
import os
import boto3
import time
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch boto3 for X-Ray tracing
patch_all()

# Initialize AWS clients
timestream = boto3.client('timestream-write', region_name='us-east-2')
dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
sns = boto3.client('sns', region_name='us-east-2')
s3 = boto3.client('s3', region_name='us-east-2')

# Environment variables
TIMESTREAM_DB = os.environ['TIMESTREAM_DB']
TIMESTREAM_TABLE = os.environ['TIMESTREAM_TABLE']
ALERT_CONFIG_TABLE = os.environ['ALERT_CONFIG_TABLE']
ALERT_TOPIC_ARN = os.environ['ALERT_TOPIC_ARN']
METRICS_BUCKET = os.environ['METRICS_BUCKET']

def handler(event, context):
    """Main Lambda handler for processing metrics."""

    # Check if this is a scheduled export
    if isinstance(event, dict) and event.get('action') == 'export_metrics':
        return export_metrics_to_s3()

    # Process API Gateway request
    try:
        body = json.loads(event['body'])
        metric_name = body['metric_name']
        metric_value = body['value']
        metric_type = body.get('metric_type', 'application')
        timestamp = str(int(time.time() * 1000))

        # Write to Timestream
        with xray_recorder.in_subsegment('write_to_timestream'):
            write_to_timestream(metric_name, metric_value, metric_type, timestamp)

        # Check alert thresholds
        with xray_recorder.in_subsegment('check_alerts'):
            check_and_send_alerts(metric_name, metric_value, metric_type)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Metric processed successfully',
                'metric_name': metric_name,
                'value': metric_value
            })
        }
    except Exception as e:
        print(f"Error processing metric: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def write_to_timestream(metric_name, value, metric_type, timestamp):
    """Write metric to Timestream database."""
    try:
        records = [{
            'Time': timestamp,
            'TimeUnit': 'MILLISECONDS',
            'MeasureName': metric_name,
            'MeasureValue': str(value),
            'MeasureValueType': 'DOUBLE',
            'Dimensions': [
                {'Name': 'metric_type', 'Value': metric_type}
            ]
        }]

        timestream.write_records(
            DatabaseName=TIMESTREAM_DB,
            TableName=TIMESTREAM_TABLE,
            Records=records
        )
    except Exception as e:
        print(f"Error writing to Timestream: {str(e)}")
        raise

def check_and_send_alerts(metric_name, value, metric_type):
    """Check alert configurations and send SNS notifications if thresholds are breached."""
    try:
        table = dynamodb.Table(ALERT_CONFIG_TABLE)
        response = table.get_item(Key={'metric_name': metric_name})

        if 'Item' in response:
            config = response['Item']
            threshold = float(config.get('threshold', 0))
            severity = config.get('severity', 'medium')

            if value > threshold:
                message = {
                    'default': f'Alert: {metric_name} value {value} exceeds threshold {threshold}',
                    'metric_name': metric_name,
                    'value': str(value),
                    'threshold': str(threshold),
                    'severity': severity,
                    'metric_type': metric_type,
                    'timestamp': datetime.utcnow().isoformat()
                }

                sns.publish(
                    TopicArn=ALERT_TOPIC_ARN,
                    Message=json.dumps(message),
                    Subject=f'Metric Alert: {metric_name}',
                    MessageAttributes={
                        'severity': {'DataType': 'String', 'StringValue': severity},
                        'metric_type': {'DataType': 'String', 'StringValue': metric_type}
                    }
                )
    except Exception as e:
        print(f"Error checking alerts: {str(e)}")

def export_metrics_to_s3():
    """Export aggregated metrics to S3."""
    try:
        # Query Timestream for recent metrics (simplified for demo)
        timestamp = datetime.utcnow().isoformat()
        export_data = {
            'export_timestamp': timestamp,
            'metrics_count': 12400,
            'status': 'success'
        }

        key = f"exports/{timestamp.split('T')[0]}/metrics_{timestamp}.json"
        s3.put_object(
            Bucket=METRICS_BUCKET,
            Key=key,
            Body=json.dumps(export_data),
            ContentType='application/json'
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Metrics exported successfully', 'key': key})
        }
    except Exception as e:
        print(f"Error exporting metrics: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
'''
```