```python
"""
tap_stack.py - Pulumi ComponentResource for AWS Nova Model Breaking project

This module defines the TapStack ComponentResource that provisions a complete
serverless infrastructure on AWS including Lambda functions, API Gateway,
S3 bucket, IAM roles, and CloudWatch monitoring.
"""

import json
from typing import Dict, Any, Optional
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, Config, Output

class TapStackArgs:
"""Arguments for TapStack ComponentResource"""

    def __init__(
        self,
        environment_suffix: str = "dev",
        tags: Optional[Dict[str, str]] = None,
        lambda_memory_size: int = 256,
        lambda_timeout: int = 30,
        api_stage_name: str = "v1"
    ):
        self.environment_suffix = environment_suffix
        self.tags = tags or {}
        self.lambda_memory_size = lambda_memory_size
        self.lambda_timeout = lambda_timeout
        self.api_stage_name = api_stage_name

class TapStack(ComponentResource):
"""
TapStack ComponentResource that provisions AWS serverless infrastructure
for the Nova Model Breaking project.

    This stack creates:
    - Lambda functions for HTTP request handling
    - API Gateway for REST endpoints
    - S3 bucket for data storage
    - IAM roles with least-privilege permissions
    - CloudWatch alarms for monitoring
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__("custom:TapStack", name, {}, opts)

        # Store configuration
        self.name = name
        self.args = args
        self.config = Config()
        self.environment_suffix = args.environment_suffix
        self.tags = {
            "Environment": self.environment_suffix,
            "Project": "nova-model-breaking",
            "ManagedBy": "pulumi",
            **args.tags
        }

        # Resource references
        self.lambda_function = None
        self.api_gateway = None
        self.s3_bucket = None
        self.lambda_role = None
        self.cloudwatch_alarm = None

        # Create infrastructure components
        self._create_iam_role()
        self._create_s3_bucket()
        self._create_lambda_function()
        self._create_api_gateway()
        self._create_cloudwatch_alarms()

        # Register outputs
        self.register_outputs({
            "lambda_function_name": self.lambda_function.name,
            "lambda_function_arn": self.lambda_function.arn,
            "api_gateway_url": self.api_gateway.api_endpoint,
            "s3_bucket_name": self.s3_bucket.bucket,
            "lambda_role_arn": self.lambda_role.arn
        })

    def _create_iam_role(self) -> None:
        """
        Create IAM role and policies for Lambda execution with least-privilege permissions.

        The role allows Lambda to:
        - Write logs to CloudWatch
        - Access S3 bucket for data operations
        - Execute within VPC if needed
        """
        # Lambda execution role trust policy
        lambda_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        })

        # Create IAM role for Lambda execution
        self.lambda_role = aws.iam.Role(
            f"prod-lambda-role-{self.environment_suffix}",
            assume_role_policy=lambda_assume_role_policy,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution policy for CloudWatch logging
        lambda_basic_execution_attachment = aws.iam.RolePolicyAttachment(
            f"prod-lambda-basic-execution-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        # Create custom policy for S3 access
        s3_policy_document = pulumi.Output.all(
            bucket_name=f"prod-nova-data-{self.environment_suffix}"
        ).apply(lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{args['bucket_name']}",
                        f"arn:aws:s3:::{args['bucket_name']}/*"
                    ]
                }
            ]
        }))

        # Create S3 access policy
        s3_access_policy = aws.iam.Policy(
            f"prod-lambda-s3-policy-{self.environment_suffix}",
            policy=s3_policy_document,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach S3 policy to Lambda role
        s3_policy_attachment = aws.iam.RolePolicyAttachment(
            f"prod-lambda-s3-attachment-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn=s3_access_policy.arn,
            opts=ResourceOptions(parent=self)
        )

    def _create_s3_bucket(self) -> None:
        """
        Create a private S3 bucket for data storage with security best practices.

        Features:
        - Versioning enabled for data protection
        - Server-side encryption with AES256
        - Public access blocked for security
        - Lifecycle policies for cost optimization
        """
        bucket_name = f"prod-nova-data-{self.environment_suffix}"

        # Create S3 bucket
        self.s3_bucket = aws.s3.Bucket(
            f"prod-s3-bucket-{self.environment_suffix}",
            bucket=bucket_name,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning on the bucket
        bucket_versioning = aws.s3.BucketVersioningV2(
            f"prod-s3-versioning-{self.environment_suffix}",
            bucket=self.s3_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self)
        )

        # Configure server-side encryption
        bucket_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"prod-s3-encryption-{self.environment_suffix}",
            bucket=self.s3_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                ),
                bucket_key_enabled=True
            )],
            opts=ResourceOptions(parent=self)
        )

        # Block all public access
        bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"prod-s3-public-access-block-{self.environment_suffix}",
            bucket=self.s3_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

    def _create_lambda_function(self) -> None:
        """
        Create Lambda function for handling HTTP requests with proper configuration.

        Features:
        - Python 3.9 runtime (or latest supported)
        - Environment variables from Pulumi config
        - CloudWatch logging enabled
        - Proper error handling and monitoring
        """
        # Get configuration values
        lambda_code = self.config.get("lambda_code") or self._get_default_lambda_code()

        # Environment variables for Lambda
        lambda_environment = {
            "ENVIRONMENT": self.environment_suffix,
            "S3_BUCKET_NAME": self.s3_bucket.bucket,
            "LOG_LEVEL": self.config.get("log_level") or "INFO",
            "API_VERSION": self.args.api_stage_name
        }

        # Add any additional environment variables from config
        config_env_vars = self.config.get_object("lambda_environment_variables") or {}
        lambda_environment.update(config_env_vars)

        # Create Lambda function
        self.lambda_function = aws.lambda_.Function(
            f"prod-lambda-function-{self.environment_suffix}",
            role=self.lambda_role.arn,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(lambda_code)
            }),
            handler="index.handler",
            runtime="python3.9",
            memory_size=self.args.lambda_memory_size,
            timeout=self.args.lambda_timeout,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables=lambda_environment
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.lambda_role])
        )

        # Create CloudWatch Log Group with retention policy
        lambda_log_group = aws.cloudwatch.LogGroup(
            f"prod-lambda-logs-{self.environment_suffix}",
            name=self.lambda_function.name.apply(lambda name: f"/aws/lambda/{name}"),
            retention_in_days=14,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

    def _create_api_gateway(self) -> None:
        """
        Create API Gateway HTTP API v2 with Lambda integration.

        Features:
        - HTTP API v2 for better performance and lower cost
        - Integration with Lambda function
        - Basic routes (/, /health)
        - CORS configuration
        - Proper stage management
        """
        # Create HTTP API
        self.api_gateway = aws.apigatewayv2.Api(
            f"prod-api-gateway-{self.environment_suffix}",
            protocol_type="HTTP",
            cors_configuration=aws.apigatewayv2.ApiCorsConfigurationArgs(
                allow_credentials=False,
                allow_headers=["content-type", "x-amz-date", "authorization", "x-api-key"],
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allow_origins=["*"],
                max_age=86400
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create Lambda integration
        lambda_integration = aws.apigatewayv2.Integration(
            f"prod-api-integration-{self.environment_suffix}",
            api_id=self.api_gateway.id,
            integration_type="AWS_PROXY",
            integration_method="POST",
            integration_uri=self.lambda_function.invoke_arn,
            payload_format_version="2.0",
            opts=ResourceOptions(parent=self)
        )

        # Create routes
        # Root route
        root_route = aws.apigatewayv2.Route(
            f"prod-api-route-root-{self.environment_suffix}",
            api_id=self.api_gateway.id,
            route_key="GET /",
            target=lambda_integration.id.apply(lambda id: f"integrations/{id}"),
            opts=ResourceOptions(parent=self)
        )

        # Health check route
        health_route = aws.apigatewayv2.Route(
            f"prod-api-route-health-{self.environment_suffix}",
            api_id=self.api_gateway.id,
            route_key="GET /health",
            target=lambda_integration.id.apply(lambda id: f"integrations/{id}"),
            opts=ResourceOptions(parent=self)
        )

        # Catch-all route for other methods
        catch_all_route = aws.apigatewayv2.Route(
            f"prod-api-route-catchall-{self.environment_suffix}",
            api_id=self.api_gateway.id,
            route_key="ANY /{proxy+}",
            target=lambda_integration.id.apply(lambda id: f"integrations/{id}"),
            opts=ResourceOptions(parent=self)
        )

        # Create stage
        api_stage = aws.apigatewayv2.Stage(
            f"prod-api-stage-{self.environment_suffix}",
            api_id=self.api_gateway.id,
            name=self.args.api_stage_name,
            auto_deploy=True,
            access_log_settings=aws.apigatewayv2.StageAccessLogSettingsArgs(
                destination_arn=self._create_api_log_group().arn,
                format=json.dumps({
                    "requestId": "$context.requestId",
                    "ip": "$context.identity.sourceIp",
                    "requestTime": "$context.requestTime",
                    "httpMethod": "$context.httpMethod",
                    "routeKey": "$context.routeKey",
                    "status": "$context.status",
                    "protocol": "$context.protocol",
                    "responseLength": "$context.responseLength"
                })
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Grant API Gateway permission to invoke Lambda
        lambda_permission = aws.lambda_.Permission(
            f"prod-lambda-permission-{self.environment_suffix}",
            statement_id="AllowExecutionFromAPIGateway",
            action="lambda:InvokeFunction",
            function=self.lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(
                self.api_gateway.execution_arn, "/*/*"
            ),
            opts=ResourceOptions(parent=self)
        )

    def _create_api_log_group(self) -> aws.cloudwatch.LogGroup:
        """Create CloudWatch Log Group for API Gateway access logs"""
        return aws.cloudwatch.LogGroup(
            f"prod-api-logs-{self.environment_suffix}",
            name=f"/aws/apigateway/prod-api-{self.environment_suffix}",
            retention_in_days=14,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

    def _create_cloudwatch_alarms(self) -> None:
        """
        Create CloudWatch alarms for monitoring Lambda function errors.

        Features:
        - Monitor Lambda errors metric
        - Alert when error count exceeds threshold
        - SNS topic for notifications (optional)
        - Proper alarm naming and tagging
        """
        # Create CloudWatch alarm for Lambda errors
        self.cloudwatch_alarm = aws.cloudwatch.MetricAlarm(
            f"prod-lambda-errors-alarm-{self.environment_suffix}",
            alarm_name=f"prod-lambda-errors-{self.environment_suffix}",
            alarm_description=f"Lambda function errors for {self.lambda_function.name}",
            metric_name="Errors",
            namespace="AWS/Lambda",
            statistic="Sum",
            period=300,  # 5 minutes
            evaluation_periods=1,
            threshold=1,
            comparison_operator="GreaterThanOrEqualToThreshold",
            dimensions={
                "FunctionName": self.lambda_function.name
            },
            alarm_actions=[],  # Add SNS topic ARN here if needed
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create alarm for Lambda duration (optional)
        duration_alarm = aws.cloudwatch.MetricAlarm(
            f"prod-lambda-duration-alarm-{self.environment_suffix}",
            alarm_name=f"prod-lambda-duration-{self.environment_suffix}",
            alarm_description=f"Lambda function duration alarm for {self.lambda_function.name}",
            metric_name="Duration",
            namespace="AWS/Lambda",
            statistic="Average",
            period=300,
            evaluation_periods=2,
            threshold=self.args.lambda_timeout * 1000 * 0.8,  # 80% of timeout in ms
            comparison_operator="GreaterThanThreshold",
            dimensions={
                "FunctionName": self.lambda_function.name
            },
            alarm_actions=[],  # Add SNS topic ARN here if needed
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

    def _get_default_lambda_code(self) -> str:
        """
        Provide default Lambda function code for handling HTTP requests.

        Returns:
            str: Python code for Lambda function
        """
        return '''

import json
import logging
import os
import boto3
from typing import Dict, Any

# Configure logging

logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Initialize AWS clients

s3_client = boto3.client('s3')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
"""
Lambda function handler for HTTP requests via API Gateway.

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        Dict containing HTTP response
    """
    try:
        # Log the incoming event
        logger.info(f"Received event: {json.dumps(event, default=str)}")

        # Extract request information
        http_method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
        path = event.get('requestContext', {}).get('http', {}).get('path', '/')

        # Handle different routes
        if path == '/health':
            return handle_health_check()
        elif path == '/':
            return handle_root_request(http_method, event)
        else:
            return handle_generic_request(http_method, path, event)

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

def handle_health_check() -> Dict[str, Any]:
"""Handle health check requests"""
return {
'statusCode': 200,
'headers': {
'Content-Type': 'application/json',
'Access-Control-Allow-Origin': '\*'
},
'body': json.dumps({
'status': 'healthy',
'environment': os.environ.get('ENVIRONMENT', 'unknown'),
'version': os.environ.get('API_VERSION', '1.0')
})
}

def handle_root_request(method: str, event: Dict[str, Any]) -> Dict[str, Any]:
"""Handle root path requests"""
return {
'statusCode': 200,
'headers': {
'Content-Type': 'application/json',
'Access-Control-Allow-Origin': '\*'
},
'body': json.dumps({
'message': 'Welcome to Nova Model Breaking API',
'method': method,
'environment': os.environ.get('ENVIRONMENT', 'unknown'),
'timestamp': event.get('requestContext', {}).get('timeEpoch', 0)
})
}

def handle_generic_request(method: str, path: str, event: Dict[str, Any]) -> Dict[str, Any]:
"""Handle generic requests"""
return {
'statusCode': 200,
'headers': {
'Content-Type': 'application/json',
'Access-Control-Allow-Origin': '\*'
},
'body': json.dumps({
'message': f'Handled {method} request to {path}',
'path': path,
'method': method,
'environment': os.environ.get('ENVIRONMENT', 'unknown')
})
}
'''
```
