"""
CI/CD module with CodeBuild and S3-based artifact management.

This module creates CodeBuild projects for building and deploying
Lambda functions using S3 for source and artifact storage.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig
from .iam import IAMStack
from .lambda_functions import LambdaStack
from .storage import StorageStack


class CICDStack:
    """
    Manages CI/CD resources using CodeBuild and S3.
    
    Creates CodeBuild projects for building and deploying Lambda functions
    without requiring CodePipeline or CodeCommit.
    """
    
    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        storage_stack: StorageStack,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the CI/CD stack.
        
        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            storage_stack: StorageStack instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.storage_stack = storage_stack
        self.lambda_stack = lambda_stack
        self.build_projects = {}
        
        self._create_build_project()
    
    def _create_build_project(self):
        """Create CodeBuild project for Lambda deployment."""
        project_name = self.config.get_resource_name('build')
        
        function_name = 'pipeline-handler'
        
        role = self.iam_stack.create_codebuild_role(
            s3_bucket_arns=[
                self.storage_stack.get_bucket_arn('artifacts'),
                self.storage_stack.get_bucket_arn('logs')
            ],
            kms_key_arns=[self.storage_stack.get_kms_key_arn('s3')],
            lambda_function_arns=[self.lambda_stack.get_function_arn(function_name)]
        )
        
        buildspec_content = """version: 0.2

phases:
  install:
    runtime-versions:
      python: 3.11
    commands:
      - echo "Installing dependencies..."
      - pip install --upgrade pip
  
  build:
    commands:
      - echo "Building Lambda package..."
      - cd lambda_code
      - zip -r ../lambda-package.zip .
      - cd ..
      - echo "Build completed"
  
  post_build:
    commands:
      - echo "Uploading artifact to S3..."
      - aws s3 cp lambda-package.zip s3://${ARTIFACT_BUCKET}/builds/lambda-package-$(date +%Y%m%d-%H%M%S).zip
      - echo "Updating Lambda function..."
      - aws lambda update-function-code --function-name ${LAMBDA_FUNCTION_NAME} --zip-file fileb://lambda-package.zip
      - echo "Deployment completed"

artifacts:
  files:
    - lambda-package.zip
  name: lambda-package
"""
        
        build_project = aws.codebuild.Project(
            'build-project',
            name=project_name,
            description=f'Build project for {self.config.project_name}',
            service_role=role.arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type='S3',
                location=self.storage_stack.get_bucket_name('artifacts'),
                path='builds',
                namespace_type='BUILD_ID',
                packaging='ZIP',
                encryption_disabled=False
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type='BUILD_GENERAL1_SMALL',
                image='aws/codebuild/standard:7.0',
                type='LINUX_CONTAINER',
                environment_variables=[
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name='ARTIFACT_BUCKET',
                        value=self.storage_stack.get_bucket_name('artifacts')
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name='LAMBDA_FUNCTION_NAME',
                        value=self.lambda_stack.get_function_name(function_name)
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name='ENVIRONMENT',
                        value=self.config.environment
                    )
                ]
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type='S3',
                location=Output.concat(
                    self.storage_stack.get_bucket_name('artifacts'),
                    '/source/source.zip'
                ),
                buildspec=buildspec_content
            ),
            logs_config=aws.codebuild.ProjectLogsConfigArgs(
                cloudwatch_logs=aws.codebuild.ProjectLogsConfigCloudwatchLogsArgs(
                    status='ENABLED',
                    group_name=f'/aws/codebuild/{project_name}'
                ),
                s3_logs=aws.codebuild.ProjectLogsConfigS3LogsArgs(
                    status='ENABLED',
                    location=Output.concat(
                        self.storage_stack.get_bucket_name('logs'),
                        '/codebuild'
                    ),
                    encryption_disabled=False
                )
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': project_name
            },
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )
        
        log_group = aws.cloudwatch.LogGroup(
            'build-log-group',
            name=f'/aws/codebuild/{project_name}',
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': f'/aws/codebuild/{project_name}'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.build_projects['lambda-build'] = build_project
    
    def get_build_project_name(self, project_key: str) -> Output[str]:
        """Get build project name."""
        project = self.build_projects.get(project_key)
        return project.name if project else Output.from_input('')
    
    def get_build_project_arn(self, project_key: str) -> Output[str]:
        """Get build project ARN."""
        project = self.build_projects.get(project_key)
        return project.arn if project else Output.from_input('')


