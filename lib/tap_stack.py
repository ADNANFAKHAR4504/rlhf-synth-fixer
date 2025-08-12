"""
tap_stack.py

Enterprise Serverless Infrastructure with Lambda and SSM Parameter Store integration.
Production-ready implementation with 1000 concurrent executions, API Gateway, and CloudWatch logging.
"""

import json
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions
from typing import Dict, Optional

class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (str): Environment suffix for identifying deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """
    def __init__(self, environment_suffix: str = "dev", tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix
        self.tags = tags

class TapStack(ComponentResource):
    """
    Enterprise Serverless Infrastructure Stack.
    
    Provides AWS Lambda with SSM Parameter Store integration, API Gateway,
    and CloudWatch monitoring with 1000 concurrent execution support.
    """

    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__("custom:TapStack", name, {}, opts)

        self.environment = args.environment_suffix
        self.region = "us-east-1"
        self.project_name = "serverless-infra"
        self.tags = args.tags or {}

        # Create SSM parameters
        self._create_ssm_parameters()

        # Create Lambda function
        self._create_lambda_function()

        # Create API Gateway
        self._create_api_gateway()

        # Register outputs
        self.register_outputs({
            "vpc_id": "not-implemented",
            "lambda_function_name": self.lambda_function.function_name,
            "lambda_function_arn": self.lambda_function.arn,
            "api_gateway_url": self.api.api_endpoint,
            "api_gateway_id": self.api.id,
            "ssm_parameter_count": len(self.ssm_parameters),
            "environment": self.environment,
            "region": self.region
        })

    def _create_ssm_parameters(self):
        """Create SSM parameters for environment variables"""
        self.ssm_parameters = {}

        # Database parameters
        db_params = {
            "host": "localhost",
            "port": "5432",
            "database": "serverless_app",
            "username": "app_user"
        }

        for key, value in db_params.items():
            param = aws.ssm.Parameter(
                f"serverless-infra-{self.environment}-ssm-db-{key}",
                name=f"/myapp/{self.environment}/database/{key}",
                type="String",
                value=value,
                description=f"Database {key} for {self.environment}",
                tags={
                    "Environment": self.environment,
                    "Application": "serverless-infrastructure",
                    **self.tags
                },
                opts=ResourceOptions(parent=self)
            )
            self.ssm_parameters[f"database_{key}"] = param

    def _create_lambda_function(self):
        """Create Lambda function with SSM parameter integration"""

        # Lambda execution role
        self.lambda_role = aws.iam.Role(
            f"serverless-infra-{self.environment}-lambda-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"}
                }]
            }),
            tags={
                "Environment": self.environment,
                "Application": "serverless-infrastructure",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Lambda policy with SSM access
        lambda_policy = aws.iam.Policy(
            f"serverless-infra-{self.environment}-lambda-policy",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"arn:aws:logs:{self.region}:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters",
                            "ssm:GetParametersByPath"
                        ],
                        "Resource": f"arn:aws:ssm:{self.region}:*:parameter/myapp/{self.environment}/*"
                    }
                ]
            }),
            opts=ResourceOptions(parent=self)
        )

        # Attach policies to role
        aws.iam.RolePolicyAttachment(
            f"serverless-infra-{self.environment}-lambda-basic",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"serverless-infra-{self.environment}-lambda-policy-attach",
            role=self.lambda_role.name,
            policy_arn=lambda_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch log group
        log_group = aws.cloudwatch.LogGroup(
            f"serverless-infra-{self.environment}-lambda-logs",
            name=f"/aws/lambda/serverless-infra-{self.environment}-processor",
            retention_in_days=14,
            tags={
                "Environment": self.environment,
                "Application": "serverless-infrastructure",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Lambda function code with SSM integration
        lambda_code = '''
import json
import boto3
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ssm_client = boto3.client('ssm')

def get_ssm_parameters():
    """Load parameters from SSM Parameter Store"""
    try:
        environment = os.environ.get('ENVIRONMENT', 'dev')
        prefix = f"/myapp/{environment}"

        response = ssm_client.get_parameters_by_path(
            Path=prefix,
            Recursive=True,
            WithDecryption=True
        )

        parameters = {}
        for param in response['Parameters']:
            key = param['Name'].split('/')[-1]
            parameters[key] = param['Value']

        logger.info(f"Loaded {len(parameters)} parameters from SSM")
        return parameters
    except Exception as e:
        logger.error(f"Failed to load SSM parameters: {str(e)}")
        return {}

def lambda_handler(event, context):
    """Main Lambda handler with SSM parameter loading"""
    try:
        logger.info(json.dumps({
            "event_type": "request_received",
            "request_id": context.aws_request_id,
            "event": event
        }))

        # Load configuration from SSM
        config = get_ssm_parameters()

        # Process request (handles 1000 concurrent executions)
        result = {
            "message": "Serverless infrastructure working correctly",
            "request_id": context.aws_request_id,
            "environment": os.environ.get('ENVIRONMENT', 'dev'),
            "config_loaded": len(config),
            "timestamp": context.get_remaining_time_in_millis()
        }

        logger.info(json.dumps({
            "event_type": "request_processed",
            "request_id": context.aws_request_id,
            "result": result
        }))

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(result)
        }

    except Exception as e:
        logger.error(json.dumps({
            "event_type": "request_error",
            "request_id": context.aws_request_id,
            "error": str(e)
        }))

        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "error": str(e),
                "request_id": context.aws_request_id
            })
        }
'''

        # Lambda function with 1000 concurrent executions
        self.lambda_function = aws.lambda_.Function(
            f"serverless-infra-{self.environment}-processor",
            runtime="python3.11",
            code=lambda_code,
            handler="index.lambda_handler",
            role=self.lambda_role.arn,
            timeout=30,
            memory_size=512,
            reserved_concurrent_executions=1000,
            environment={
                "variables": {
                    "ENVIRONMENT": self.environment,
                    "SSM_PARAMETER_PREFIX": f"/myapp/{self.environment}",
                    "LOG_LEVEL": "INFO"
                }
            },
            tags={
                "Environment": self.environment,
                "Application": "serverless-infrastructure",
                **self.tags
            },
            opts=ResourceOptions(parent=self, depends_on=[log_group])
        )

    def _create_api_gateway(self):
        """Create API Gateway for Lambda access"""

        # API Gateway
        self.api = aws.apigatewayv2.Api(
            f"serverless-infra-{self.environment}-api",
            protocol_type="HTTP",
            cors_configuration={
                "allow_methods": ["GET", "POST"],
                "allow_origins": ["*"],
                "allow_headers": ["content-type"]
            },
            tags={
                "Environment": self.environment,
                "Application": "serverless-infrastructure",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Lambda integration
        integration = aws.apigatewayv2.Integration(
            f"serverless-infra-{self.environment}-integration",
            api_id=self.api.id,
            integration_type="AWS_PROXY",
            integration_method="POST",
            integration_uri=self.lambda_function.arn,
            payload_format_version="2.0",
            opts=ResourceOptions(parent=self)
        )

        # Route
        aws.apigatewayv2.Route(
            f"serverless-infra-{self.environment}-route",
            api_id=self.api.id,
            route_key="POST /process",
            target=integration.id.apply(lambda id: f"integrations/{id}"),
            opts=ResourceOptions(parent=self)
        )

        # Stage
        aws.apigatewayv2.Stage(
            f"serverless-infra-{self.environment}-stage",
            api_id=self.api.id,
            name="$default",
            auto_deploy=True,
            tags={
                "Environment": self.environment,
                "Application": "serverless-infrastructure",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Lambda permission
        aws.lambda_.Permission(
            f"serverless-infra-{self.environment}-permission",
            action="lambda:InvokeFunction",
            function=self.lambda_function.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=self.api.execution_arn.apply(lambda arn: f"{arn}/*/*"),
            opts=ResourceOptions(parent=self)
        )
