"""
CodePipeline module for managing CI/CD pipeline.

This module creates and configures CodePipeline with stages for
source, build, test, and deploy with proper encryption and permissions.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .codebuild import CodeBuildStack
from .codedeploy import CodeDeployStack
from .config import CICDConfig
from .iam import IAMStack
from .kms import KMSStack
from .s3 import S3Stack


class CodePipelineStack:
    """
    Manages CodePipeline for the CI/CD workflow.
    
    Creates a pipeline with source, build, test, and deploy stages
    with KMS encryption for artifacts.
    """
    
    def __init__(
        self,
        config: CICDConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        s3_stack: S3Stack,
        codebuild_stack: CodeBuildStack,
        codedeploy_stack: CodeDeployStack,
        kms_stack: KMSStack
    ):
        """
        Initialize the CodePipeline stack.
        
        Args:
            config: CICDConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            s3_stack: S3Stack instance
            codebuild_stack: CodeBuildStack instance
            codedeploy_stack: CodeDeployStack instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.s3_stack = s3_stack
        self.codebuild_stack = codebuild_stack
        self.codedeploy_stack = codedeploy_stack
        self.kms_stack = kms_stack
        self.pipelines: Dict[str, aws.codepipeline.Pipeline] = {}
        
        self._create_pipeline()
    
    def _create_pipeline(self):
        """Create the main CI/CD pipeline."""
        pipeline_name = 'main'
        resource_name = self.config.get_resource_name('pipeline')
        
        source_bucket_name = self.s3_stack.get_bucket_name('source')
        artifacts_bucket_name = self.s3_stack.get_bucket_name('artifacts')
        
        build_project_name = self.codebuild_stack.get_project_name('build')
        test_project_name = self.codebuild_stack.get_project_name('test')
        
        codedeploy_app_name = self.codedeploy_stack.get_application_name('lambda-deploy')
        codedeploy_group_name = self.codedeploy_stack.get_deployment_group_name('lambda-deploy')
        
        codebuild_project_arn = self.codebuild_stack.get_project_arn('build')
        codedeploy_app_arn = self.codedeploy_stack.get_application_arn('lambda-deploy')
        
        source_bucket_arn = self.s3_stack.get_bucket_arn('source')
        artifacts_bucket_arn = self.s3_stack.get_bucket_arn('artifacts')
        
        kms_key_arns = [
            self.kms_stack.get_key_arn('s3'),
            self.kms_stack.get_key_arn('lambda')
        ]
        
        role = self.iam_stack.create_codepipeline_role(
            pipeline_name,
            source_bucket_arn,
            artifacts_bucket_arn,
            codebuild_project_arn,
            codedeploy_app_arn,
            kms_key_arns
        )
        
        s3_key_id = self.kms_stack.get_key_id('s3')
        
        pipeline = aws.codepipeline.Pipeline(
            pipeline_name,
            name=resource_name,
            role_arn=role.arn,
            artifact_stores=[aws.codepipeline.PipelineArtifactStoreArgs(
                location=artifacts_bucket_name,
                type='S3',
                encryption_key=aws.codepipeline.PipelineArtifactStoreEncryptionKeyArgs(
                    id=s3_key_id,
                    type='KMS'
                )
            )],
            stages=[
                aws.codepipeline.PipelineStageArgs(
                    name='Source',
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name='SourceAction',
                            category='Source',
                            owner='AWS',
                            provider='S3',
                            version='1',
                            output_artifacts=['SourceOutput'],
                            configuration=Output.all(source_bucket_name).apply(
                                lambda args: {
                                    'S3Bucket': args[0],
                                    'S3ObjectKey': self.config.source_object_key,
                                    'PollForSourceChanges': 'false'
                                }
                            )
                        )
                    ]
                ),
                aws.codepipeline.PipelineStageArgs(
                    name='Build',
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name='BuildAction',
                            category='Build',
                            owner='AWS',
                            provider='CodeBuild',
                            version='1',
                            input_artifacts=['SourceOutput'],
                            output_artifacts=['BuildOutput'],
                            configuration=build_project_name.apply(
                                lambda name: {'ProjectName': name}
                            )
                        )
                    ]
                ),
                aws.codepipeline.PipelineStageArgs(
                    name='Test',
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name='TestAction',
                            category='Test',
                            owner='AWS',
                            provider='CodeBuild',
                            version='1',
                            input_artifacts=['BuildOutput'],
                            output_artifacts=['TestOutput'],
                            configuration=test_project_name.apply(
                                lambda name: {'ProjectName': name}
                            )
                        )
                    ]
                ),
                aws.codepipeline.PipelineStageArgs(
                    name='Deploy',
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name='DeployAction',
                            category='Deploy',
                            owner='AWS',
                            provider='CodeDeploy',
                            version='1',
                            input_artifacts=['TestOutput'],
                            configuration=Output.all(codedeploy_app_name, codedeploy_group_name).apply(
                                lambda args: {
                                    'ApplicationName': args[0],
                                    'DeploymentGroupName': args[1]
                                }
                            )
                        )
                    ]
                )
            ],
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': 'CI/CD pipeline'
            },
            opts=self.provider_manager.get_resource_options(depends_on=[role])
        )
        
        self.pipelines[pipeline_name] = pipeline
    
    def get_pipeline(self, pipeline_name: str) -> aws.codepipeline.Pipeline:
        """
        Get a pipeline by name.
        
        Args:
            pipeline_name: Name of the pipeline
            
        Returns:
            CodePipeline Pipeline resource
        """
        if pipeline_name not in self.pipelines:
            raise ValueError(f"Pipeline '{pipeline_name}' not found")
        return self.pipelines[pipeline_name]
    
    def get_pipeline_name(self, pipeline_name: str) -> Output[str]:
        """
        Get the name of a pipeline.
        
        Args:
            pipeline_name: Name of the pipeline
            
        Returns:
            Pipeline name as Output[str]
        """
        return self.get_pipeline(pipeline_name).name
    
    def get_pipeline_arn(self, pipeline_name: str) -> Output[str]:
        """
        Get the ARN of a pipeline.
        
        Args:
            pipeline_name: Name of the pipeline
            
        Returns:
            Pipeline ARN as Output[str]
        """
        return self.get_pipeline(pipeline_name).arn

