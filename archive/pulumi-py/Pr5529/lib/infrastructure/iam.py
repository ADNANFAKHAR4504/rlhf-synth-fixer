"""
IAM module for the serverless payment processing system.

This module creates tightly scoped IAM roles and policies for Lambda functions,
avoiding overly broad managed policies and ensuring least-privilege access.

Addresses Model Failure #4: IAM policies are over-broad / not least-privilege
"""

import json
from typing import Dict, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import PaymentProcessingConfig


class IAMStack:
    """
    Manages IAM roles and policies for Lambda functions.
    
    Creates tightly scoped IAM roles with minimal permissions,
    avoiding broad managed policies and Resource: "*" patterns.
    """
    
    def __init__(self, config: PaymentProcessingConfig, provider_manager: AWSProviderManager):
        """
        Initialize the IAM stack.
        
        Args:
            config: PaymentProcessingConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.roles: Dict[str, aws.iam.Role] = {}
        self.policies: Dict[str, aws.iam.RolePolicy] = {}
        self.account_id: Optional[Output[str]] = None
        self._get_account_id()
    
    def _get_account_id(self):
        """Get the AWS account ID."""
        caller_identity = aws.get_caller_identity()
        self.account_id = caller_identity.account_id
    
    def create_lambda_role(
        self,
        role_name: str,
        dynamodb_table_arn: Optional[Output[str]] = None,
        sqs_queue_arn: Optional[Output[str]] = None,
        enable_xray: bool = True
    ) -> aws.iam.Role:
        """
        Create a tightly scoped IAM role for a Lambda function.
        
        Args:
            role_name: Name identifier for the role
            dynamodb_table_arn: DynamoDB table ARN to grant access to
            sqs_queue_arn: SQS queue ARN to grant access to
            enable_xray: Whether to enable X-Ray tracing permissions
            
        Returns:
            IAM Role resource
        """
        resource_name = self.config.get_resource_name(f'role-{role_name}')
        
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
        
        opts = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider()
        ) if self.provider_manager.get_provider() else None
        
        role = aws.iam.Role(
            f"lambda-role-{role_name}",
            name=resource_name,
            assume_role_policy=assume_role_policy,
            description=f"Tightly scoped role for {role_name} Lambda function",
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self._attach_cloudwatch_logs_policy(role, role_name)
        
        if dynamodb_table_arn:
            self._attach_dynamodb_policy(role, role_name, dynamodb_table_arn)
        
        if sqs_queue_arn:
            self._attach_sqs_policy(role, role_name, sqs_queue_arn)
        
        if enable_xray:
            self._attach_xray_policy(role, role_name)
        
        self.roles[role_name] = role
        return role
    
    def _attach_cloudwatch_logs_policy(self, role: aws.iam.Role, role_name: str):
        """
        Attach tightly scoped CloudWatch Logs policy.
        
        This replaces the overly broad AWSLambdaBasicExecutionRole.
        Scoped to specific log group ARN instead of Resource: "*".
        """
        region = self.config.primary_region
        log_group_name = f"/aws/lambda/{self.config.get_resource_name(role_name)}"
        
        policy_document = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["logs:CreateLogGroup"],
                    "Resource": f"arn:aws:logs:{region}:{self.account_id}:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"arn:aws:logs:{region}:{self.account_id}:log-group:{log_group_name}:*"
                }
            ]
        })
        
        opts = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider()
        ) if self.provider_manager.get_provider() else None
        
        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-cloudwatch-policy",
            role=role.id,
            policy=policy_document,
            opts=opts
        )
        self.policies[f"{role_name}-cloudwatch"] = policy
    
    def _attach_dynamodb_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        table_arn: Output[str]
    ):
        """
        Attach tightly scoped DynamoDB policy.
        
        Scoped to specific table ARN instead of Resource: "*".
        """
        def create_policy(arn):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": [
                        arn,
                        f"{arn}/index/*"
                    ]
                }]
            })
        
        opts = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider()
        ) if self.provider_manager.get_provider() else None
        
        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-dynamodb-policy",
            role=role.id,
            policy=table_arn.apply(create_policy),
            opts=opts
        )
        self.policies[f"{role_name}-dynamodb"] = policy
    
    def _attach_sqs_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        queue_arn: Output[str]
    ):
        """
        Attach tightly scoped SQS policy.
        
        Scoped to specific queue ARN instead of Resource: "*".
        """
        def create_policy(arn):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": arn
                }]
            })
        
        opts = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider()
        ) if self.provider_manager.get_provider() else None
        
        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-sqs-policy",
            role=role.id,
            policy=queue_arn.apply(create_policy),
            opts=opts
        )
        self.policies[f"{role_name}-sqs"] = policy
    
    def _attach_xray_policy(self, role: aws.iam.Role, role_name: str):
        """
        Attach X-Ray tracing policy.
        
        Note: X-Ray requires Resource: "*" as it's a service-level permission.
        """
        policy_document = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords"
                ],
                "Resource": "*"
            }]
        })
        
        opts = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider()
        ) if self.provider_manager.get_provider() else None
        
        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-xray-policy",
            role=role.id,
            policy=policy_document,
            opts=opts
        )
        self.policies[f"{role_name}-xray"] = policy
    
    def get_role(self, role_name: str) -> aws.iam.Role:
        """Get a role by name."""
        return self.roles.get(role_name)
    
    def get_role_arn(self, role_name: str) -> Output[str]:
        """Get a role ARN by name."""
        role = self.roles.get(role_name)
        if role:
            return role.arn
        return Output.from_input("")

