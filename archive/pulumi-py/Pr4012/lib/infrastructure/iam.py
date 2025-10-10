"""
IAM roles and policies for the serverless application.

This module creates IAM roles with least privilege access for Lambda functions,
API Gateway, and other AWS services, ensuring security best practices.
"""

from typing import Dict, List, Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import iam

from .config import InfrastructureConfig


class IAMStack:
    """
    IAM stack for managing roles and policies with least privilege access.
    
    Creates IAM roles for Lambda execution, API Gateway, and log processing
    with minimal necessary permissions for security.
    """
    
    def __init__(self, config: InfrastructureConfig, opts: Optional[ResourceOptions] = None):
        """
        Initialize IAM stack with least privilege policies.
        
        Args:
            config: Infrastructure configuration
            opts: Pulumi resource options
        """
        self.config = config
        self.opts = opts or ResourceOptions()
        
        # Create IAM roles and policies
        self.lambda_execution_role = self._create_lambda_execution_role()
        self.api_gateway_role = self._create_api_gateway_role()
        self.log_processing_role = self._create_log_processing_role()
        
    def _create_lambda_execution_role(self) -> iam.Role:
        """
        Create IAM role for Lambda execution with least privilege.
        
        Returns:
            IAM role for Lambda execution
        """
        role_name = self.config.get_resource_name('lambda-execution-role')
        
        # Assume role policy for Lambda
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
        
        # Create the role
        role = iam.Role(
            role_name,
            assume_role_policy=assume_role_policy,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Attach basic Lambda execution policy
        iam.RolePolicyAttachment(
            f"{role_name}-basic-execution",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=role)
        )
        
        # Create custom policy for CloudWatch Logs
        cloudwatch_policy = iam.Policy(
            f"{role_name}-cloudwatch-policy",
            policy={
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogGroups",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": f"arn:aws:logs:{self.config.aws_region}:*:*"
                    }
                ]
            },
            tags=self.config.tags,
            opts=ResourceOptions(parent=role)
        )
        
        iam.RolePolicyAttachment(
            f"{role_name}-cloudwatch-attachment",
            role=role.name,
            policy_arn=cloudwatch_policy.arn,
            opts=ResourceOptions(parent=role)
        )
        
        return role
    
    def _create_api_gateway_role(self) -> iam.Role:
        """
        Create IAM role for API Gateway with minimal permissions.
        
        Returns:
            IAM role for API Gateway
        """
        role_name = self.config.get_resource_name('api-gateway-role')
        
        # Assume role policy for API Gateway
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
        
        # Create the role
        role = iam.Role(
            role_name,
            assume_role_policy=assume_role_policy,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Create policy for Lambda invocation
        lambda_policy = iam.Policy(
            f"{role_name}-lambda-policy",
            policy={
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "lambda:InvokeFunction"
                        ],
                        "Resource": f"arn:aws:lambda:{self.config.aws_region}:*:function:{self.config.name_prefix}-*"
                    }
                ]
            },
            tags=self.config.tags,
            opts=ResourceOptions(parent=role)
        )
        
        iam.RolePolicyAttachment(
            f"{role_name}-lambda-attachment",
            role=role.name,
            policy_arn=lambda_policy.arn,
            opts=ResourceOptions(parent=role)
        )
        
        return role
    
    def _create_log_processing_role(self) -> iam.Role:
        """
        Create IAM role for log processing and S3 access.
        
        Returns:
            IAM role for log processing
        """
        role_name = self.config.get_resource_name('log-processing-role')
        
        # Assume role policy for Lambda (for log processing)
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
        
        # Create the role
        role = iam.Role(
            role_name,
            assume_role_policy=assume_role_policy,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Attach basic Lambda execution policy
        iam.RolePolicyAttachment(
            f"{role_name}-basic-execution",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=role)
        )
        
        # Create policy for S3 log access
        s3_log_policy = iam.Policy(
            f"{role_name}-s3-log-policy",
            policy={
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
                            f"arn:aws:s3:::{self.config.name_prefix}-logs",
                            f"arn:aws:s3:::{self.config.name_prefix}-logs/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogGroups",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": f"arn:aws:logs:{self.config.aws_region}:*:*"
                    }
                ]
            },
            tags=self.config.tags,
            opts=ResourceOptions(parent=role)
        )
        
        iam.RolePolicyAttachment(
            f"{role_name}-s3-log-attachment",
            role=role.name,
            policy_arn=s3_log_policy.arn,
            opts=ResourceOptions(parent=role)
        )
        
        return role
    
    def get_lambda_execution_role_arn(self) -> pulumi.Output[str]:
        """
        Get the ARN of the Lambda execution role.
        
        Returns:
            ARN of the Lambda execution role
        """
        return self.lambda_execution_role.arn
    
    def get_api_gateway_role_arn(self) -> pulumi.Output[str]:
        """
        Get the ARN of the API Gateway role.
        
        Returns:
            ARN of the API Gateway role
        """
        return self.api_gateway_role.arn
    
    def get_log_processing_role_arn(self) -> pulumi.Output[str]:
        """
        Get the ARN of the log processing role.
        
        Returns:
            ARN of the log processing role
        """
        return self.log_processing_role.arn
