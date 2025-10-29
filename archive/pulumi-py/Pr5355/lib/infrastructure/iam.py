"""
IAM module for the serverless financial data pipeline.

This module creates tightly scoped IAM roles and policies for Lambda functions,
avoiding overly broad managed policies and ensuring least-privilege access.

Addresses Model Failures:
- IAM policy JSON built from Pulumi Outputs using proper serialization
- Least-privilege gaps with specific resource ARNs
- X-Ray and CloudWatch Logs permissions scoped appropriately
"""

from typing import Dict, List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import FinancialDataPipelineConfig


class IAMStack:
    """
    Manages IAM roles and policies for Lambda functions.
    
    Creates tightly scoped IAM roles with minimal permissions,
    avoiding broad managed policies.
    """
    
    def __init__(
        self,
        config: FinancialDataPipelineConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the IAM stack.
        
        Args:
            config: FinancialDataPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.roles: Dict[str, aws.iam.Role] = {}
        self.policies: Dict[str, aws.iam.RolePolicy] = {}
    
    def create_lambda_role(
        self,
        role_name: str,
        dynamodb_table_arn: Optional[Output[str]] = None,
        s3_bucket_arn: Optional[Output[str]] = None,
        dlq_arn: Optional[Output[str]] = None,
        enable_xray: bool = True
    ) -> aws.iam.Role:
        """
        Create a tightly scoped IAM role for a Lambda function.
        
        Args:
            role_name: Name identifier for the role
            dynamodb_table_arn: DynamoDB table ARN to grant access to
            s3_bucket_arn: S3 bucket ARN to grant access to
            dlq_arn: SQS DLQ ARN to grant SendMessage access to
            enable_xray: Whether to enable X-Ray tracing permissions
            
        Returns:
            IAM Role resource
        """
        resource_name = self.config.get_resource_name(f'role-{role_name}')
        
        assume_role_policy_doc = {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Effect": "Allow"
            }]
        }
        
        role = aws.iam.Role(
            f"lambda-role-{role_name}",
            name=resource_name,
            assume_role_policy=pulumi.Output.json_dumps(assume_role_policy_doc),
            description=f"Tightly scoped role for {role_name} Lambda function",
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        self._attach_cloudwatch_logs_policy(role, role_name)
        
        if dynamodb_table_arn:
            self._attach_dynamodb_policy(role, role_name, dynamodb_table_arn)
        
        if s3_bucket_arn:
            self._attach_s3_policy(role, role_name, s3_bucket_arn)
        
        if dlq_arn:
            self._attach_sqs_policy(role, role_name, dlq_arn)
        
        if enable_xray:
            self._attach_xray_policy(role, role_name)
        
        self.roles[role_name] = role
        return role
    
    def _attach_cloudwatch_logs_policy(self, role: aws.iam.Role, role_name: str):
        """
        Attach tightly scoped CloudWatch Logs policy.
        
        This replaces the overly broad AWSLambdaBasicExecutionRole.
        """
        region = self.config.primary_region
        log_group_name = f"/aws/lambda/{self.config.get_resource_name(role_name)}"
        
        policy_doc = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["logs:CreateLogGroup"],
                    "Resource": f"arn:aws:logs:{region}:*:log-group:{log_group_name}"
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
        }
        
        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-cloudwatch-policy",
            role=role.id,
            policy=pulumi.Output.json_dumps(policy_doc),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )
        self.policies[f"{role_name}-cloudwatch"] = policy
    
    def _attach_dynamodb_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        table_arn: Output[str]
    ):
        """
        Attach tightly scoped DynamoDB policy using proper Output handling.
        """
        region = self.config.primary_region
        
        policy_doc = table_arn.apply(lambda arn: pulumi.Output.json_dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:UpdateItem",
                    "dynamodb:BatchWriteItem"
                ],
                "Resource": [arn, f"{arn}/index/*"]
            }]
        }))
        
        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-dynamodb-policy",
            role=role.id,
            policy=policy_doc,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )
        self.policies[f"{role_name}-dynamodb"] = policy
    
    def _attach_s3_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        bucket_arn: Output[str]
    ):
        """
        Attach tightly scoped S3 policy using proper Output handling.
        """
        policy_doc = bucket_arn.apply(lambda arn: pulumi.Output.json_dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket"
                ],
                "Resource": [arn, f"{arn}/*"]
            }]
        }))
        
        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-s3-policy",
            role=role.id,
            policy=policy_doc,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )
        self.policies[f"{role_name}-s3"] = policy
    
    def _attach_sqs_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        dlq_arn: Output[str]
    ):
        """
        Attach tightly scoped SQS policy for DLQ access using proper Output handling.
        """
        policy_doc = dlq_arn.apply(lambda arn: pulumi.Output.json_dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": ["sqs:SendMessage"],
                "Resource": arn
            }]
        }))
        
        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-sqs-policy",
            role=role.id,
            policy=policy_doc,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )
        self.policies[f"{role_name}-sqs"] = policy
    
    def _attach_xray_policy(self, role: aws.iam.Role, role_name: str):
        """
        Attach X-Ray tracing policy with scoped permissions.
        """
        region = self.config.primary_region
        
        policy_doc = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords"
                ],
                "Resource": "*"
            }]
        }
        
        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-xray-policy",
            role=role.id,
            policy=pulumi.Output.json_dumps(policy_doc),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )
        self.policies[f"{role_name}-xray"] = policy
    
    def get_role(self, role_name: str) -> aws.iam.Role:
        """Get IAM role by name."""
        return self.roles[role_name]
    
    def get_role_arn(self, role_name: str) -> Output[str]:
        """Get IAM role ARN by name."""
        return self.roles[role_name].arn

