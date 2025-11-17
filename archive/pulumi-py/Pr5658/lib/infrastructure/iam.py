"""
IAM module for least-privilege roles.

This module creates IAM roles and policies with strict least-privilege
access for Lambda functions, CodeBuild, and other services.
"""

import json
from typing import Dict, List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig


class IAMStack:
    """
    Manages IAM roles and policies with least-privilege access.
    
    Creates roles for Lambda, CodeBuild, and other services with
    scoped permissions.
    """
    
    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the IAM stack.
        
        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.roles: Dict[str, aws.iam.Role] = {}
        self.policies: Dict[str, aws.iam.Policy] = {}
    
    def create_lambda_role(
        self,
        function_name: str,
        log_group_arn: Optional[Output[str]] = None,
        s3_bucket_arns: Optional[List[Output[str]]] = None,
        kms_key_arns: Optional[List[Output[str]]] = None,
        dlq_arn: Optional[Output[str]] = None,
        enable_xray: bool = True
    ) -> aws.iam.Role:
        """
        Create IAM role for Lambda function with least-privilege permissions.
        
        Args:
            function_name: Name of the Lambda function
            log_group_arn: CloudWatch log group ARN
            s3_bucket_arns: List of S3 bucket ARNs
            kms_key_arns: List of KMS key ARNs
            dlq_arn: Dead letter queue ARN
            enable_xray: Enable X-Ray tracing permissions
        
        Returns:
            IAM Role
        """
        role_name = self.config.get_resource_name(f'{function_name}-role')
        
        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'Service': 'lambda.amazonaws.com'},
                'Action': 'sts:AssumeRole'
            }]
        }
        
        role = aws.iam.Role(
            f'{function_name}-role',
            name=role_name,
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                **self.config.get_common_tags(),
                'Name': role_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.iam.RolePolicyAttachment(
            f'{function_name}-vpc-execution-attachment',
            role=role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
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
        
        if kms_key_arns:
            policy_statements.append(
                Output.all(*kms_key_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'kms:Decrypt',
                        'kms:Encrypt',
                        'kms:GenerateDataKey'
                    ],
                    'Resource': arns
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
        
        if enable_xray:
            policy_statements.append({
                'Effect': 'Allow',
                'Action': [
                    'xray:PutTraceSegments',
                    'xray:PutTelemetryRecords'
                ],
                'Resource': ['*']
            })
        
        if policy_statements:
            Output.all(*policy_statements).apply(lambda statements: 
                aws.iam.RolePolicy(
                    f'{function_name}-policy',
                    role=role.id,
                    policy=json.dumps({
                        'Version': '2012-10-17',
                        'Statement': statements
                    }),
                    opts=self.provider_manager.get_resource_options()
                )
            )
        
        self.roles[function_name] = role
        return role
    
    def create_codebuild_role(
        self,
        s3_bucket_arns: List[Output[str]],
        kms_key_arns: List[Output[str]],
        lambda_function_arns: List[Output[str]]
    ) -> aws.iam.Role:
        """
        Create IAM role for CodeBuild with least-privilege permissions.
        
        Args:
            s3_bucket_arns: List of S3 bucket ARNs
            kms_key_arns: List of KMS key ARNs
            lambda_function_arns: List of Lambda function ARNs
        
        Returns:
            IAM Role
        """
        role_name = self.config.get_resource_name('codebuild-role')
        
        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'Service': 'codebuild.amazonaws.com'},
                'Action': 'sts:AssumeRole'
            }]
        }
        
        role = aws.iam.Role(
            'codebuild-role',
            name=role_name,
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                **self.config.get_common_tags(),
                'Name': role_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        Output.all(*s3_bucket_arns, *kms_key_arns, *lambda_function_arns).apply(
            lambda args: aws.iam.RolePolicy(
                'codebuild-policy',
                role=role.id,
                policy=json.dumps({
                    'Version': '2012-10-17',
                    'Statement': [
                        {
                            'Effect': 'Allow',
                            'Action': [
                                'logs:CreateLogGroup',
                                'logs:CreateLogStream',
                                'logs:PutLogEvents'
                            ],
                            'Resource': [
                                f'arn:aws:logs:{self.config.primary_region}:*:log-group:/aws/codebuild/{self.config.project_name}-*'
                            ]
                        },
                        {
                            'Effect': 'Allow',
                            'Action': [
                                's3:GetObject',
                                's3:PutObject',
                                's3:ListBucket'
                            ],
                            'Resource': [arn for arn in args[:len(s3_bucket_arns)]] + 
                                       [f'{arn}/*' for arn in args[:len(s3_bucket_arns)]]
                        },
                        {
                            'Effect': 'Allow',
                            'Action': [
                                'kms:Decrypt',
                                'kms:Encrypt',
                                'kms:GenerateDataKey'
                            ],
                            'Resource': args[len(s3_bucket_arns):len(s3_bucket_arns)+len(kms_key_arns)]
                        },
                        {
                            'Effect': 'Allow',
                            'Action': [
                                'lambda:UpdateFunctionCode',
                                'lambda:UpdateFunctionConfiguration',
                                'lambda:GetFunction'
                            ],
                            'Resource': args[len(s3_bucket_arns)+len(kms_key_arns):]
                        }
                    ]
                }),
                opts=self.provider_manager.get_resource_options()
            )
        )
        
        self.roles['codebuild'] = role
        return role
    
    def get_role(self, role_name: str) -> Optional[aws.iam.Role]:
        """Get role by name."""
        return self.roles.get(role_name)
    
    def get_role_arn(self, role_name: str) -> Output[str]:
        """Get role ARN."""
        role = self.roles.get(role_name)
        return role.arn if role else Output.from_input('')


