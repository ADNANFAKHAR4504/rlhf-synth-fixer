"""api_stack.py

This module defines the ApiStack, which creates API Gateway for metadata access.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    aws_apigateway as apigateway,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_logs as logs,
    aws_ec2 as ec2,
)
from constructs import Construct


class ApiStackProps(cdk.NestedStackProps):
    """Properties for ApiStack."""

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        vpc: Optional[ec2.IVpc] = None,
        database_secret_arn: Optional[str] = None,
        redis_endpoint: Optional[str] = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix
        self.vpc = vpc
        self.database_secret_arn = database_secret_arn
        self.redis_endpoint = redis_endpoint


class ApiStack(cdk.NestedStack):
    """
    ApiStack creates API Gateway and Lambda functions for metadata access.

    This stack provides:
    - REST API Gateway for metadata access
    - Lambda function for handling API requests
    - CloudWatch log group for API logs
    - API key for authentication
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[ApiStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = props.environment_suffix if props else "dev"

        # Create CloudWatch log group for Lambda function
        lambda_log_group = logs.LogGroup(
            self,
            "MetadataAPIFunctionLogGroup",
            log_group_name=f"/aws/lambda/video-metadata-api-{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )

        # Create Lambda function for API backend
        self.api_lambda = lambda_.Function(
            self,
            "MetadataAPIFunction",
            function_name=f"video-metadata-api-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=lambda_.Code.from_inline(
                """
import json
import os

def handler(event, context):
    # Sample handler for video metadata API
    # In production, this would connect to RDS and Redis

    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')

    if path == '/health':
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'status': 'healthy'})
        }

    if path == '/metadata' and method == 'GET':
        # Mock response - would fetch from database in production
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'videos': [],
                'message': 'Video metadata API endpoint'
            })
        }

    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'error': 'Not found'})
    }
"""
            ),
            timeout=cdk.Duration.seconds(30),
            memory_size=512,
            environment={
                "ENVIRONMENT": environment_suffix,
                "DB_SECRET_ARN": props.database_secret_arn or "",
                "REDIS_ENDPOINT": props.redis_endpoint or "",
            },
            description="Lambda function for video metadata API",
            log_group=lambda_log_group,
        )

        # Grant Lambda permission to read secrets
        if props.database_secret_arn:
            self.api_lambda.add_to_role_policy(
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=["secretsmanager:GetSecretValue"],
                    resources=[props.database_secret_arn],
                )
            )

        # Create CloudWatch log group for API Gateway
        self.api_log_group = logs.LogGroup(
            self,
            "ApiGatewayLogGroup",
            log_group_name=f"/aws/apigateway/video-metadata-{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )

        # Create REST API Gateway
        self.api = apigateway.RestApi(
            self,
            "VideoMetadataAPI",
            rest_api_name=f"video-metadata-api-{environment_suffix}",
            description="API Gateway for video metadata access",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                access_log_destination=apigateway.LogGroupLogDestination(
                    self.api_log_group
                ),
                access_log_format=apigateway.AccessLogFormat.clf(),
            ),
            cloud_watch_role=True,
            endpoint_types=[apigateway.EndpointType.REGIONAL],
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
            ),
        )

        # Create API key for authentication
        self.api_key = self.api.add_api_key(
            "VideoMetadataAPIKey",
            api_key_name=f"video-metadata-api-key-{environment_suffix}",
            description="API key for video metadata access",
        )

        # Create usage plan
        self.usage_plan = self.api.add_usage_plan(
            "VideoMetadataUsagePlan",
            name=f"video-metadata-usage-plan-{environment_suffix}",
            description="Usage plan for video metadata API",
            throttle=apigateway.ThrottleSettings(rate_limit=1000, burst_limit=2000),
            quota=apigateway.QuotaSettings(limit=1000000, period=apigateway.Period.MONTH),
        )

        self.usage_plan.add_api_key(self.api_key)
        self.usage_plan.add_api_stage(stage=self.api.deployment_stage)

        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            self.api_lambda,
            proxy=True,
            integration_responses=[
                apigateway.IntegrationResponse(status_code="200")
            ],
        )

        # Add /health endpoint
        health_resource = self.api.root.add_resource("health")
        health_resource.add_method(
            "GET",
            lambda_integration,
            api_key_required=False,
            method_responses=[apigateway.MethodResponse(status_code="200")],
        )

        # Add /metadata endpoint
        metadata_resource = self.api.root.add_resource("metadata")
        metadata_resource.add_method(
            "GET",
            lambda_integration,
            api_key_required=True,
            method_responses=[apigateway.MethodResponse(status_code="200")],
        )

        metadata_resource.add_method(
            "POST",
            lambda_integration,
            api_key_required=True,
            method_responses=[apigateway.MethodResponse(status_code="200")],
        )

        # Outputs
        cdk.CfnOutput(
            self,
            "ApiEndpoint",
            value=self.api.url,
            description="API Gateway endpoint URL",
            export_name=f"ApiEndpoint-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "ApiKeyId",
            value=self.api_key.key_id,
            description="API Key ID for authentication",
            export_name=f"ApiKeyId-{environment_suffix}",
        )
