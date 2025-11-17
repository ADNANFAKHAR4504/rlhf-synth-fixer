"""
CI/CD module.

This module creates and manages CodePipeline for automated deployment
with S3 source and CodeBuild for building and deploying.
"""

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .iam import IAMStack
from .kms import KMSStack
from .s3 import S3Stack


class CICDStack:
    """Manages CodePipeline for CI/CD automation."""
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        s3_stack: S3Stack,
        kms_stack: KMSStack
    ):
        """
        Initialize the CI/CD stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            s3_stack: S3Stack instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.s3_stack = s3_stack
        self.kms_stack = kms_stack
        
        self._create_codebuild_project()
    
    def _create_codebuild_project(self):
        """Create CodeBuild project for deployment."""
        project_name = self.config.get_resource_name('codebuild')
        
        role = self.iam_stack.create_codebuild_role(
            s3_bucket_arns=[self.s3_stack.get_bucket_arn('pipeline-artifacts')],
            kms_key_arns=[self.kms_stack.get_key_arn('s3')]
        )
        
        self.codebuild_project = aws.codebuild.Project(
            'codebuild-project',
            name=project_name,
            service_role=role.arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type='S3',
                location=self.s3_stack.get_bucket_name('pipeline-artifacts'),
                path='builds/',
                namespace_type='BUILD_ID',
                packaging='ZIP'
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type='BUILD_GENERAL1_SMALL',
                image='aws/codebuild/standard:7.0',
                type='LINUX_CONTAINER',
                environment_variables=[
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name='ENVIRONMENT',
                        value=self.config.environment
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name='REGION',
                        value=self.config.primary_region
                    )
                ]
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type='S3',
                location=Output.concat(
                    self.s3_stack.get_bucket_name('pipeline-artifacts'),
                    '/source/source.zip'
                )
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': project_name
            },
            opts=self.provider_manager.get_resource_options(depends_on=[role])
        )
    
    def get_codebuild_project_name(self) -> Output[str]:
        """Get CodeBuild project name."""
        return self.codebuild_project.name

