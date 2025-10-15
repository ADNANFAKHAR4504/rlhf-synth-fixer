# Serverless Logistics Tracking API Infrastructure

Here's the complete Pulumi Python infrastructure code for your serverless logistics tracking API:

## Main Stack Implementation

```python
# lib/tap_stack.py
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""

from typing import Optional
import json
import pulumi
from pulumi import ResourceOptions, Output
from pulumi_aws import (
    s3, dynamodb, lambda_, apigateway, iam, ssm,
    cloudwatch, sqs, logs, config
)

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
    Represents the main Pulumi component resource for the TAP project.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            **args.tags,
            'Project': 'LogisticsTracking',
            'Environment': self.environment_suffix,
            'ManagedBy': 'Pulumi'
        }

        # Get current AWS region
        aws_region = config.region or 'us-west-2'

        # Create DLQ for Lambda
        dlq = sqs.Queue(
            f"tracking-lambda-dlq-{self.environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            visibility_timeout_seconds=300,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create DynamoDB table with on-demand billing
        tracking_table = dynamodb.Table(
            f"tracking-data-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="tracking_id",
            range_key="timestamp",
            attributes=[
                {
                    "name": "tracking_id",
                    "type": "S"
                },
                {
                    "name": "timestamp",
                    "type": "N"
                },
                {
                    "name": "status",
                    "type": "S"
                }
            ],
            global_secondary_indexes=[{
                "name": "StatusIndex",
                "hash_key": "status",
                "range_key": "timestamp",
                "projection_type": "ALL"
            }],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery={"enabled": True},
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create SSM Parameters
        api_config_param = ssm.Parameter(
            f"api-config-{self.environment_suffix}",
            name=f"/logistics/api/{self.environment_suffix}/config",
            type="String",
            value=json.dumps({
                "max_request_size": "10MB",
                "timeout": 30,
                "rate_limit": 100
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        db_endpoint_param = ssm.Parameter(
            f"db-endpoint-{self.environment_suffix}",
            name=f"/logistics/db/{self.environment_suffix}/endpoint",
            type="SecureString",
            value=tracking_table.name,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        feature_flags_param = ssm.Parameter(
            f"feature-flags-{self.environment_suffix}",
            name=f"/logistics/features/{self.environment_suffix}/flags",
            type="String",
            value=json.dumps({
                "enhanced_tracking": True,
                "batch_processing": False,
                "real_time_notifications": True
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch Log Group for Lambda
        lambda_log_group = logs.LogGroup(
            f"tracking-lambda-logs-{self.environment_suffix}",
            name=f"/aws/lambda/tracking-processor-{self.environment_suffix}",
            retention_in_days=7,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for Lambda
        lambda_role = iam.Role(
            f"tracking-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach policies to Lambda role
        lambda_policy = iam.RolePolicy(
            f"tracking-lambda-policy-{self.environment_suffix}",
            role=lambda_role.id,
            policy=pulumi.Output.all(
                tracking_table.arn,
                dlq.arn,
                api_config_param.name,
                db_endpoint_param.name,
                feature_flags_param.name
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query",
                            "dynamodb:Scan",
                            "dynamodb:BatchWriteItem",
                            "dynamodb:BatchGetItem"
                        ],
                        "Resource": [
                            args[0],
                            f"{args[0]}/index/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"arn:aws:logs:{aws_region}:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters",
                            "ssm:GetParametersByPath"
                        ],
                        "Resource": [
                            f"arn:aws:ssm:{aws_region}:*:parameter/logistics/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": args[1]
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
            })),
            opts=ResourceOptions(parent=self)
        )

        # Lambda function
        tracking_lambda = lambda_.Function(
            f"tracking-processor-{self.environment_suffix}",
            runtime="python3.9",
            handler="handler.main",
            role=lambda_role.arn,
            timeout=30,
            memory_size=512,
            environment={
                "variables": {
                    "TABLE_NAME": tracking_table.name,
                    "ENVIRONMENT": self.environment_suffix,
                    "AWS_REGION": aws_region,
                    "POWERTOOLS_SERVICE_NAME": "tracking-api",
                    "POWERTOOLS_METRICS_NAMESPACE": "LogisticsTracking",
                    "LOG_LEVEL": "INFO",
                    "CONFIG_PARAM": api_config_param.name,
                    "DB_PARAM": db_endpoint_param.name,
                    "FEATURE_FLAGS_PARAM": feature_flags_param.name
                }
            },
            dead_letter_config={
                "target_arn": dlq.arn
            },
            tracing_config={
                "mode": "Active"
            },
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lib/lambda")
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[lambda_policy])
        )

        # API Gateway REST API
        rest_api = apigateway.RestApi(
            f"tracking-api-{self.environment_suffix}",
            name=f"tracking-api-{self.environment_suffix}",
            description="Logistics Tracking API",
            endpoint_configuration={
                "types": "REGIONAL"
            },
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Request validator
        request_validator = apigateway.RequestValidator(
            f"tracking-validator-{self.environment_suffix}",
            rest_api_id=rest_api.id,
            name="tracking-validator",
            validate_request_body=True,
            validate_request_parameters=True,
            opts=ResourceOptions(parent=self)
        )

        # Request model
        tracking_model = apigateway.Model(
            f"tracking-model-{self.environment_suffix}",
            rest_api_id=rest_api.id,
            content_type="application/json",
            name="TrackingModel",
            schema=json.dumps({
                "$schema": "http://json-schema.org/draft-04/schema#",
                "title": "Tracking Update",
                "type": "object",
                "required": ["tracking_id", "status", "location"],
                "properties": {
                    "tracking_id": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "status": {
                        "type": "string",
                        "enum": ["pending", "in_transit", "delivered", "failed"]
                    },
                    "location": {
                        "type": "object",
                        "required": ["lat", "lng"],
                        "properties": {
                            "lat": {"type": "number"},
                            "lng": {"type": "number"}
                        }
                    },
                    "metadata": {
                        "type": "object"
                    }
                }
            }),
            opts=ResourceOptions(parent=self)
        )

        # /track resource
        track_resource = apigateway.Resource(
            f"track-resource-{self.environment_suffix}",
            rest_api_id=rest_api.id,
            parent_id=rest_api.root_resource_id,
            path_part="track",
            opts=ResourceOptions(parent=self)
        )

        # /status resource
        status_resource = apigateway.Resource(
            f"status-resource-{self.environment_suffix}",
            rest_api_id=rest_api.id,
            parent_id=rest_api.root_resource_id,
            path_part="status",
            opts=ResourceOptions(parent=self)
        )

        # Lambda integration
        lambda_integration = apigateway.Integration(
            f"lambda-integration-{self.environment_suffix}",
            rest_api_id=rest_api.id,
            resource_id=track_resource.id,
            http_method="POST",
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=tracking_lambda.invoke_arn,
            opts=ResourceOptions(parent=self)
        )

        # POST /track method
        track_post_method = apigateway.Method(
            f"track-post-method-{self.environment_suffix}",
            rest_api_id=rest_api.id,
            resource_id=track_resource.id,
            http_method="POST",
            authorization="AWS_IAM",
            request_validator_id=request_validator.id,
            request_models={
                "application/json": tracking_model.name
            },
            opts=ResourceOptions(parent=self)
        )

        # GET /status method
        status_get_method = apigateway.Method(
            f"status-get-method-{self.environment_suffix}",
            rest_api_id=rest_api.id,
            resource_id=status_resource.id,
            http_method="GET",
            authorization="AWS_IAM",
            opts=ResourceOptions(parent=self)
        )

        # Lambda integration for status
        status_integration = apigateway.Integration(
            f"status-integration-{self.environment_suffix}",
            rest_api_id=rest_api.id,
            resource_id=status_resource.id,
            http_method="GET",
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=tracking_lambda.invoke_arn,
            opts=ResourceOptions(parent=self)
        )

        # Method responses
        track_method_response = apigateway.MethodResponse(
            f"track-method-response-{self.environment_suffix}",
            rest_api_id=rest_api.id,
            resource_id=track_resource.id,
            http_method=track_post_method.http_method,
            status_code="200",
            response_models={
                "application/json": "Empty"
            },
            opts=ResourceOptions(parent=self)
        )

        status_method_response = apigateway.MethodResponse(
            f"status-method-response-{self.environment_suffix}",
            rest_api_id=rest_api.id,
            resource_id=status_resource.id,
            http_method=status_get_method.http_method,
            status_code="200",
            opts=ResourceOptions(parent=self)
        )

        # Integration responses
        track_integration_response = apigateway.IntegrationResponse(
            f"track-integration-response-{self.environment_suffix}",
            rest_api_id=rest_api.id,
            resource_id=track_resource.id,
            http_method=track_post_method.http_method,
            status_code=track_method_response.status_code,
            opts=ResourceOptions(parent=self)
        )

        status_integration_response = apigateway.IntegrationResponse(
            f"status-integration-response-{self.environment_suffix}",
            rest_api_id=rest_api.id,
            resource_id=status_resource.id,
            http_method=status_get_method.http_method,
            status_code=status_method_response.status_code,
            opts=ResourceOptions(parent=self)
        )

        # Lambda permission for API Gateway
        lambda_permission = lambda_.Permission(
            f"api-lambda-permission-{self.environment_suffix}",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function=tracking_lambda.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(
                "arn:aws:execute-api:",
                aws_region,
                ":*:",
                rest_api.id,
                "/*/*"
            ),
            opts=ResourceOptions(parent=self)
        )

        # Deploy API
        api_deployment = apigateway.Deployment(
            f"api-deployment-{self.environment_suffix}",
            rest_api_id=rest_api.id,
            stage_name=self.environment_suffix,
            stage_description=f"Deployment for {self.environment_suffix}",
            opts=ResourceOptions(
                parent=self,
                depends_on=[
                    lambda_integration,
                    status_integration,
                    track_method_response,
                    status_method_response
                ]
            )
        )

        # CloudWatch Alarms
        api_4xx_alarm = cloudwatch.MetricAlarm(
            f"api-4xx-alarm-{self.environment_suffix}",
            name=f"tracking-api-4xx-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="4XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when API has too many 4XX errors",
            dimensions={
                "ApiName": rest_api.name,
                "Stage": self.environment_suffix
            },
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        api_5xx_alarm = cloudwatch.MetricAlarm(
            f"api-5xx-alarm-{self.environment_suffix}",
            name=f"tracking-api-5xx-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=60,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert when API has 5XX errors",
            dimensions={
                "ApiName": rest_api.name,
                "Stage": self.environment_suffix
            },
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        api_latency_alarm = cloudwatch.MetricAlarm(
            f"api-latency-alarm-{self.environment_suffix}",
            name=f"tracking-api-latency-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Latency",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Average",
            threshold=1000,
            alarm_description="Alert when API latency is high",
            dimensions={
                "ApiName": rest_api.name,
                "Stage": self.environment_suffix
            },
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Lambda throttle alarm
        lambda_throttle_alarm = cloudwatch.MetricAlarm(
            f"lambda-throttle-alarm-{self.environment_suffix}",
            name=f"tracking-lambda-throttle-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Throttles",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alert when Lambda is throttled",
            dimensions={
                "FunctionName": tracking_lambda.name
            },
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            f"tracking-dashboard-{self.environment_suffix}",
            dashboard_name=f"logistics-tracking-{self.environment_suffix}",
            dashboard_body=pulumi.Output.all(
                rest_api.name,
                tracking_lambda.name,
                tracking_table.name
            ).apply(lambda args: json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/ApiGateway", "Count", {"stat": "Sum", "label": "Total Requests"}],
                                [".", "4XXError", {"stat": "Sum", "label": "4XX Errors"}],
                                [".", "5XXError", {"stat": "Sum", "label": "5XX Errors"}]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": aws_region,
                            "title": "API Gateway Metrics",
                            "dimensions": {
                                "ApiName": args[0],
                                "Stage": self.environment_suffix
                            }
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
                                [".", "Errors", {"stat": "Sum"}],
                                [".", "Duration", {"stat": "Average"}],
                                [".", "Throttles", {"stat": "Sum"}]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": aws_region,
                            "title": "Lambda Function Metrics",
                            "dimensions": {
                                "FunctionName": args[1]
                            }
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/DynamoDB", "UserErrors", {"stat": "Sum"}],
                                [".", "SystemErrors", {"stat": "Sum"}],
                                [".", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
                                [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": aws_region,
                            "title": "DynamoDB Metrics",
                            "dimensions": {
                                "TableName": args[2]
                            }
                        }
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "api_endpoint": pulumi.Output.concat(
                "https://", rest_api.id, ".execute-api.",
                aws_region, ".amazonaws.com/", self.environment_suffix
            ),
            "table_name": tracking_table.name,
            "lambda_function_name": tracking_lambda.name,
            "dlq_url": dlq.url,
            "dashboard_url": pulumi.Output.concat(
                "https://console.aws.amazon.com/cloudwatch/home?region=",
                aws_region,
                "#dashboards:name=",
                dashboard.dashboard_name
            )
        })
```

