"""
IAM module for managing roles and policies.

This module creates IAM roles with least-privilege policies,
scoping all permissions to specific resource ARNs.
"""

import json
from typing import List, Optional

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionConfig


class IAMStack:
    """Manages IAM roles and policies with least-privilege access."""
    
    def __init__(
        self,
        config: TransactionConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the IAM stack.
        
        Args:
            config: TransactionConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
    
    def create_lambda_role(
        self,
        function_name: str,
        log_group_arn: Optional[Output[str]] = None,
        dynamodb_table_arns: Optional[List[Output[str]]] = None,
        sqs_queue_arns: Optional[List[Output[str]]] = None,
        dlq_arn: Optional[Output[str]] = None,
        kms_key_arns: Optional[List[Output[str]]] = None,
        s3_bucket_arns: Optional[List[Output[str]]] = None,
        enable_xray: bool = True
    ) -> aws.iam.Role:
        """
        Create an IAM role for a Lambda function with scoped permissions.
        
        Args:
            function_name: Name of the Lambda function
            log_group_arn: CloudWatch Logs group ARN
            dynamodb_table_arns: List of DynamoDB table ARNs
            sqs_queue_arns: List of SQS queue ARNs
            dlq_arn: Dead letter queue ARN
            kms_key_arns: List of KMS key ARNs
            s3_bucket_arns: List of S3 bucket ARNs
            enable_xray: Whether to enable X-Ray tracing
            
        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name(f'{function_name}-role')
        policy_name = self.config.get_resource_name(f'{function_name}-policy')
        
        assume_role_policy = json.dumps({
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {
                    'Service': 'lambda.amazonaws.com'
                },
                'Action': 'sts:AssumeRole'
            }]
        })
        
        role = aws.iam.Role(
            f'{function_name}-role',
            name=role_name,
            assume_role_policy=assume_role_policy,
            tags={
                **self.config.get_common_tags(),
                'Name': role_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        policy_statements = []
        
        if log_group_arn:
            policy_statements.append(
                Output.all(log_group_arn).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'logs:CreateLogStream',
                        'logs:PutLogEvents'
                    ],
                    'Resource': [arns[0], f'{arns[0]}:*']
                })
            )
        
        if dynamodb_table_arns:
            policy_statements.append(
                Output.all(*dynamodb_table_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'dynamodb:GetItem',
                        'dynamodb:PutItem',
                        'dynamodb:UpdateItem',
                        'dynamodb:DeleteItem',
                        'dynamodb:Query',
                        'dynamodb:Scan'
                    ],
                    'Resource': [arn for arn in arns] + [f'{arn}/index/*' for arn in arns]
                })
            )
        
        if sqs_queue_arns:
            policy_statements.append(
                Output.all(*sqs_queue_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'sqs:SendMessage',
                        'sqs:GetQueueAttributes',
                        'sqs:ReceiveMessage',
                        'sqs:DeleteMessage',
                        'sqs:GetQueueUrl'
                    ],
                    'Resource': list(arns)
                })
            )
        
        if dlq_arn:
            policy_statements.append(
                Output.all(dlq_arn).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'sqs:SendMessage',
                        'sqs:GetQueueAttributes'
                    ],
                    'Resource': [arns[0]]
                })
            )
        
        if kms_key_arns:
            policy_statements.append(
                Output.all(*kms_key_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'kms:Decrypt',
                        'kms:Encrypt',
                        'kms:GenerateDataKey',
                        'kms:DescribeKey'
                    ],
                    'Resource': list(arns)
                })
            )
        
        if s3_bucket_arns:
            policy_statements.append(
                Output.all(*s3_bucket_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        's3:GetObject',
                        's3:PutObject',
                        's3:ListBucket'
                    ],
                    'Resource': [arn for arn in arns] + [f'{arn}/*' for arn in arns]
                })
            )
        
        if enable_xray:
            policy_statements.append({
                'Effect': 'Allow',
                'Action': [
                    'xray:PutTraceSegments',
                    'xray:PutTelemetryRecords'
                ],
                'Resource': '*'
            })
        
        # Add CloudWatch PutMetricData permission for custom metrics
        policy_statements.append({
            'Effect': 'Allow',
            'Action': [
                'cloudwatch:PutMetricData'
            ],
            'Resource': '*'
        })
        
        if policy_statements:
            policy_document = Output.all(*policy_statements).apply(
                lambda statements: json.dumps({
                    'Version': '2012-10-17',
                    'Statement': statements
                })
            )
            
            policy = aws.iam.Policy(
                f'{function_name}-policy',
                name=policy_name,
                policy=policy_document,
                tags={
                    **self.config.get_common_tags(),
                    'Name': policy_name
                },
                opts=self.provider_manager.get_resource_options()
            )
            
            aws.iam.RolePolicyAttachment(
                f'{function_name}-policy-attachment',
                role=role.name,
                policy_arn=policy.arn,
                opts=self.provider_manager.get_resource_options()
            )
        
        return role
