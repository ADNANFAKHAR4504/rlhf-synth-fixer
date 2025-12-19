"""
IAM module for the serverless infrastructure.

This module creates IAM roles and policies with least-privilege access for
Lambda functions, API Gateway, and other AWS services.
"""

from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

from .config import InfrastructureConfig


class IAMStack:
    """
    IAM stack for managing roles and policies with least-privilege access.
    
    Creates specific roles for Lambda functions, API Gateway, and other services
    with minimal required permissions.
    """
    
    def __init__(self, config: InfrastructureConfig, opts: Optional[ResourceOptions] = None):
        """
        Initialize the IAM stack.
        
        Args:
            config: Infrastructure configuration
            opts: Pulumi resource options
        """
        self.config = config
        self.opts = opts or ResourceOptions()
        
        # Create Lambda execution role
        self.lambda_execution_role = self._create_lambda_execution_role()
        
        # Create API Gateway role
        self.api_gateway_role = self._create_api_gateway_role()
        
        # Create Step Functions execution role
        self.step_functions_role = self._create_step_functions_role()
        
        # Create CloudWatch role for alarms
        self.cloudwatch_role = self._create_cloudwatch_role()
    
    def _create_lambda_execution_role(self):
        """Create IAM role for Lambda function execution with least privilege."""
        assume_role_policy = aws.iam.get_policy_document(
            statements=[{
                "effect": "Allow",
                "principals": [{
                    "type": "Service",
                    "identifiers": ["lambda.amazonaws.com"]
                }],
                "actions": ["sts:AssumeRole"]
            }]
        )
        
        role = aws.iam.Role(
            self.config.get_resource_name('iam-role', 'lambda-execution'),
            assume_role_policy=assume_role_policy.json,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Attach basic execution role
        aws.iam.RolePolicyAttachment(
            self.config.get_resource_name('iam-policy-attachment', 'lambda-basic-execution'),
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Attach X-Ray tracing policy if enabled
        if self.config.enable_xray_tracing:
            aws.iam.RolePolicyAttachment(
                self.config.get_resource_name('iam-policy-attachment', 'lambda-xray'),
                role=role.name,
                policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
                opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
            )
        
        return role
    
    def _create_api_gateway_role(self):
        """Create IAM role for API Gateway with minimal permissions."""
        assume_role_policy = aws.iam.get_policy_document(
            statements=[{
                "effect": "Allow",
                "principals": [{
                    "type": "Service",
                    "identifiers": ["apigateway.amazonaws.com"]
                }],
                "actions": ["sts:AssumeRole"]
            }]
        )
        
        role = aws.iam.Role(
            self.config.get_resource_name('iam-role', 'api-gateway'),
            assume_role_policy=assume_role_policy.json,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # CloudWatch Logs policy for API Gateway
        logs_policy = aws.iam.Policy(
            self.config.get_resource_name('iam-policy', 'api-gateway-logs'),
            policy=aws.iam.get_policy_document(
                statements=[{
                    "effect": "Allow",
                    "actions": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "resources": [
                        f"arn:aws:logs:{self.config.aws_region}:*:log-group:/aws/apigateway/*"
                    ]
                }]
            ).json,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        aws.iam.RolePolicyAttachment(
            self.config.get_resource_name('iam-policy-attachment', 'api-gateway-logs'),
            role=role.name,
            policy_arn=logs_policy.arn,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return role
    
    def _create_step_functions_role(self):
        """Create IAM role for Step Functions execution."""
        assume_role_policy = aws.iam.get_policy_document(
            statements=[{
                "effect": "Allow",
                "principals": [{
                    "type": "Service",
                    "identifiers": ["states.amazonaws.com"]
                }],
                "actions": ["sts:AssumeRole"]
            }]
        )
        
        role = aws.iam.Role(
            self.config.get_resource_name('iam-role', 'step-functions'),
            assume_role_policy=assume_role_policy.json,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Step Functions execution policy
        execution_policy = aws.iam.Policy(
            self.config.get_resource_name('iam-policy', 'step-functions-execution'),
            policy=aws.iam.get_policy_document(
                statements=[{
                    "effect": "Allow",
                    "actions": [
                        "lambda:InvokeFunction",
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "resources": ["*"]
                }]
            ).json,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        aws.iam.RolePolicyAttachment(
            self.config.get_resource_name('iam-policy-attachment', 'step-functions-execution'),
            role=role.name,
            policy_arn=execution_policy.arn,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return role
    
    def _create_cloudwatch_role(self):
        """Create IAM role for CloudWatch alarms and monitoring."""
        assume_role_policy = aws.iam.get_policy_document(
            statements=[{
                "effect": "Allow",
                "principals": [{
                    "type": "Service",
                    "identifiers": ["cloudwatch.amazonaws.com"]
                }],
                "actions": ["sts:AssumeRole"]
            }]
        )
        
        role = aws.iam.Role(
            self.config.get_resource_name('iam-role', 'cloudwatch'),
            assume_role_policy=assume_role_policy.json,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return role
    
    def create_dynamodb_policy(self, table_arn: str) -> aws.iam.Policy:
        """
        Create least-privilege DynamoDB policy for specific table.
        
        Args:
            table_arn: ARN of the DynamoDB table
            
        Returns:
            IAM policy with minimal DynamoDB permissions
        """
        return aws.iam.Policy(
            self.config.get_resource_name('iam-policy', 'dynamodb-access'),
            policy=aws.iam.get_policy_document(
                statements=[{
                    "effect": "Allow",
                    "actions": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query"
                    ],
                    "resources": [table_arn]
                }]
            ).json,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
    
    def create_s3_policy(self, bucket_arn: str) -> aws.iam.Policy:
        """
        Create least-privilege S3 policy for specific bucket.
        
        Args:
            bucket_arn: ARN of the S3 bucket
            
        Returns:
            IAM policy with minimal S3 permissions
        """
        return aws.iam.Policy(
            self.config.get_resource_name('iam-policy', 's3-access'),
            policy=aws.iam.get_policy_document(
                statements=[{
                    "effect": "Allow",
                    "actions": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ],
                    "resources": [f"{bucket_arn}/*"]
                }]
            ).json,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
    
    def get_lambda_execution_role_arn(self) -> pulumi.Output[str]:
        """Get Lambda execution role ARN."""
        return self.lambda_execution_role.arn
    
    def get_api_gateway_role_arn(self) -> pulumi.Output[str]:
        """Get API Gateway role ARN."""
        return self.api_gateway_role.arn
    
    def get_step_functions_role_arn(self) -> pulumi.Output[str]:
        """Get Step Functions role ARN."""
        return self.step_functions_role.arn
    
    def get_cloudwatch_role_arn(self) -> pulumi.Output[str]:
        """Get CloudWatch role ARN."""
        return self.cloudwatch_role.arn