## Lambda Function Handler

```python
# lib/lambda/handler.py
import json
import os
import time
import boto3
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics()

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
ssm = boto3.client('ssm')

# Environment variables
TABLE_NAME = os.environ['TABLE_NAME']
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')
CONFIG_PARAM = os.environ.get('CONFIG_PARAM')
DB_PARAM = os.environ.get('DB_PARAM')
FEATURE_FLAGS_PARAM = os.environ.get('FEATURE_FLAGS_PARAM')

# Cache for SSM parameters
_parameter_cache = {}
_cache_expiry = {}
CACHE_TTL = 300  # 5 minutes

def get_parameter(name: str, decrypt: bool = True) -> str:
    """Get parameter from SSM with caching."""
    current_time = time.time()

    if name in _parameter_cache and current_time < _cache_expiry.get(name, 0):
        return _parameter_cache[name]

    try:
        response = ssm.get_parameter(Name=name, WithDecryption=decrypt)
        value = response['Parameter']['Value']
        _parameter_cache[name] = value
        _cache_expiry[name] = current_time + CACHE_TTL
        return value
    except Exception as e:
        logger.error(f"Failed to get parameter {name}: {str(e)}")
        raise

@tracer.capture_method
def validate_tracking_data(data: Dict[str, Any]) -> bool:
    """Validate tracking data structure."""
    required_fields = ['tracking_id', 'status', 'location']

    for field in required_fields:
        if field not in data:
            logger.warning(f"Missing required field: {field}")
            return False

    if 'lat' not in data['location'] or 'lng' not in data['location']:
        logger.warning("Location missing lat or lng")
        return False

    valid_statuses = ['pending', 'in_transit', 'delivered', 'failed']
    if data['status'] not in valid_statuses:
        logger.warning(f"Invalid status: {data['status']}")
        return False

    return True

@tracer.capture_method
def store_tracking_update(data: Dict[str, Any]) -> Dict[str, Any]:
    """Store tracking update in DynamoDB."""
    table = dynamodb.Table(TABLE_NAME)
    timestamp = int(time.time() * 1000)

    item = {
        'tracking_id': data['tracking_id'],
        'timestamp': timestamp,
        'status': data['status'],
        'location': data['location'],
        'environment': ENVIRONMENT,
        'created_at': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime())
    }

    if 'metadata' in data:
        item['metadata'] = data['metadata']

    try:
        table.put_item(Item=item)
        metrics.add_metric(name="TrackingUpdateStored", unit=MetricUnit.Count, value=1)
        return item
    except Exception as e:
        logger.error(f"Failed to store tracking update: {str(e)}")
        metrics.add_metric(name="TrackingUpdateFailed", unit=MetricUnit.Count, value=1)
        raise

@tracer.capture_method
def get_tracking_status(tracking_id: str) -> list:
    """Get tracking status from DynamoDB."""
    table = dynamodb.Table(TABLE_NAME)

    try:
        response = table.query(
            KeyConditionExpression='tracking_id = :tid',
            ExpressionAttributeValues={
                ':tid': tracking_id
            },
            ScanIndexForward=False,
            Limit=10
        )

        metrics.add_metric(name="StatusQuerySuccess", unit=MetricUnit.Count, value=1)
        return response.get('Items', [])
    except Exception as e:
        logger.error(f"Failed to get tracking status: {str(e)}")
        metrics.add_metric(name="StatusQueryFailed", unit=MetricUnit.Count, value=1)
        raise

@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def main(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """Main Lambda handler."""

    logger.info(f"Processing request: {json.dumps(event)}")

    try:
        # Load feature flags
        feature_flags = json.loads(get_parameter(FEATURE_FLAGS_PARAM, decrypt=False))
        logger.info(f"Feature flags: {feature_flags}")

        http_method = event.get('httpMethod', '')
        path = event.get('path', '')

        if http_method == 'POST' and path == '/track':
            # Handle tracking update
            body = json.loads(event.get('body', '{}'))

            if not validate_tracking_data(body):
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'Invalid tracking data'}),
                    'headers': {'Content-Type': 'application/json'}
                }

            result = store_tracking_update(body)

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Tracking update stored successfully',
                    'tracking_id': result['tracking_id'],
                    'timestamp': result['timestamp']
                }),
                'headers': {'Content-Type': 'application/json'}
            }

        elif http_method == 'GET' and path == '/status':
            # Handle status query
            tracking_id = event.get('queryStringParameters', {}).get('tracking_id')

            if not tracking_id:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'tracking_id parameter required'}),
                    'headers': {'Content-Type': 'application/json'}
                }

            items = get_tracking_status(tracking_id)

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'tracking_id': tracking_id,
                    'updates': items,
                    'count': len(items)
                }),
                'headers': {'Content-Type': 'application/json'}
            }

        else:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Not found'}),
                'headers': {'Content-Type': 'application/json'}
            }

    except Exception as e:
        logger.error(f"Unhandled exception: {str(e)}")
        metrics.add_metric(name="UnhandledException", unit=MetricUnit.Count, value=1)

        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'}),
            'headers': {'Content-Type': 'application/json'}
        }
```

