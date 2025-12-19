"""
IAM module for role and policy management.

This module creates and manages IAM roles with least-privilege policies
for Lambda functions and CodeBuild/CodePipeline.
"""

import json
from typing import List, Optional

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig


class IAMStack:
    """Manages IAM roles and policies with least-privilege access."""
    
    def __init__(self, config: ServerlessConfig, provider_manager: AWSProviderManager):
        """
        Initialize the IAM stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
    
    def create_lambda_role(
        self,
        function_name: str,
        dynamodb_table_arns: Optional[List[Output[str]]] = None,
        s3_bucket_arns: Optional[List[Output[str]]] = None,
        kms_key_arns: Optional[List[Output[str]]] = None,
        dlq_arn: Optional[Output[str]] = None,
        log_group_arn: Optional[Output[str]] = None
    ) -> aws.iam.Role:
        """
        Create IAM role for Lambda function with least-privilege permissions.
        
        Args:
            function_name: Name of the Lambda function
            dynamodb_table_arns: List of DynamoDB table ARNs
            s3_bucket_arns: List of S3 bucket ARNs
            kms_key_arns: List of KMS key ARNs
            dlq_arn: Dead letter queue ARN
            log_group_arn: CloudWatch log group ARN
            
        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name(f'lambda-role-{function_name}')
        
        assume_role_policy = json.dumps({
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'Service': 'lambda.amazonaws.com'},
                'Action': 'sts:AssumeRole'
            }]
        })
        
        role = aws.iam.Role(
            f'lambda-role-{function_name}',
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
                        's3:DeleteObject',
                        's3:ListBucket'
                    ],
                    'Resource': [arn for arn in arns] + [f'{arn}/*' for arn in arns]
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
        
        if self.config.enable_xray_tracing:
            policy_statements.append({
                'Effect': 'Allow',
                'Action': [
                    'xray:PutTraceSegments',
                    'xray:PutTelemetryRecords'
                ],
                'Resource': '*'
            })
        
        policy_statements.append({
            'Effect': 'Allow',
            'Action': [
                'ec2:CreateNetworkInterface',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DeleteNetworkInterface',
                'ec2:AssignPrivateIpAddresses',
                'ec2:UnassignPrivateIpAddresses'
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
                f'lambda-policy-{function_name}',
                name=self.config.get_resource_name(f'lambda-policy-{function_name}'),
                policy=policy_document,
                tags={
                    **self.config.get_common_tags(),
                    'Name': self.config.get_resource_name(f'lambda-policy-{function_name}')
                },
                opts=self.provider_manager.get_resource_options()
            )
            
            aws.iam.RolePolicyAttachment(
                f'lambda-policy-attachment-{function_name}',
                role=role.name,
                policy_arn=policy.arn,
                opts=self.provider_manager.get_resource_options(depends_on=[role, policy])
            )
        
        return role
    
    def create_codebuild_role(
        self,
        s3_bucket_arns: List[Output[str]],
        kms_key_arns: List[Output[str]]
    ) -> aws.iam.Role:
        """
        Create IAM role for CodeBuild with least-privilege permissions.
        
        Args:
            s3_bucket_arns: List of S3 bucket ARNs
            kms_key_arns: List of KMS key ARNs
            
        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name('codebuild-role')
        
        assume_role_policy = json.dumps({
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'Service': 'codebuild.amazonaws.com'},
                'Action': 'sts:AssumeRole'
            }]
        })
        
        role = aws.iam.Role(
            'codebuild-role',
            name=role_name,
            assume_role_policy=assume_role_policy,
            tags={
                **self.config.get_common_tags(),
                'Name': role_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        policy_statements = [
            {
                'Effect': 'Allow',
                'Action': [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents'
                ],
                'Resource': f'arn:aws:logs:{self.config.primary_region}:*:log-group:/aws/codebuild/*'
            }
        ]
        
        policy_statements.append(
            Output.all(*s3_bucket_arns).apply(lambda arns: {
                'Effect': 'Allow',
                'Action': [
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:PutObject'
                ],
                'Resource': [f'{arn}/*' for arn in arns]
            })
        )
        
        policy_statements.append(
            Output.all(*kms_key_arns).apply(lambda arns: {
                'Effect': 'Allow',
                'Action': [
                    'kms:Decrypt',
                    'kms:Encrypt',
                    'kms:GenerateDataKey'
                ],
                'Resource': list(arns)
            })
        )
        
        policy_document = Output.all(*policy_statements).apply(
            lambda statements: json.dumps({
                'Version': '2012-10-17',
                'Statement': statements
            })
        )
        
        policy = aws.iam.Policy(
            'codebuild-policy',
            name=self.config.get_resource_name('codebuild-policy'),
            policy=policy_document,
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('codebuild-policy')
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.iam.RolePolicyAttachment(
            'codebuild-policy-attachment',
            role=role.name,
            policy_arn=policy.arn,
            opts=self.provider_manager.get_resource_options(depends_on=[role, policy])
        )
        
        return role

