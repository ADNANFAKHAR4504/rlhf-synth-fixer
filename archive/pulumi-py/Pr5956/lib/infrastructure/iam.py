"""
IAM module for managing roles and policies.

This module creates and manages IAM roles and policies with strict least-privilege
principles for Lambda, CodeBuild, CodePipeline, and CodeDeploy services.
"""

import json
from typing import List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDConfig


class IAMStack:
    """
    Manages IAM roles and policies for CI/CD pipeline.
    
    Creates least-privilege IAM roles for all services with
    properly scoped permissions.
    """
    
    def __init__(self, config: CICDConfig, provider_manager: AWSProviderManager):
        """
        Initialize the IAM stack.
        
        Args:
            config: CICDConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.roles = {}
    
    def create_lambda_role(
        self,
        function_name: str,
        log_group_arn: Output[str],
        kms_key_arn: Output[str]
    ) -> aws.iam.Role:
        """
        Create an IAM role for Lambda function.
        
        Args:
            function_name: Name of the Lambda function
            log_group_arn: ARN of the CloudWatch log group
            kms_key_arn: ARN of the KMS key
            
        Returns:
            IAM Role resource
        """
        resource_name = self.config.get_resource_name(f'{function_name}-lambda-role', include_region=False)
        
        role = aws.iam.Role(
            f'{function_name}-lambda-role',
            name=resource_name,
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Action': 'sts:AssumeRole',
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': 'lambda.amazonaws.com'
                    }
                }]
            }),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': f'Lambda execution role for {function_name}'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        policy_document = Output.all(log_group_arn, kms_key_arn).apply(
            lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'logs:CreateLogStream',
                            'logs:PutLogEvents'
                        ],
                        'Resource': [args[0], f'{args[0]}:*']
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'kms:Decrypt',
                            'kms:DescribeKey'
                        ],
                        'Resource': args[1]
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'xray:PutTraceSegments',
                            'xray:PutTelemetryRecords'
                        ],
                        'Resource': '*'
                    }
                ]
            })
        )
        
        aws.iam.RolePolicy(
            f'{function_name}-lambda-policy',
            role=role.id,
            policy=policy_document,
            opts=self.provider_manager.get_resource_options(depends_on=[role])
        )
        
        self.roles[f'{function_name}-lambda'] = role
        return role
    
    def create_codebuild_role(
        self,
        project_name: str,
        source_bucket_arn: Output[str],
        artifacts_bucket_arn: Output[str],
        lambda_arn: Output[str],
        kms_key_arns: List[Output[str]]
    ) -> aws.iam.Role:
        """
        Create an IAM role for CodeBuild project.
        
        Args:
            project_name: Name of the CodeBuild project
            source_bucket_arn: ARN of the source bucket
            artifacts_bucket_arn: ARN of the artifacts bucket
            lambda_arn: ARN of the Lambda function
            kms_key_arns: List of KMS key ARNs
            
        Returns:
            IAM Role resource
        """
        resource_name = self.config.get_resource_name(f'{project_name}-codebuild-role', include_region=False)
        
        role = aws.iam.Role(
            f'{project_name}-codebuild-role',
            name=resource_name,
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': 'codebuild.amazonaws.com'
                    },
                    'Action': 'sts:AssumeRole'
                }]
            }),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': f'CodeBuild execution role for {project_name}'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        policy_document = Output.all(
            source_bucket_arn,
            artifacts_bucket_arn,
            lambda_arn,
            *kms_key_arns
        ).apply(
            lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Action': [
                            's3:GetObject',
                            's3:GetObjectVersion',
                            's3:PutObject'
                        ],
                        'Resource': [
                            f'{args[0]}/*',
                            f'{args[1]}/*'
                        ]
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            's3:GetBucketVersioning',
                            's3:ListBucket'
                        ],
                        'Resource': [args[0], args[1]]
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'logs:CreateLogGroup',
                            'logs:CreateLogStream',
                            'logs:PutLogEvents'
                        ],
                        'Resource': f'arn:aws:logs:{self.config.primary_region}:*:log-group:/aws/codebuild/{project_name}*'
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'lambda:UpdateFunctionCode',
                            'lambda:GetFunction',
                            'lambda:PublishVersion'
                        ],
                        'Resource': [args[2], f'{args[2]}:*']
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'kms:Decrypt',
                            'kms:GenerateDataKey',
                            'kms:DescribeKey'
                        ],
                        'Resource': list(args[3:])
                    }
                ]
            })
        )
        
        aws.iam.RolePolicy(
            f'{project_name}-codebuild-policy',
            role=role.id,
            policy=policy_document,
            opts=self.provider_manager.get_resource_options(depends_on=[role])
        )
        
        self.roles[f'{project_name}-codebuild'] = role
        return role
    
    def create_codepipeline_role(
        self,
        pipeline_name: str,
        source_bucket_arn: Output[str],
        artifacts_bucket_arn: Output[str],
        codebuild_project_arn: Output[str],
        codedeploy_app_arn: Output[str],
        kms_key_arns: List[Output[str]]
    ) -> aws.iam.Role:
        """
        Create an IAM role for CodePipeline.
        
        Args:
            pipeline_name: Name of the pipeline
            source_bucket_arn: ARN of the source bucket
            artifacts_bucket_arn: ARN of the artifacts bucket
            codebuild_project_arn: ARN of the CodeBuild project
            codedeploy_app_arn: ARN of the CodeDeploy application
            kms_key_arns: List of KMS key ARNs
            
        Returns:
            IAM Role resource
        """
        resource_name = self.config.get_resource_name(f'{pipeline_name}-codepipeline-role', include_region=False)
        
        role = aws.iam.Role(
            f'{pipeline_name}-codepipeline-role',
            name=resource_name,
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': 'codepipeline.amazonaws.com'
                    },
                    'Action': 'sts:AssumeRole'
                }]
            }),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': f'CodePipeline execution role for {pipeline_name}'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        policy_document = Output.all(
            source_bucket_arn,
            artifacts_bucket_arn,
            codebuild_project_arn,
            codedeploy_app_arn,
            *kms_key_arns
        ).apply(
            lambda args: json.dumps({
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
                        'Resource': [
                            f'{args[0]}/*',
                            f'{args[1]}/*',
                            args[0],
                            args[1]
                        ]
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'codebuild:BatchGetBuilds',
                            'codebuild:StartBuild'
                        ],
                        'Resource': args[2]
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'codedeploy:CreateDeployment',
                            'codedeploy:GetDeployment',
                            'codedeploy:GetDeploymentConfig',
                            'codedeploy:GetApplication',
                            'codedeploy:GetApplicationRevision',
                            'codedeploy:RegisterApplicationRevision'
                        ],
                        'Resource': [args[3], f'{args[3]}/*']
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'kms:Decrypt',
                            'kms:GenerateDataKey',
                            'kms:DescribeKey'
                        ],
                        'Resource': list(args[4:])
                    }
                ]
            })
        )
        
        aws.iam.RolePolicy(
            f'{pipeline_name}-codepipeline-policy',
            role=role.id,
            policy=policy_document,
            opts=self.provider_manager.get_resource_options(depends_on=[role])
        )
        
        self.roles[f'{pipeline_name}-codepipeline'] = role
        return role
    
    def create_codedeploy_role(self, app_name: str) -> aws.iam.Role:
        """
        Create an IAM role for CodeDeploy.
        
        Args:
            app_name: Name of the CodeDeploy application
            
        Returns:
            IAM Role resource
        """
        resource_name = self.config.get_resource_name(f'{app_name}-codedeploy-role', include_region=False)
        
        role = aws.iam.Role(
            f'{app_name}-codedeploy-role',
            name=resource_name,
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': 'codedeploy.amazonaws.com'
                    },
                    'Action': 'sts:AssumeRole'
                }]
            }),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': f'CodeDeploy execution role for {app_name}'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.iam.RolePolicyAttachment(
            f'{app_name}-codedeploy-policy-attachment',
            role=role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSCodeDeployRoleForLambda',
            opts=self.provider_manager.get_resource_options(depends_on=[role])
        )
        
        self.roles[f'{app_name}-codedeploy'] = role
        return role
    
    def get_role(self, role_name: str) -> aws.iam.Role:
        """
        Get an IAM role by name.
        
        Args:
            role_name: Name of the role
            
        Returns:
            IAM Role resource
        """
        if role_name not in self.roles:
            raise ValueError(f"Role '{role_name}' not found")
        return self.roles[role_name]

