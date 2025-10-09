"""
IAM module for the serverless infrastructure.

This module creates IAM roles and policies with least-privilege access
for Lambda functions, API Gateway, and other AWS services.
"""

from typing import Any, Dict, Optional

from pulumi import ResourceOptions
from pulumi_aws import iam

from .config import InfrastructureConfig


class IAMStack:
    """
    IAM stack for managing roles and policies with least-privilege access.
    
    Creates specific IAM roles for Lambda functions, API Gateway, and other
    services with minimal required permissions.
    """
    
    def __init__(self, config: InfrastructureConfig, provider: Optional[Any] = None):
        """
        Initialize IAM stack.
        
        Args:
            config: Infrastructure configuration
            provider: AWS provider instance
        """
        self.config = config
        self.provider = provider
        self._create_lambda_execution_role()
        self._create_api_gateway_role()
        self._create_dynamodb_access_policy()
        self._create_s3_access_policy()
        self._create_cloudwatch_logs_policy()
    
    def _create_lambda_execution_role(self):
        """Create IAM role for Lambda function execution."""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }
            ]
        }
        
        self.lambda_execution_role = iam.Role(
            self.config.get_naming_convention("iam-role", "lambda-execution"),
            name=self.config.get_naming_convention("iam-role", "lambda-execution"),
            assume_role_policy=assume_role_policy,
            tags=self.config.get_tags({
                "Name": "Lambda Execution Role",
                "Purpose": "Lambda function execution permissions"
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
        
        # Attach basic Lambda execution policy
        self.lambda_basic_policy = iam.RolePolicyAttachment(
            self.config.get_naming_convention("iam-policy-attachment", "lambda-basic"),
            role=self.lambda_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
    
    def _create_api_gateway_role(self):
        """Create IAM role for API Gateway."""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "apigateway.amazonaws.com"
                    }
                }
            ]
        }
        
        self.api_gateway_role = iam.Role(
            self.config.get_naming_convention("iam-role", "api-gateway"),
            name=self.config.get_naming_convention("iam-role", "api-gateway"),
            assume_role_policy=assume_role_policy,
            tags=self.config.get_tags({
                "Name": "API Gateway Role",
                "Purpose": "API Gateway execution permissions"
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
    
    def _create_dynamodb_access_policy(self):
        """Create fine-grained DynamoDB access policy."""
        dynamodb_policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": [
                        f"arn:aws:dynamodb:{self.config.aws_region}:*:table/{self.config.get_naming_convention('dynamodb', 'main')}",
                        f"arn:aws:dynamodb:{self.config.aws_region}:*:table/{self.config.get_naming_convention('dynamodb', 'main')}/index/*"
                    ]
                }
            ]
        }
        
        self.dynamodb_policy = iam.Policy(
            self.config.get_naming_convention("iam-policy", "dynamodb-access"),
            name=self.config.get_naming_convention("iam-policy", "dynamodb-access"),
            policy=dynamodb_policy_document,
            tags=self.config.get_tags({
                "Name": "DynamoDB Access Policy",
                "Purpose": "Fine-grained DynamoDB access"
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
        
        # Attach DynamoDB policy to Lambda role
        self.dynamodb_policy_attachment = iam.RolePolicyAttachment(
            self.config.get_naming_convention("iam-policy-attachment", "lambda-dynamodb"),
            role=self.lambda_execution_role.name,
            policy_arn=self.dynamodb_policy.arn,
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
    
    def _create_s3_access_policy(self):
        """Create fine-grained S3 access policy."""
        s3_policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{self.config.get_naming_convention('s3', 'static-assets')}/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{self.config.get_naming_convention('s3', 'static-assets')}"
                    ]
                }
            ]
        }
        
        self.s3_policy = iam.Policy(
            self.config.get_naming_convention("iam-policy", "s3-access"),
            name=self.config.get_naming_convention("iam-policy", "s3-access"),
            policy=s3_policy_document,
            tags=self.config.get_tags({
                "Name": "S3 Access Policy",
                "Purpose": "Fine-grained S3 access"
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
        
        # Attach S3 policy to Lambda role
        self.s3_policy_attachment = iam.RolePolicyAttachment(
            self.config.get_naming_convention("iam-policy-attachment", "lambda-s3"),
            role=self.lambda_execution_role.name,
            policy_arn=self.s3_policy.arn,
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
    
    def _create_cloudwatch_logs_policy(self):
        """Create CloudWatch Logs policy for Lambda functions."""
        logs_policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": [
                        f"arn:aws:logs:{self.config.aws_region}:*:log-group:/aws/lambda/{self.config.get_naming_convention('lambda', 'main')}*"
                    ]
                }
            ]
        }
        
        self.cloudwatch_logs_policy = iam.Policy(
            self.config.get_naming_convention("iam-policy", "cloudwatch-logs"),
            name=self.config.get_naming_convention("iam-policy", "cloudwatch-logs"),
            policy=logs_policy_document,
            tags=self.config.get_tags({
                "Name": "CloudWatch Logs Policy",
                "Purpose": "Lambda logging permissions"
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
        
        # Attach CloudWatch Logs policy to Lambda role
        self.cloudwatch_logs_policy_attachment = iam.RolePolicyAttachment(
            self.config.get_naming_convention("iam-policy-attachment", "lambda-cloudwatch-logs"),
            role=self.lambda_execution_role.name,
            policy_arn=self.cloudwatch_logs_policy.arn,
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )
    
    def get_outputs(self) -> Dict[str, Any]:
        """
        Get IAM stack outputs.
        
        Returns:
            Dictionary containing IAM resource outputs
        """
        return {
            "lambda_execution_role_arn": self.lambda_execution_role.arn,
            "lambda_execution_role_name": self.lambda_execution_role.name,
            "api_gateway_role_arn": self.api_gateway_role.arn,
            "api_gateway_role_name": self.api_gateway_role.name,
            "dynamodb_policy_arn": self.dynamodb_policy.arn,
            "s3_policy_arn": self.s3_policy.arn,
            "cloudwatch_logs_policy_arn": self.cloudwatch_logs_policy.arn
        }
