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
        environment_suffix (Optional[str]): An optional suffix for identifying
            the deployment environment (e.g., 'dev', 'prod').
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
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Configure S3 bucket public access block (replaces ACL)
        self.metrics_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"metrics-export-public-block-{self.environment_suffix}",
            bucket=self.metrics_export_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Configure S3 bucket versioning
        self.metrics_bucket_versioning = aws.s3.BucketVersioning(
            f"metrics-export-versioning-{self.environment_suffix}",
            bucket=self.metrics_export_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            },
            opts=ResourceOptions(parent=self)
        )

        # Configure S3 bucket server-side encryption
        self.metrics_bucket_encryption = aws.s3.BucketServerSideEncryptionConfiguration(
            f"metrics-export-encryption-{self.environment_suffix}",
            bucket=self.metrics_export_bucket.id,
            rules=[{
                "applyServerSideEncryptionByDefault": {
                    "sseAlgorithm": "AES256"
                }
            }],
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

        # SNS topic subscription removed for security
        # In production, configure subscriptions manually via AWS Console
        # or through environment-specific configuration with proper email verification

        # Create DynamoDB table for time-series metrics storage
        # Using DynamoDB as alternative to Timestream
        self.metrics_table = aws.dynamodb.Table(
            f"metrics-timeseries-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="metric_name",
            range_key="timestamp",
            attributes=[
                {
                    "name": "metric_name",
                    "type": "S"
                },
                {
                    "name": "timestamp",
                    "type": "N"
                }
            ],
            ttl={
                "enabled": True,
                "attribute_name": "ttl"
            },
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
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
                self.metrics_table.arn,
                self.alert_config_table.arn,
                self.alert_topic.arn,
                self.metrics_export_bucket.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:Query",
                            "dynamodb:Scan",
                            "dynamodb:UpdateItem"
                        ],
                        "Resource": [args[0], args[1]]
                    },
                    {
                        "Effect": "Allow",
                        "Action": ["sns:Publish"],
                        "Resource": args[2]
                    },
                    {
                        "Effect": "Allow",
                        "Action": ["s3:PutObject"],
                        "Resource": f"{args[3]}/*"
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
            # reserved_concurrent_executions removed - account lacks unreserved concurrency
            tracing_config={"mode": "Active"},
            environment={
                "variables": {
                    "METRICS_TABLE": self.metrics_table.id,
                    "ALERT_CONFIG_TABLE": self.alert_config_table.id,
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

        # Create API Key for secure access
        self.api_key = aws.apigateway.ApiKey(
            f"metrics-api-key-{self.environment_suffix}",
            name=f"metrics-api-key-{self.environment_suffix}",
            description="API key for metrics ingestion",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create API Gateway method with API key requirement
        self.metrics_method = aws.apigateway.Method(
            f"metrics-method-{self.environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.metrics_resource.id,
            http_method="POST",
            authorization="NONE",
            api_key_required=True,  # Require API key for authentication
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

        # Create Usage Plan for API key management
        self.usage_plan = aws.apigateway.UsagePlan(
            f"metrics-usage-plan-{self.environment_suffix}",
            name=f"metrics-usage-plan-{self.environment_suffix}",
            description="Usage plan for metrics API",
            api_stages=[{
                "api_id": self.api.id,
                "stage": self.api_stage.stage_name
            }],
            quota_settings={
                "limit": 10000,
                "period": "DAY"
            },
            throttle_settings={
                "rate_limit": 1000,
                "burst_limit": 2000
            },
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.api_stage])
        )

        # Associate API key with usage plan
        self.usage_plan_key = aws.apigateway.UsagePlanKey(
            f"metrics-usage-plan-key-{self.environment_suffix}",
            key_id=self.api_key.id,
            key_type="API_KEY",
            usage_plan_id=self.usage_plan.id,
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
            dimensions={"FunctionName": self.metrics_processor.id},
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
            dimensions={"FunctionName": self.metrics_processor.id},
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
            "api_endpoint": Output.concat(
                "https://", self.api.id,
                ".execute-api.us-east-2.amazonaws.com/",
                self.api_stage.stage_name
            ),
            "api_key_id": self.api_key.id,
            "api_key_value": self.api_key.value,
            "metrics_bucket": self.metrics_export_bucket.id,
            "metrics_table": self.metrics_table.id,
            "alert_config_table": self.alert_config_table.id,
            "alert_topic_arn": self.alert_topic.arn,
            "lambda_function_arn": self.metrics_processor.arn
        })

    def get_lambda_code(self) -> str:
        """Returns the Lambda function code for metrics processing."""
        return '''
import json
import os
import boto3
import time
from datetime import datetime, timedelta

# Try to import X-Ray SDK - it's optional
try:
    from aws_xray_sdk.core import xray_recorder
    from aws_xray_sdk.core import patch_all
    patch_all()
    XRAY_AVAILABLE = True
except ImportError:
    XRAY_AVAILABLE = False
    # Create dummy context manager for xray_recorder
    class DummyXRayRecorder:
        def in_subsegment(self, name):
            return DummyContext()

    class DummyContext:
        def __enter__(self):
            return self
        def __exit__(self, exc_type, exc_val, exc_tb):
            pass

    xray_recorder = DummyXRayRecorder()

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
sns = boto3.client('sns', region_name='us-east-2')
s3 = boto3.client('s3', region_name='us-east-2')

# Environment variables
METRICS_TABLE = os.environ['METRICS_TABLE']
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

        # Write to DynamoDB metrics table
        with xray_recorder.in_subsegment('write_to_dynamodb'):
            write_to_dynamodb(metric_name, metric_value, metric_type, timestamp)

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

def write_to_dynamodb(metric_name, value, metric_type, timestamp):
    """Write metric to DynamoDB table."""
    try:
        table = dynamodb.Table(METRICS_TABLE)

        # Set TTL to 30 days from now
        ttl_timestamp = int((datetime.utcnow() + timedelta(days=30)).timestamp())

        item = {
            'metric_name': metric_name,
            'timestamp': int(timestamp),
            'value': str(value),
            'metric_type': metric_type,
            'ttl': ttl_timestamp,
            'created_at': datetime.utcnow().isoformat()
        }

        table.put_item(Item=item)
    except Exception as e:
        print(f"Error writing to DynamoDB: {str(e)}")
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
        table = dynamodb.Table(METRICS_TABLE)

        # Query recent metrics from the last hour
        one_hour_ago = int((datetime.utcnow() - timedelta(hours=1)).timestamp() * 1000)

        # Sample scan - in production, use query with GSI for better performance
        response = table.scan(
            FilterExpression='#ts > :timestamp',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={':timestamp': one_hour_ago}
        )

        timestamp = datetime.utcnow().isoformat()
        export_data = {
            'export_timestamp': timestamp,
            'metrics_count': len(response.get('Items', [])),
            'metrics': response.get('Items', []),
            'status': 'success'
        }

        key = f"exports/{timestamp.split('T')[0]}/metrics_{timestamp}.json"
        s3.put_object(
            Bucket=METRICS_BUCKET,
            Key=key,
            Body=json.dumps(export_data, default=str),
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
