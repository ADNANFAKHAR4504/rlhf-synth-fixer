"""
IAM module for roles and policies with least privilege.

This module creates IAM roles and policies for Lambda functions and EventBridge,
ensuring proper Output handling to avoid invalid JSON policy documents.
"""

from typing import Dict, List

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MultiEnvConfig


class IAMStack:
    """
    Manages IAM roles and policies for the multi-environment infrastructure.
    
    Creates least-privilege roles for:
    - Lambda functions (S3 read, DynamoDB write)
    - EventBridge (SQS send, Lambda invoke)
    """
    
    def __init__(self, config: MultiEnvConfig, provider_manager: AWSProviderManager):
        """
        Initialize the IAM stack.
        
        Args:
            config: MultiEnvConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.roles: Dict[str, aws.iam.Role] = {}
    
    def create_lambda_role(
        self,
        name: str,
        s3_bucket_arns: List[Output[str]],
        dynamodb_table_arns: List[Output[str]],
        sqs_queue_arns: List[Output[str]]
    ) -> aws.iam.Role:
        """
        Create an IAM role for Lambda with least privilege access.
        
        Properly handles Pulumi Outputs to avoid invalid JSON policy documents.
        
        Args:
            name: Role name
            s3_bucket_arns: List of S3 bucket ARNs as Outputs
            dynamodb_table_arns: List of DynamoDB table ARNs as Outputs
            sqs_queue_arns: List of SQS queue ARNs as Outputs
        
        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name(name)
        
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        }
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        role = aws.iam.Role(
            f"{role_name}-role",
            name=role_name,
            assume_role_policy=pulumi.Output.json_dumps(assume_role_policy),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        aws.iam.RolePolicyAttachment(
            f"{role_name}-basic-execution",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=opts
        )
        
        Output.all(
            s3_arns=s3_bucket_arns,
            dynamodb_arns=dynamodb_table_arns,
            sqs_arns=sqs_queue_arns
        ).apply(lambda args: self._attach_lambda_policies(
            role,
            role_name,
            args['s3_arns'],
            args['dynamodb_arns'],
            args['sqs_arns'],
            opts
        ))
        
        self.roles[name] = role
        return role
    
    def _attach_lambda_policies(
        self,
        role: aws.iam.Role,
        role_name: str,
        s3_arns: List[str],
        dynamodb_arns: List[str],
        sqs_arns: List[str],
        opts: ResourceOptions
    ) -> None:
        """
        Attach inline policies to Lambda role.
        
        This method is called within an apply() to ensure all ARNs are resolved.
        
        Args:
            role: IAM Role resource
            role_name: Role name for resource naming
            s3_arns: Resolved S3 bucket ARNs
            dynamodb_arns: Resolved DynamoDB table ARNs
            sqs_arns: Resolved SQS queue ARNs
            opts: Resource options
        """
        s3_resources = s3_arns + [f"{arn}/*" for arn in s3_arns]
        
        s3_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:ListBucket"
                ],
                "Resource": s3_resources
            }]
        }
        
        aws.iam.RolePolicy(
            f"{role_name}-s3-access",
            role=role.name,
            policy=pulumi.Output.json_dumps(s3_policy),
            opts=opts
        )
        
        dynamodb_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                "Resource": dynamodb_arns
            }]
        }
        
        aws.iam.RolePolicy(
            f"{role_name}-dynamodb-access",
            role=role.name,
            policy=pulumi.Output.json_dumps(dynamodb_policy),
            opts=opts
        )
        
        if sqs_arns:
            sqs_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage",
                        "sqs:ReceiveMessage",
                        "sqs:DeleteMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": sqs_arns
                }]
            }
            
            aws.iam.RolePolicy(
                f"{role_name}-sqs-access",
                role=role.name,
                policy=pulumi.Output.json_dumps(sqs_policy),
                opts=opts
            )
    
    def create_eventbridge_role(
        self,
        name: str,
        target_arns: List[Output[str]]
    ) -> aws.iam.Role:
        """
        Create an IAM role for EventBridge to invoke targets.
        
        Args:
            name: Role name
            target_arns: List of target ARNs (Lambda, SQS) as Outputs
        
        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name(name)
        
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "events.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        }
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        role = aws.iam.Role(
            f"{role_name}-role",
            name=role_name,
            assume_role_policy=pulumi.Output.json_dumps(assume_role_policy),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        Output.all(target_arns=target_arns).apply(
            lambda args: self._attach_eventbridge_policy(
                role,
                role_name,
                args['target_arns'],
                opts
            )
        )
        
        self.roles[name] = role
        return role
    
    def _attach_eventbridge_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        target_arns: List[str],
        opts: ResourceOptions
    ) -> None:
        """
        Attach inline policy to EventBridge role.
        
        Args:
            role: IAM Role resource
            role_name: Role name for resource naming
            target_arns: Resolved target ARNs
            opts: Resource options
        """
        policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "lambda:InvokeFunction",
                    "sqs:SendMessage"
                ],
                "Resource": target_arns
            }]
        }
        
        aws.iam.RolePolicy(
            f"{role_name}-invoke-policy",
            role=role.name,
            policy=pulumi.Output.json_dumps(policy),
            opts=opts
        )
    
    def get_role(self, name: str) -> aws.iam.Role:
        """
        Get role by name.
        
        Args:
            name: Role name
        
        Returns:
            IAM Role resource
        """
        return self.roles.get(name)
    
    def get_role_arn(self, name: str) -> Output[str]:
        """
        Get role ARN by name.
        
        Args:
            name: Role name
        
        Returns:
            Role ARN as Output[str]
        """
        role = self.get_role(name)
        return role.arn if role else None