## Lambda Requirements

```txt
# lib/lambda/requirements.txt
aws-lambda-powertools==2.31.0
boto3==1.34.11
```

## Unit Tests

```python
# tests/unit/test_tap_stack.py
import json
import unittest
from unittest.mock import Mock, patch, MagicMock
import pulumi
import pulumi.runtime

class TapStackTests(unittest.TestCase):
    """Unit tests for TapStack infrastructure."""

    @pulumi.runtime.test
    def test_stack_initialization(self):
        """Test stack initializes with correct configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(environment_suffix='test', tags={'Test': 'Value'})

        def check_stack(args):
            stack = TapStack('test-stack', args)
            assert stack.environment_suffix == 'test'
            assert 'Test' in stack.tags
            assert stack.tags['Test'] == 'Value'
            assert stack.tags['Environment'] == 'test'

        pulumi.runtime.run_in_stack(lambda: check_stack(args))

    @pulumi.runtime.test
    def test_dynamodb_table_configuration(self):
        """Test DynamoDB table is configured correctly."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_dynamodb():
            with patch('pulumi_aws.dynamodb.Table') as mock_table:
                args = TapStackArgs(environment_suffix='test')
                stack = TapStack('test-stack', args)

                mock_table.assert_called()
                call_args = mock_table.call_args

                assert call_args[1]['billing_mode'] == 'PAY_PER_REQUEST'
                assert call_args[1]['hash_key'] == 'tracking_id'
                assert call_args[1]['range_key'] == 'timestamp'
                assert call_args[1]['stream_enabled'] is True

        pulumi.runtime.run_in_stack(check_dynamodb)

    @pulumi.runtime.test
    def test_lambda_configuration(self):
        """Test Lambda function configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_lambda():
            with patch('pulumi_aws.lambda_.Function') as mock_lambda:
                args = TapStackArgs(environment_suffix='test')
                stack = TapStack('test-stack', args)

                mock_lambda.assert_called()
                call_args = mock_lambda.call_args

                assert call_args[1]['runtime'] == 'python3.9'
                assert call_args[1]['timeout'] == 30
                assert call_args[1]['memory_size'] == 512
                assert 'dead_letter_config' in call_args[1]
                assert call_args[1]['tracing_config']['mode'] == 'Active'

        pulumi.runtime.run_in_stack(check_lambda)

    @pulumi.runtime.test
    def test_api_gateway_configuration(self):
        """Test API Gateway configuration."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_api():
            with patch('pulumi_aws.apigateway.RestApi') as mock_api:
                args = TapStackArgs(environment_suffix='test')
                stack = TapStack('test-stack', args)

                mock_api.assert_called()
                call_args = mock_api.call_args

                assert 'tracking-api-test' in call_args[0][0]
                assert call_args[1]['endpoint_configuration']['types'] == 'REGIONAL'

        pulumi.runtime.run_in_stack(check_api)

    @pulumi.runtime.test
    def test_cloudwatch_alarms(self):
        """Test CloudWatch alarms are created."""
        from lib.tap_stack import TapStack, TapStackArgs

        def check_alarms():
            with patch('pulumi_aws.cloudwatch.MetricAlarm') as mock_alarm:
                args = TapStackArgs(environment_suffix='test')
                stack = TapStack('test-stack', args)

                # Should create multiple alarms
                assert mock_alarm.call_count >= 4

        pulumi.runtime.run_in_stack(check_alarms)


class LambdaHandlerTests(unittest.TestCase):
    """Unit tests for Lambda handler."""

    def setUp(self):
        """Set up test environment."""
        import os
        os.environ['TABLE_NAME'] = 'test-table'
        os.environ['ENVIRONMENT'] = 'test'
        os.environ['CONFIG_PARAM'] = '/test/config'
        os.environ['DB_PARAM'] = '/test/db'
        os.environ['FEATURE_FLAGS_PARAM'] = '/test/flags'

    @patch('lib.lambda.handler.dynamodb')
    @patch('lib.lambda.handler.ssm')
    def test_tracking_update_success(self, mock_ssm, mock_dynamodb):
        """Test successful tracking update."""
        from lib.lambda.handler import main

        mock_ssm.get_parameter.return_value = {
            'Parameter': {'Value': '{"enhanced_tracking": true}'}
        }

        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.put_item.return_value = {}

        event = {
            'httpMethod': 'POST',
            'path': '/track',
            'body': json.dumps({
                'tracking_id': 'TEST123',
                'status': 'in_transit',
                'location': {'lat': 40.7128, 'lng': -74.0060}
            })
        }

        context = Mock()
        response = main(event, context)

        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['tracking_id'] == 'TEST123'
        mock_table.put_item.assert_called_once()

    @patch('lib.lambda.handler.dynamodb')
    @patch('lib.lambda.handler.ssm')
    def test_tracking_update_validation_failure(self, mock_ssm, mock_dynamodb):
        """Test tracking update with invalid data."""
        from lib.lambda.handler import main

        mock_ssm.get_parameter.return_value = {
            'Parameter': {'Value': '{"enhanced_tracking": true}'}
        }

        event = {
            'httpMethod': 'POST',
            'path': '/track',
            'body': json.dumps({
                'tracking_id': 'TEST123',
                'status': 'invalid_status',
                'location': {'lat': 40.7128}
            })
        }

        context = Mock()
        response = main(event, context)

        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body

    @patch('lib.lambda.handler.dynamodb')
    @patch('lib.lambda.handler.ssm')
    def test_status_query_success(self, mock_ssm, mock_dynamodb):
        """Test successful status query."""
        from lib.lambda.handler import main

        mock_ssm.get_parameter.return_value = {
            'Parameter': {'Value': '{"enhanced_tracking": true}'}
        }

        mock_table = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.query.return_value = {
            'Items': [
                {'tracking_id': 'TEST123', 'status': 'delivered'}
            ]
        }

        event = {
            'httpMethod': 'GET',
            'path': '/status',
            'queryStringParameters': {'tracking_id': 'TEST123'}
        }

        context = Mock()
        response = main(event, context)

        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert body['tracking_id'] == 'TEST123'
        assert len(body['updates']) == 1

    @patch('lib.lambda.handler.ssm')
    def test_status_query_missing_parameter(self, mock_ssm):
        """Test status query without tracking_id."""
        from lib.lambda.handler import main

        mock_ssm.get_parameter.return_value = {
            'Parameter': {'Value': '{"enhanced_tracking": true}'}
        }

        event = {
            'httpMethod': 'GET',
            'path': '/status',
            'queryStringParameters': {}
        }

        context = Mock()
        response = main(event, context)

        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'tracking_id parameter required' in body['error']

    def test_validate_tracking_data(self):
        """Test tracking data validation function."""
        from lib.lambda.handler import validate_tracking_data

        # Valid data
        valid_data = {
            'tracking_id': 'TEST123',
            'status': 'in_transit',
            'location': {'lat': 40.7128, 'lng': -74.0060}
        }
        assert validate_tracking_data(valid_data) is True

        # Missing field
        invalid_data = {
            'tracking_id': 'TEST123',
            'status': 'in_transit'
        }
        assert validate_tracking_data(invalid_data) is False

        # Invalid status
        invalid_status = {
            'tracking_id': 'TEST123',
            'status': 'unknown',
            'location': {'lat': 40.7128, 'lng': -74.0060}
        }
        assert validate_tracking_data(invalid_status) is False

        # Missing location coordinates
        invalid_location = {
            'tracking_id': 'TEST123',
            'status': 'in_transit',
            'location': {'lat': 40.7128}
        }
        assert validate_tracking_data(invalid_location) is False


if __name__ == '__main__':
    unittest.main()
```