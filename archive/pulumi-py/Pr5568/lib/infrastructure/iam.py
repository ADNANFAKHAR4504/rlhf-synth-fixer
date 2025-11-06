"""
IAM module for role and policy management.

This module creates IAM roles and policies with least-privilege principles,
proper scoping, and correct Pulumi Output handling.
"""

import json
from typing import Dict, List

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig


class IAMStack:
    """
    Manages IAM roles and policies.
    
    Creates roles with least-privilege policies, proper ARN scoping,
    and correct Output handling to avoid nested Output issues.
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
        self.account_id: str = aws.get_caller_identity().account_id
    
    def create_lambda_role(
        self,
        role_name: str,
        dynamodb_table_arns: List[Output[str]] = None,
        sqs_queue_arns: List[Output[str]] = None,
        kms_key_arns: List[Output[str]] = None,
        secrets_arns: List[Output[str]] = None,
        enable_xray: bool = True
    ) -> aws.iam.Role:
        """
        Create an IAM role for Lambda with least-privilege permissions.
        
        Args:
            role_name: Name of the role
            dynamodb_table_arns: List of DynamoDB table ARNs
            sqs_queue_arns: List of SQS queue ARNs
            kms_key_arns: List of KMS key ARNs
            secrets_arns: List of Secrets Manager ARNs
            enable_xray: Whether to enable X-Ray tracing
            
        Returns:
            IAM Role resource
        """
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }]
        })
        
        opts = self.provider_manager.get_resource_options()
        
        role = aws.iam.Role(
            f"lambda-role-{role_name}",
            assume_role_policy=assume_role_policy,
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self._attach_cloudwatch_logs_policy(role, role_name)
        
        if dynamodb_table_arns:
            self._attach_dynamodb_policy(role, role_name, dynamodb_table_arns)
        
        if sqs_queue_arns:
            self._attach_sqs_policy(role, role_name, sqs_queue_arns)
        
        if kms_key_arns:
            self._attach_kms_policy(role, role_name, kms_key_arns)
        
        if secrets_arns:
            self._attach_secrets_policy(role, role_name, secrets_arns)
        
        if enable_xray:
            self._attach_xray_policy(role, role_name)
        
        self.roles[role_name] = role
        return role
    
    def _attach_cloudwatch_logs_policy(self, role: aws.iam.Role, role_name: str):
        """Attach CloudWatch Logs policy with scoped permissions."""
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
        
        aws.iam.RolePolicy(
            f"lambda-role-{role_name}-logs-policy",
            role=role.id,
            policy=policy_document,
            opts=self.provider_manager.get_resource_options()
        )
    
    def _attach_dynamodb_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        table_arns: List[Output[str]]
    ):
        """Attach DynamoDB policy with scoped table ARNs."""
        def create_policy(arns):
            resources = []
            for arn in arns:
                resources.append(arn)
                resources.append(f"{arn}/index/*")
            
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                        "dynamodb:BatchGetItem",
                        "dynamodb:BatchWriteItem"
                    ],
                    "Resource": resources
                }]
            })
        
        policy = Output.all(*table_arns).apply(create_policy)
        
        aws.iam.RolePolicy(
            f"lambda-role-{role_name}-dynamodb-policy",
            role=role.id,
            policy=policy,
            opts=self.provider_manager.get_resource_options()
        )
    
    def _attach_sqs_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        queue_arns: List[Output[str]]
    ):
        """Attach SQS policy with scoped queue ARNs."""
        def create_policy(arns):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": list(arns)
                }]
            })
        
        policy = Output.all(*queue_arns).apply(create_policy)
        
        aws.iam.RolePolicy(
            f"lambda-role-{role_name}-sqs-policy",
            role=role.id,
            policy=policy,
            opts=self.provider_manager.get_resource_options()
        )
    
    def _attach_kms_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        key_arns: List[Output[str]]
    ):
        """Attach KMS policy with scoped key ARNs."""
        def create_policy(arns):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": list(arns)
                }]
            })
        
        policy = Output.all(*key_arns).apply(create_policy)
        
        aws.iam.RolePolicy(
            f"lambda-role-{role_name}-kms-policy",
            role=role.id,
            policy=policy,
            opts=self.provider_manager.get_resource_options()
        )
    
    def _attach_secrets_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        secret_arns: List[Output[str]]
    ):
        """Attach Secrets Manager policy with scoped secret ARNs."""
        def create_policy(arns):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": ["secretsmanager:GetSecretValue"],
                    "Resource": list(arns)
                }]
            })
        
        policy = Output.all(*secret_arns).apply(create_policy)
        
        aws.iam.RolePolicy(
            f"lambda-role-{role_name}-secrets-policy",
            role=role.id,
            policy=policy,
            opts=self.provider_manager.get_resource_options()
        )
    
    def _attach_xray_policy(self, role: aws.iam.Role, role_name: str):
        """Attach X-Ray tracing policy."""
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
        
        aws.iam.RolePolicy(
            f"lambda-role-{role_name}-xray-policy",
            role=role.id,
            policy=policy_document,
            opts=self.provider_manager.get_resource_options()
        )
    
    def create_step_functions_role(
        self,
        role_name: str,
        lambda_arns: List[Output[str]]
    ) -> aws.iam.Role:
        """
        Create an IAM role for Step Functions.
        
        Args:
            role_name: Name of the role
            lambda_arns: List of Lambda function ARNs to invoke
            
        Returns:
            IAM Role resource
        """
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "states.amazonaws.com"
                }
            }]
        })
        
        opts = self.provider_manager.get_resource_options()
        
        role = aws.iam.Role(
            f"step-functions-role-{role_name}",
            assume_role_policy=assume_role_policy,
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        def create_lambda_policy(arns):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": ["lambda:InvokeFunction"],
                    "Resource": list(arns)
                }]
            })
        
        policy = Output.all(*lambda_arns).apply(create_lambda_policy)
        
        aws.iam.RolePolicy(
            f"step-functions-role-{role_name}-lambda-policy",
            role=role.id,
            policy=policy,
            opts=opts
        )
        
        region = self.config.primary_region
        logs_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogDelivery",
                    "logs:GetLogDelivery",
                    "logs:UpdateLogDelivery",
                    "logs:DeleteLogDelivery",
                    "logs:ListLogDeliveries",
                    "logs:PutResourcePolicy",
                    "logs:DescribeResourcePolicies",
                    "logs:DescribeLogGroups"
                ],
                "Resource": "*"
            }]
        })
        
        aws.iam.RolePolicy(
            f"step-functions-role-{role_name}-logs-policy",
            role=role.id,
            policy=logs_policy,
            opts=opts
        )
        
        self.roles[role_name] = role
        return role
    
    def get_role(self, role_name: str) -> aws.iam.Role:
        """
        Get a role by name.
        
        Args:
            role_name: Name of the role
            
        Returns:
            IAM Role resource
        """
        return self.roles.get(role_name)

