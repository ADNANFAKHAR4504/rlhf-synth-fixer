"""
IAM module for the serverless transaction pipeline.

This module creates tightly scoped IAM roles and policies for Lambda functions,
avoiding overly broad managed policies and ensuring least-privilege access.

Addresses Model Failures:
- IAM policy construction with proper resource shapes
- Over-broad EventBridge policy (scoped to specific resources)
"""

import json
from typing import Dict, List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionPipelineConfig


class IAMStack:
    """
    Manages IAM roles and policies for Lambda functions.
    
    Creates tightly scoped IAM roles with minimal permissions,
    avoiding broad managed policies.
    """
    
    def __init__(self, config: TransactionPipelineConfig, provider_manager: AWSProviderManager):
        """
        Initialize the IAM stack.
        
        Args:
            config: TransactionPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.roles: Dict[str, aws.iam.Role] = {}
        self.policies: Dict[str, aws.iam.RolePolicy] = {}
    
    def create_lambda_role(
        self,
        role_name: str,
        dynamodb_table_arns: Optional[List[Output[str]]] = None,
        sqs_queue_arns: Optional[List[Output[str]]] = None,
        eventbridge_bus_arns: Optional[List[str]] = None,
        enable_xray: bool = True
    ) -> aws.iam.Role:
        """
        Create a tightly scoped IAM role for a Lambda function.
        
        Args:
            role_name: Name identifier for the role
            dynamodb_table_arns: List of DynamoDB table ARNs to grant access to
            sqs_queue_arns: List of SQS queue ARNs to grant access to
            eventbridge_bus_arns: List of EventBridge bus ARNs to grant access to
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
        
        self._attach_cloudwatch_logs_policy(role, role_name)
        
        if dynamodb_table_arns:
            self._attach_dynamodb_policy(role, role_name, dynamodb_table_arns)
        
        if sqs_queue_arns:
            self._attach_sqs_policy(role, role_name, sqs_queue_arns)
        
        if eventbridge_bus_arns:
            self._attach_eventbridge_policy(role, role_name, eventbridge_bus_arns)
        
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
        
        policy_document = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["logs:CreateLogGroup"],
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
        
        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-cloudwatch-policy",
            role=role.id,
            policy=policy_document,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        self.policies[f"{role_name}-cloudwatch"] = policy
    
    def _attach_dynamodb_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        table_arns: List[Output[str]]
    ):
        """
        Attach tightly scoped DynamoDB policy.
        
        Addresses Failure 5: Proper resource shape handling for IAM policies.
        """
        def build_policy(arns):
            resources = []
            for arn in arns:
                resources.append(arn)
                resources.append(f"{arn}/index/*")
            
            return json.dumps({
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
                    "Resource": resources
                }]
            })
        
        policy_document = Output.all(*table_arns).apply(build_policy)
        
        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-dynamodb-policy",
            role=role.id,
            policy=policy_document,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        self.policies[f"{role_name}-dynamodb"] = policy
    
    def _attach_sqs_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        queue_arns: List[Output[str]]
    ):
        """Attach tightly scoped SQS policy."""
        def build_policy(arns):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage",
                        "sqs:ReceiveMessage",
                        "sqs:DeleteMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": list(arns)
                }]
            })
        
        policy_document = Output.all(*queue_arns).apply(build_policy)
        
        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-sqs-policy",
            role=role.id,
            policy=policy_document,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        self.policies[f"{role_name}-sqs"] = policy
    
    def _attach_eventbridge_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        bus_arns: List[str]
    ):
        """
        Attach tightly scoped EventBridge policy.
        
        Addresses Failure 6: Over-broad EventBridge policy.
        Now scoped to specific event buses instead of Resource: "*".
        """
        policy_document = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": ["events:PutEvents"],
                "Resource": bus_arns
            }]
        })
        
        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-eventbridge-policy",
            role=role.id,
            policy=policy_document,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        self.policies[f"{role_name}-eventbridge"] = policy
    
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
        
        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-xray-policy",
            role=role.id,
            policy=policy_document,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        self.policies[f"{role_name}-xray"] = policy
    
    def create_eventbridge_sqs_role(self, event_bus_arn: str, queue_arns: List[Output[str]]) -> aws.iam.Role:
        """
        Create IAM role for EventBridge to send messages to SQS.
        
        Addresses Failure 4: EventBridge → SQS target missing role_arn.
        
        Args:
            event_bus_arn: EventBridge bus ARN
            queue_arns: List of SQS queue ARNs
            
        Returns:
            IAM Role for EventBridge
        """
        resource_name = self.config.get_resource_name('eb-sqs-role')
        
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {
                    "Service": "events.amazonaws.com"
                },
                "Effect": "Allow"
            }]
        })
        
        role = aws.iam.Role(
            "eventbridge-sqs-role",
            name=resource_name,
            assume_role_policy=assume_role_policy,
            description="Role for EventBridge to send messages to SQS",
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        def build_policy(arns):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": ["sqs:SendMessage"],
                    "Resource": list(arns)
                }]
            })
        
        policy_document = Output.all(*queue_arns).apply(build_policy)
        
        aws.iam.RolePolicy(
            "eventbridge-sqs-policy",
            role=role.id,
            policy=policy_document,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        self.roles['eventbridge-sqs'] = role
        return role
    
    def get_role(self, role_name: str) -> aws.iam.Role:
        """Get a role by name."""
        return self.roles[role_name]
    
    def get_role_arn(self, role_name: str) -> Output[str]:
        """Get role ARN."""
        return self.roles[role_name].arn

