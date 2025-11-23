"""
IAM module for managing roles and policies with least-privilege principle.

This module creates IAM roles and policies for Lambda functions with
tightly scoped permissions for S3, SNS, and CloudWatch access.
"""

import json
from typing import List

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import ServerlessConfig


class IAMStack:
    """
    Manages IAM roles and policies for the serverless infrastructure.
    
    Implements least-privilege access with tightly scoped policies.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        parent: pulumi.Resource
    ):
        """
        Initialize IAM stack.
        
        Args:
            config: Serverless configuration
            provider: AWS provider instance
            parent: Parent resource for dependency management
        """
        self.config = config
        self.provider = provider
        self.parent = parent
        
        # Create Lambda execution role
        self.lambda_role = self._create_lambda_role()
    
    def _create_lambda_role(self) -> aws.iam.Role:
        """
        Create IAM role for Lambda function with least-privilege principle.
        
        Returns:
            IAM Role for Lambda execution
        """
        role_name = self.config.get_resource_name('lambda-role')
        
        # Trust policy for Lambda service
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        })
        
        role = aws.iam.Role(
            role_name,
            name=role_name,
            assume_role_policy=assume_role_policy,
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent,
                protect=True  # Prevent accidental deletion
            )
        )
        
        return role
    
    def attach_cloudwatch_logs_policy(self, log_group_arn: Output[str]):
        """
        Attach CloudWatch Logs policy with least-privilege access.
        
        Args:
            log_group_arn: ARN of the CloudWatch Log Group
        """
        policy_name = self.config.get_resource_name('lambda-logs-policy')
        
        # Tightly scoped CloudWatch Logs policy
        policy_document = log_group_arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": [
                    arn,
                    f"{arn}:*"
                ]
            }]
        }))
        
        policy = aws.iam.Policy(
            policy_name,
            name=policy_name,
            policy=policy_document,
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
        
        aws.iam.RolePolicyAttachment(
            f"{policy_name}-attachment",
            role=self.lambda_role.name,
            policy_arn=policy.arn,
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
    
    def attach_s3_policy(self, bucket_arn: Output[str]):
        """
        Attach S3 policy with least-privilege access.
        
        Args:
            bucket_arn: ARN of the S3 bucket
        """
        policy_name = self.config.get_resource_name('lambda-s3-policy')
        
        # Tightly scoped S3 policy
        policy_document = bucket_arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    arn,
                    f"{arn}/*"
                ]
            }]
        }))
        
        policy = aws.iam.Policy(
            policy_name,
            name=policy_name,
            policy=policy_document,
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
        
        aws.iam.RolePolicyAttachment(
            f"{policy_name}-attachment",
            role=self.lambda_role.name,
            policy_arn=policy.arn,
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
    
    def attach_sns_policy(self, topic_arn: Output[str]):
        """
        Attach SNS policy with least-privilege access.
        
        Args:
            topic_arn: ARN of the SNS topic
        """
        policy_name = self.config.get_resource_name('lambda-sns-policy')
        
        # Tightly scoped SNS policy
        policy_document = topic_arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "sns:Publish"
                ],
                "Resource": arn
            }]
        }))
        
        policy = aws.iam.Policy(
            policy_name,
            name=policy_name,
            policy=policy_document,
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
        
        aws.iam.RolePolicyAttachment(
            f"{policy_name}-attachment",
            role=self.lambda_role.name,
            policy_arn=policy.arn,
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
    
    def get_lambda_role_arn(self) -> Output[str]:
        """
        Get Lambda role ARN.
        
        Returns:
            Lambda role ARN as Output
        """
        return self.lambda_role.arn
    
    def get_lambda_role(self) -> aws.iam.Role:
        """
        Get Lambda role resource.
        
        Returns:
            Lambda IAM role
        """
        return self.lambda_role

