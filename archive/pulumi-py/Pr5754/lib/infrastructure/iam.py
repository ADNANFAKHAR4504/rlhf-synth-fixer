"""
IAM module for least-privilege roles.

This module creates IAM roles and policies with strict least-privilege
access for CodePipeline, CodeBuild, and Lambda functions.
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
    
    Creates roles for CodePipeline, CodeBuild, and Lambda with
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
    
    def create_codepipeline_role(
        self,
        s3_bucket_arns: List[Output[str]],
        kms_key_arns: List[Output[str]],
        codebuild_project_arns: List[Output[str]],
        lambda_function_arns: List[Output[str]],
        sns_topic_arns: List[Output[str]]
    ) -> aws.iam.Role:
        """
        Create IAM role for CodePipeline with least-privilege permissions.
        
        Args:
            s3_bucket_arns: List of S3 bucket ARNs
            kms_key_arns: List of KMS key ARNs
            codebuild_project_arns: List of CodeBuild project ARNs
            lambda_function_arns: List of Lambda function ARNs
            sns_topic_arns: List of SNS topic ARNs
        
        Returns:
            IAM Role
        """
        role_name = self.config.get_resource_name('codepipeline-role')
        
        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'Service': 'codepipeline.amazonaws.com'},
                'Action': 'sts:AssumeRole'
            }]
        }
        
        role = aws.iam.Role(
            'codepipeline-role',
            name=role_name,
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                **self.config.get_common_tags(),
                'Name': role_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        Output.all(*s3_bucket_arns, *kms_key_arns, *codebuild_project_arns, *lambda_function_arns, *sns_topic_arns).apply(
            lambda args: aws.iam.RolePolicy(
                'codepipeline-policy',
                role=role.id,
                policy=json.dumps({
                    'Version': '2012-10-17',
                    'Statement': [
                        {
                            'Effect': 'Allow',
                            'Action': [
                                's3:GetObject',
                                's3:GetObjectVersion',
                                's3:GetBucketVersioning',
                                's3:PutObject'
                            ],
                            'Resource': [arn for arn in args[:len(s3_bucket_arns)]] + 
                                       [f'{arn}/*' for arn in args[:len(s3_bucket_arns)]]
                        },
                        {
                            'Effect': 'Allow',
                            'Action': [
                                'kms:Decrypt',
                                'kms:Encrypt',
                                'kms:GenerateDataKey',
                                'kms:DescribeKey'
                            ],
                            'Resource': args[len(s3_bucket_arns):len(s3_bucket_arns)+len(kms_key_arns)]
                        },
                        {
                            'Effect': 'Allow',
                            'Action': [
                                'codebuild:BatchGetBuilds',
                                'codebuild:StartBuild'
                            ],
                            'Resource': args[len(s3_bucket_arns)+len(kms_key_arns):len(s3_bucket_arns)+len(kms_key_arns)+len(codebuild_project_arns)]
                        },
                        {
                            'Effect': 'Allow',
                            'Action': [
                                'lambda:InvokeFunction'
                            ],
                            'Resource': args[len(s3_bucket_arns)+len(kms_key_arns)+len(codebuild_project_arns):len(s3_bucket_arns)+len(kms_key_arns)+len(codebuild_project_arns)+len(lambda_function_arns)]
                        },
                        {
                            'Effect': 'Allow',
                            'Action': [
                                'sns:Publish'
                            ],
                            'Resource': args[len(s3_bucket_arns)+len(kms_key_arns)+len(codebuild_project_arns)+len(lambda_function_arns):]
                        }
                    ]
                }),
                opts=self.provider_manager.get_resource_options()
            )
        )
        
        self.roles['codepipeline'] = role
        return role
    
    def create_codebuild_role(
        self,
        project_name: str,
        s3_bucket_arns: List[Output[str]],
        kms_key_arns: List[Output[str]]
    ) -> aws.iam.Role:
        """
        Create IAM role for CodeBuild with least-privilege permissions.
        
        Args:
            project_name: Name of the CodeBuild project
            s3_bucket_arns: List of S3 bucket ARNs
            kms_key_arns: List of KMS key ARNs
        
        Returns:
            IAM Role
        """
        role_name = self.config.get_resource_name(f'{project_name}-codebuild-role')
        
        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'Service': 'codebuild.amazonaws.com'},
                'Action': 'sts:AssumeRole'
            }]
        }
        
        role = aws.iam.Role(
            f'{project_name}-codebuild-role',
            name=role_name,
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                **self.config.get_common_tags(),
                'Name': role_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        Output.all(*s3_bucket_arns, *kms_key_arns).apply(
            lambda args: aws.iam.RolePolicy(
                f'{project_name}-codebuild-policy',
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
                                f'arn:aws:logs:{self.config.primary_region}:{self.config.account_id}:log-group:/aws/codebuild/{self.config.project_name}-*',
                                f'arn:aws:logs:{self.config.primary_region}:{self.config.account_id}:log-group:/aws/codebuild/{self.config.project_name}-*:*'
                            ]
                        },
                        {
                            'Effect': 'Allow',
                            'Action': [
                                's3:GetObject',
                                's3:GetObjectVersion',
                                's3:PutObject'
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
                            'Resource': args[len(s3_bucket_arns):]
                        }
                    ]
                }),
                opts=self.provider_manager.get_resource_options()
            )
        )
        
        self.roles[f'{project_name}-codebuild'] = role
        return role
    
    def create_lambda_role(
        self,
        function_name: str,
        log_group_arn: Output[str],
        sns_topic_arns: Optional[List[Output[str]]] = None
    ) -> aws.iam.Role:
        """
        Create IAM role for Lambda function with least-privilege permissions.
        
        Args:
            function_name: Name of the Lambda function
            log_group_arn: CloudWatch log group ARN
            sns_topic_arns: Optional list of SNS topic ARNs
        
        Returns:
            IAM Role
        """
        role_name = self.config.get_resource_name(f'{function_name}-lambda-role')
        
        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'Service': 'lambda.amazonaws.com'},
                'Action': 'sts:AssumeRole'
            }]
        }
        
        role = aws.iam.Role(
            f'{function_name}-lambda-role',
            name=role_name,
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                **self.config.get_common_tags(),
                'Name': role_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        policy_statements = []
        
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
        
        if sns_topic_arns:
            policy_statements.append(
                Output.all(*sns_topic_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'sns:Publish'
                    ],
                    'Resource': arns
                })
            )
        
        policy_statements.append({
            'Effect': 'Allow',
            'Action': [
                'cloudwatch:PutMetricData'
            ],
            'Resource': '*',
            'Condition': {
                'StringEquals': {
                    'cloudwatch:namespace': 'CICDPipeline/Deployments'
                }
            }
        })
        
        Output.all(*policy_statements).apply(lambda statements: 
            aws.iam.RolePolicy(
                f'{function_name}-lambda-policy',
                role=role.id,
                policy=json.dumps({
                    'Version': '2012-10-17',
                    'Statement': statements
                }),
                opts=self.provider_manager.get_resource_options()
            )
        )
        
        self.roles[f'{function_name}-lambda'] = role
        return role
    
    def get_role(self, role_name: str) -> Optional[aws.iam.Role]:
        """Get role by name."""
        return self.roles.get(role_name)
    
    def get_role_arn(self, role_name: str) -> Output[str]:
        """Get role ARN."""
        role = self.roles.get(role_name)
        return role.arn if role else Output.from_input('')

