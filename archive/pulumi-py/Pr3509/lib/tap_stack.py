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
import pulumi_aws
from pulumi_aws import (
    s3, dynamodb, lambda_, apigateway, iam, ssm,
    cloudwatch, sqs, config
)

class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the
            deployment environment (e.g., 'dev', 'prod').
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

        # Get current AWS region and account ID
        aws_region = config.region or 'us-west-2'
        current = pulumi_aws.get_caller_identity()
        aws_account_id = current.account_id

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
        lambda_log_group = cloudwatch.LogGroup(
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
                        "Resource": f"arn:aws:logs:{aws_region}:{aws_account_id}:log-group:/aws/lambda/tracking-processor-{self.environment_suffix}:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters",
                            "ssm:GetParametersByPath"
                        ],
                        "Resource": [
                            f"arn:aws:ssm:{aws_region}:{aws_account_id}:parameter/logistics/*"
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
                    "REGION": aws_region,  # Changed from AWS_REGION (reserved)
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
            rest_api=rest_api.id,
            name="tracking-validator",
            validate_request_body=True,
            validate_request_parameters=True,
            opts=ResourceOptions(parent=self)
        )

        # Request model
        tracking_model = apigateway.Model(
            f"tracking-model-{self.environment_suffix}",
            rest_api=rest_api.id,
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
            rest_api=rest_api.id,
            parent_id=rest_api.root_resource_id,
            path_part="track",
            opts=ResourceOptions(parent=self)
        )

        # /status resource
        status_resource = apigateway.Resource(
            f"status-resource-{self.environment_suffix}",
            rest_api=rest_api.id,
            parent_id=rest_api.root_resource_id,
            path_part="status",
            opts=ResourceOptions(parent=self)
        )

        # Lambda integration
        lambda_integration = apigateway.Integration(
            f"lambda-integration-{self.environment_suffix}",
            rest_api=rest_api.id,
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
            rest_api=rest_api.id,
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
            rest_api=rest_api.id,
            resource_id=status_resource.id,
            http_method="GET",
            authorization="AWS_IAM",
            opts=ResourceOptions(parent=self)
        )

        # Lambda integration for status
        status_integration = apigateway.Integration(
            f"status-integration-{self.environment_suffix}",
            rest_api=rest_api.id,
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
            rest_api=rest_api.id,
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
            rest_api=rest_api.id,
            resource_id=status_resource.id,
            http_method=status_get_method.http_method,
            status_code="200",
            opts=ResourceOptions(parent=self)
        )

        # Integration responses (depends on integrations being created first)
        track_integration_response = apigateway.IntegrationResponse(
            f"track-integration-response-{self.environment_suffix}",
            rest_api=rest_api.id,
            resource_id=track_resource.id,
            http_method=track_post_method.http_method,
            status_code=track_method_response.status_code,
            opts=ResourceOptions(parent=self, depends_on=[lambda_integration])
        )

        status_integration_response = apigateway.IntegrationResponse(
            f"status-integration-response-{self.environment_suffix}",
            rest_api=rest_api.id,
            resource_id=status_resource.id,
            http_method=status_get_method.http_method,
            status_code=status_method_response.status_code,
            opts=ResourceOptions(parent=self, depends_on=[status_integration])
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
                ":",
                aws_account_id,
                ":",
                rest_api.id,
                "/*/*"
            ),
            opts=ResourceOptions(parent=self)
        )

        # Deploy API
        api_deployment = apigateway.Deployment(
            f"api-deployment-{self.environment_suffix}",
            rest_api=rest_api.id,
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

        # Create API stage
        api_stage = apigateway.Stage(
            f"api-stage-{self.environment_suffix}",
            deployment=api_deployment.id,
            rest_api=rest_api.id,
            stage_name=self.environment_suffix,
            description=f"Stage for {self.environment_suffix}",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
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
            dashboard_body=json.dumps({
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
                            "title": "API Gateway Metrics"
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
                            "title": "Lambda Function Metrics"
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
                            "title": "DynamoDB Metrics"
                        }
                    }
                ]
            }),
            opts=ResourceOptions(parent=self)
        )

        # Store outputs as instance attributes for external access
        self.api_endpoint = pulumi.Output.concat(
            "https://", rest_api.id, ".execute-api.",
            aws_region, ".amazonaws.com/", api_stage.stage_name
        )
        self.table_name = tracking_table.name
        self.lambda_function_name = tracking_lambda.name
        self.dlq_url = dlq.url
        self.dashboard_url = pulumi.Output.concat(
            "https://console.aws.amazon.com/cloudwatch/home?region=",
            aws_region,
            "#dashboards:name=",
            dashboard.dashboard_name
        )

        # Register outputs for ComponentResource
        self.register_outputs({
            "api_endpoint": self.api_endpoint,
            "table_name": self.table_name,
            "lambda_function_name": self.lambda_function_name,
            "dlq_url": self.dlq_url,
            "dashboard_url": self.dashboard_url
        })
