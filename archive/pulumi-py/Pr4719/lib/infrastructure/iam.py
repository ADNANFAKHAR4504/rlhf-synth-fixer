"""
IAM module for the serverless backend.

This module creates tightly scoped IAM roles and policies for Lambda functions,
avoiding overly broad managed policies.
"""

import json
from typing import Dict, List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig


class IAMStack:
    """
    Manages IAM roles and policies for Lambda functions.
    
    Creates tightly scoped IAM roles with minimal permissions,
    avoiding broad managed policies like AWSLambdaBasicExecutionRole.
    """
    
    def __init__(self, config: ServerlessConfig, provider_manager: AWSProviderManager):
        """
        Initialize the IAM stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.roles: Dict[str, aws.iam.Role] = {}
    
    def create_lambda_role(
        self,
        role_name: str,
        s3_bucket_arns: Optional[List[Output[str]]] = None,
        s3_permissions: Optional[List[str]] = None,
        ssm_parameter_arns: Optional[List[Output[str]]] = None
    ) -> aws.iam.Role:
        """
        Create a tightly scoped IAM role for a Lambda function.
        
        Args:
            role_name: Name identifier for the role
            s3_bucket_arns: List of S3 bucket ARNs to grant access to
            s3_permissions: List of S3 permissions (e.g., ['s3:GetObject', 's3:PutObject'])
            ssm_parameter_arns: List of SSM parameter ARNs to grant access to
            
        Returns:
            IAM Role resource
        """
        resource_name = self.config.get_resource_name(f'lambda-role-{role_name}')
        
        # Lambda assume role policy
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Effect": "Allow"
            }]
        })
        
        role = aws.iam.Role(
            f"lambda-role-{role_name}",
            name=resource_name,
            assume_role_policy=assume_role_policy,
            description=f"Tightly scoped role for {role_name} Lambda function",
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        # Create inline policy for CloudWatch Logs (tightly scoped, not using managed policy)
        self._attach_cloudwatch_logs_policy(role, role_name)
        
        # Attach S3 policy if needed
        if s3_bucket_arns and s3_permissions:
            self._attach_s3_policy(role, role_name, s3_bucket_arns, s3_permissions)
        
        # Attach SSM policy if needed
        if ssm_parameter_arns:
            self._attach_ssm_policy(role, role_name, ssm_parameter_arns)
        
        self.roles[role_name] = role
        return role
    
    def _attach_cloudwatch_logs_policy(self, role: aws.iam.Role, role_name: str):
        """
        Attach tightly scoped CloudWatch Logs policy.
        
        This replaces the overly broad AWSLambdaBasicExecutionRole.
        """
        # Get region for ARN construction
        region = self.config.primary_region
        
        # Create policy that is scoped to specific log group
        log_group_name = f"/aws/lambda/{self.config.get_resource_name(f'function-{role_name}')}"
        
        # Build policy document as a plain JSON string
        policy_document = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup"
                    ],
                    "Resource": f"arn:aws:logs:{region}:*:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"arn:aws:logs:{region}:*:log-group:{log_group_name}:*"
                }
            ]
        })
        
        aws.iam.RolePolicy(
            f"lambda-role-{role_name}-cloudwatch-policy",
            role=role.id,
            policy=policy_document,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
    
    def _attach_s3_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        bucket_arns: List[Output[str]],
        permissions: List[str]
    ):
        """Attach tightly scoped S3 policy."""
        # Build resource list with both bucket and bucket/* ARNs
        def build_policy(arns):
            resources = []
            for arn in arns:
                resources.append(arn)
                resources.append(f"{arn}/*")
            
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": permissions,
                    "Resource": resources
                }]
            })
        
        policy_document = Output.all(*bucket_arns).apply(build_policy)
        
        aws.iam.RolePolicy(
            f"lambda-role-{role_name}-s3-policy",
            role=role.id,
            policy=policy_document,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
    
    def _attach_ssm_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        parameter_arns: List[Output[str]]
    ):
        """Attach tightly scoped SSM Parameter Store policy."""
        def build_policy(arns):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "ssm:GetParameter",
                        "ssm:GetParameters"
                    ],
                    "Resource": list(arns)
                }]
            })
        
        policy_document = Output.all(*parameter_arns).apply(build_policy)
        
        aws.iam.RolePolicy(
            f"lambda-role-{role_name}-ssm-policy",
            role=role.id,
            policy=policy_document,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
    
    def get_role(self, role_name: str) -> aws.iam.Role:
        """
        Get a role by name.
        
        Args:
            role_name: Role name identifier
            
        Returns:
            IAM Role resource
        """
        return self.roles[role_name]
    
    def get_role_arn(self, role_name: str) -> Output[str]:
        """
        Get role ARN.
        
        Args:
            role_name: Role name identifier
            
        Returns:
            Role ARN as Output
        """
        return self.roles[role_name].arn

