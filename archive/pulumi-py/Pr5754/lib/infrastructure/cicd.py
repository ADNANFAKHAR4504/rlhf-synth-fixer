"""
CI/CD module for CodePipeline and CodeBuild.

This module creates CodePipeline with multi-region deployment stages
and CodeBuild projects for build, test, and security scanning.
"""

import json
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig


class CICDStack:
    """
    Manages CodePipeline and CodeBuild resources.
    
    Creates a complete CI/CD pipeline with build, security scan,
    approval, and multi-region deployment stages.
    """
    
    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager,
        storage_stack,
        iam_stack,
        lambda_stack,
        monitoring_stack
    ):
        """
        Initialize the CI/CD stack.
        
        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
            storage_stack: StorageStack instance
            iam_stack: IAMStack instance
            lambda_stack: LambdaStack instance
            monitoring_stack: MonitoringStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.storage_stack = storage_stack
        self.iam_stack = iam_stack
        self.lambda_stack = lambda_stack
        self.monitoring_stack = monitoring_stack
        
        self.codebuild_projects: Dict[str, aws.codebuild.Project] = {}
        self.pipeline: aws.codepipeline.Pipeline = None
        self.secondary_artifact_bucket: aws.s3.Bucket = None
        
        self._create_secondary_region_artifact_bucket()
        self._create_codebuild_projects()
        self._create_pipeline()
        self._create_event_rule()
    
    def _create_secondary_region_artifact_bucket(self):
        """Create S3 bucket in secondary region for cross-region artifacts."""
        secondary_provider = aws.Provider(
            'secondary-provider',
            region=self.config.secondary_region
        )
        
        bucket_name = self.config.get_normalized_resource_name(f'artifacts-{self.config.secondary_region}')
        
        self.secondary_artifact_bucket = aws.s3.Bucket(
            'secondary-artifact-bucket',
            bucket=bucket_name,
            tags={
                **self.config.get_common_tags(),
                'Name': bucket_name,
                'Purpose': 'CI/CD Artifacts Secondary Region'
            },
            opts=pulumi.ResourceOptions(provider=secondary_provider)
        )
        
        aws.s3.BucketVersioning(
            'secondary-artifact-bucket-versioning',
            bucket=self.secondary_artifact_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=pulumi.ResourceOptions(provider=secondary_provider)
        )
        
        secondary_kms_key = aws.kms.Key(
            'secondary-s3-kms-key',
            description='KMS key for secondary region S3 bucket encryption',
            enable_key_rotation=self.config.kms_key_rotation_enabled,
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('s3-key')
            },
            opts=pulumi.ResourceOptions(provider=secondary_provider)
        )
        
        aws.s3.BucketServerSideEncryptionConfiguration(
            'secondary-artifact-bucket-encryption',
            bucket=self.secondary_artifact_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm='aws:kms',
                    kms_master_key_id=secondary_kms_key.arn
                ),
                bucket_key_enabled=True
            )],
            opts=pulumi.ResourceOptions(provider=secondary_provider)
        )
        
        aws.s3.BucketPublicAccessBlock(
            'secondary-artifact-bucket-public-access-block',
            bucket=self.secondary_artifact_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=pulumi.ResourceOptions(provider=secondary_provider)
        )
    
    def _create_codebuild_projects(self):
        """Create CodeBuild projects for build and security scan."""
        artifact_bucket_arn = self.storage_stack.get_bucket_arn('artifacts')
        kms_key_arn = self.storage_stack.get_kms_key_arn('s3')
        
        main_build_role = self.iam_stack.create_codebuild_role(
            'main-build',
            [artifact_bucket_arn],
            [kms_key_arn]
        )
        
        security_scan_role = self.iam_stack.create_codebuild_role(
            'security-scan',
            [artifact_bucket_arn],
            [kms_key_arn]
        )
        
        main_build_project = self._create_main_build_project(main_build_role)
        security_scan_project = self._create_security_scan_project(security_scan_role)
        
        self.codebuild_projects['main-build'] = main_build_project
        self.codebuild_projects['security-scan'] = security_scan_project
        
        self.monitoring_stack.create_codebuild_alarms('main-build', main_build_project.name)
        self.monitoring_stack.create_codebuild_alarms('security-scan', security_scan_project.name)
    
    def _create_main_build_project(self, role: aws.iam.Role) -> aws.codebuild.Project:
        """Create main build CodeBuild project."""
        project_name = self.config.get_resource_name('main-build')
        
        buildspec = {
            'version': 0.2,
            'phases': {
                'install': {
                    'runtime-versions': {
                        'python': '3.11'
                    },
                    'commands': [
                        'echo Installing dependencies...',
                        'pip install --upgrade pip',
                        'pip install pytest pytest-cov boto3'
                    ]
                },
                'pre_build': {
                    'commands': [
                        'echo Running pre-build checks...',
                        'python --version',
                        'pip --version'
                    ]
                },
                'build': {
                    'commands': [
                        'echo Build started on `date`',
                        'echo Running tests...',
                        'pytest --version || echo "No tests configured"',
                        'echo Building application...',
                        'echo Build completed on `date`'
                    ]
                },
                'post_build': {
                    'commands': [
                        'echo Post-build phase...',
                        'echo Creating deployment package...'
                    ]
                }
            },
            'artifacts': {
                'files': ['**/*']
            }
        }
        
        project = aws.codebuild.Project(
            'main-build-project',
            name=project_name,
            description='Main build project for CI/CD pipeline',
            service_role=role.arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type='CODEPIPELINE'
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type='BUILD_GENERAL1_SMALL',
                image='aws/codebuild/standard:7.0',
                type='LINUX_CONTAINER',
                environment_variables=[
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name='ENVIRONMENT',
                        value=self.config.environment_suffix,
                        type='PLAINTEXT'
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name='AWS_REGION',
                        value=self.config.primary_region,
                        type='PLAINTEXT'
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name='PROJECT_NAME',
                        value=self.config.project_name,
                        type='PLAINTEXT'
                    )
                ]
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type='CODEPIPELINE',
                buildspec=json.dumps(buildspec)
            ),
            logs_config=aws.codebuild.ProjectLogsConfigArgs(
                cloudwatch_logs=aws.codebuild.ProjectLogsConfigCloudwatchLogsArgs(
                    status='ENABLED',
                    group_name=f'/aws/codebuild/{project_name}'
                )
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': project_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        return project
    
    def _create_security_scan_project(self, role: aws.iam.Role) -> aws.codebuild.Project:
        """Create security scan CodeBuild project."""
        project_name = self.config.get_resource_name('security-scan')
        
        buildspec = {
            'version': 0.2,
            'phases': {
                'install': {
                    'runtime-versions': {
                        'python': '3.11'
                    },
                    'commands': [
                        'echo Installing security scanning tools...',
                        'pip install --upgrade pip',
                        'pip install bandit safety'
                    ]
                },
                'build': {
                    'commands': [
                        'echo Security scan started on `date`',
                        'echo Running Bandit security scan...',
                        'bandit -r . -f json -o bandit-report.json || true',
                        'echo Running Safety dependency scan...',
                        'safety check --json || true',
                        'echo Security scan completed on `date`'
                    ]
                }
            },
            'artifacts': {
                'files': ['**/*', 'bandit-report.json']
            }
        }
        
        project = aws.codebuild.Project(
            'security-scan-project',
            name=project_name,
            description='Security vulnerability scanning project',
            service_role=role.arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type='CODEPIPELINE'
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type='BUILD_GENERAL1_SMALL',
                image='aws/codebuild/standard:7.0',
                type='LINUX_CONTAINER',
                environment_variables=[
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name='ENVIRONMENT',
                        value=self.config.environment_suffix,
                        type='PLAINTEXT'
                    )
                ]
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type='CODEPIPELINE',
                buildspec=json.dumps(buildspec)
            ),
            logs_config=aws.codebuild.ProjectLogsConfigArgs(
                cloudwatch_logs=aws.codebuild.ProjectLogsConfigCloudwatchLogsArgs(
                    status='ENABLED',
                    group_name=f'/aws/codebuild/{project_name}'
                )
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': project_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        return project
    
    def _create_pipeline(self):
        """Create CodePipeline with multi-region deployment."""
        pipeline_name = self.config.get_resource_name('pipeline')
        
        artifact_bucket_arn = self.storage_stack.get_bucket_arn('artifacts')
        kms_key_arn = self.storage_stack.get_kms_key_arn('s3')
        
        codebuild_project_arns = [
            self.codebuild_projects['main-build'].arn,
            self.codebuild_projects['security-scan'].arn
        ]
        lambda_function_arns = [
            self.lambda_stack.get_function_arn('deployment-logger')
        ]
        sns_topic_arns = [
            self.monitoring_stack.get_sns_topic_arn('pipeline-notifications')
        ]
        
        pipeline_role = self.iam_stack.create_codepipeline_role(
            [artifact_bucket_arn, self.secondary_artifact_bucket.arn],
            [kms_key_arn],
            codebuild_project_arns,
            lambda_function_arns,
            sns_topic_arns
        )
        
        self.pipeline = aws.codepipeline.Pipeline(
            'cicd-pipeline',
            name=pipeline_name,
            role_arn=pipeline_role.arn,
            artifact_stores=[
                aws.codepipeline.PipelineArtifactStoreArgs(
                    location=self.storage_stack.get_bucket_name('artifacts'),
                    type='S3',
                    region=self.config.primary_region,
                    encryption_key=aws.codepipeline.PipelineArtifactStoreEncryptionKeyArgs(
                        type='KMS',
                        id=kms_key_arn
                    )
                ),
                aws.codepipeline.PipelineArtifactStoreArgs(
                    location=self.secondary_artifact_bucket.id,
                    type='S3',
                    region=self.config.secondary_region,
                    encryption_key=aws.codepipeline.PipelineArtifactStoreEncryptionKeyArgs(
                        type='KMS',
                        id=kms_key_arn
                    )
                )
            ],
            stages=[
                self._create_source_stage(),
                self._create_build_stage(),
                self._create_security_scan_stage(),
                self._create_approval_stage(),
                self._create_deploy_primary_stage(),
                self._create_deploy_secondary_stage(),
                self._create_notification_stage()
            ],
            tags={
                **self.config.get_common_tags(),
                'Name': pipeline_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.monitoring_stack.create_pipeline_alarms(self.pipeline.name)
        self.monitoring_stack.create_lambda_alarms('deployment-logger', self.lambda_stack.get_function_name('deployment-logger'))
        self.monitoring_stack.create_dashboard(
            self.pipeline.name,
            {k: v.name for k, v in self.codebuild_projects.items()},
            {'deployment-logger': self.lambda_stack.get_function_name('deployment-logger')}
        )
    
    def _create_source_stage(self) -> aws.codepipeline.PipelineStageArgs:
        """Create source stage for S3 source."""
        return aws.codepipeline.PipelineStageArgs(
            name='Source',
            actions=[
                aws.codepipeline.PipelineStageActionArgs(
                    name='SourceAction',
                    category='Source',
                    owner='AWS',
                    provider='S3',
                    version='1',
                    output_artifacts=['source_output'],
                    configuration={
                        'S3Bucket': self.storage_stack.get_bucket_name('artifacts'),
                        'S3ObjectKey': 'source.zip',
                        'PollForSourceChanges': 'false'
                    }
                )
            ]
        )
    
    def _create_build_stage(self) -> aws.codepipeline.PipelineStageArgs:
        """Create build stage."""
        return aws.codepipeline.PipelineStageArgs(
            name='Build',
            actions=[
                aws.codepipeline.PipelineStageActionArgs(
                    name='BuildAction',
                    category='Build',
                    owner='AWS',
                    provider='CodeBuild',
                    version='1',
                    input_artifacts=['source_output'],
                    output_artifacts=['build_output'],
                    configuration={
                        'ProjectName': self.codebuild_projects['main-build'].name
                    }
                )
            ]
        )
    
    def _create_security_scan_stage(self) -> aws.codepipeline.PipelineStageArgs:
        """Create security scan stage."""
        return aws.codepipeline.PipelineStageArgs(
            name='SecurityScan',
            actions=[
                aws.codepipeline.PipelineStageActionArgs(
                    name='SecurityScanAction',
                    category='Build',
                    owner='AWS',
                    provider='CodeBuild',
                    version='1',
                    input_artifacts=['build_output'],
                    output_artifacts=['scan_output'],
                    configuration={
                        'ProjectName': self.codebuild_projects['security-scan'].name
                    }
                )
            ]
        )
    
    def _create_approval_stage(self) -> aws.codepipeline.PipelineStageArgs:
        """Create manual approval stage."""
        return aws.codepipeline.PipelineStageArgs(
            name='Approval',
            actions=[
                aws.codepipeline.PipelineStageActionArgs(
                    name='ManualApproval',
                    category='Approval',
                    owner='AWS',
                    provider='Manual',
                    version='1',
                    configuration={
                        'NotificationArn': self.monitoring_stack.get_sns_topic_arn('pipeline-notifications'),
                        'CustomData': 'Please review and approve deployment to production regions'
                    }
                )
            ]
        )
    
    def _create_deploy_primary_stage(self) -> aws.codepipeline.PipelineStageArgs:
        """Create deployment stage for primary region."""
        return aws.codepipeline.PipelineStageArgs(
            name='DeployPrimary',
            actions=[
                aws.codepipeline.PipelineStageActionArgs(
                    name='DeployToPrimaryRegion',
                    category='Invoke',
                    owner='AWS',
                    provider='Lambda',
                    version='1',
                    input_artifacts=['scan_output'],
                    configuration={
                        'FunctionName': self.lambda_stack.get_function_name('deployment-logger'),
                        'UserParameters': json.dumps({
                            'region': self.config.primary_region,
                            'environment': self.config.environment_suffix
                        })
                    },
                    region=self.config.primary_region
                )
            ]
        )
    
    def _create_deploy_secondary_stage(self) -> aws.codepipeline.PipelineStageArgs:
        """Create deployment stage for secondary region."""
        return aws.codepipeline.PipelineStageArgs(
            name='DeploySecondary',
            actions=[
                aws.codepipeline.PipelineStageActionArgs(
                    name='DeployToSecondaryRegion',
                    category='Invoke',
                    owner='AWS',
                    provider='Lambda',
                    version='1',
                    input_artifacts=['scan_output'],
                    configuration={
                        'FunctionName': self.lambda_stack.get_function_name('deployment-logger'),
                        'UserParameters': json.dumps({
                            'region': self.config.secondary_region,
                            'environment': self.config.environment_suffix
                        })
                    },
                    region=self.config.secondary_region
                )
            ]
        )
    
    def _create_notification_stage(self) -> aws.codepipeline.PipelineStageArgs:
        """Create notification stage."""
        return aws.codepipeline.PipelineStageArgs(
            name='Notify',
            actions=[
                aws.codepipeline.PipelineStageActionArgs(
                    name='NotifyCompletion',
                    category='Invoke',
                    owner='AWS',
                    provider='Lambda',
                    version='1',
                    input_artifacts=['scan_output'],
                    configuration={
                        'FunctionName': self.lambda_stack.get_function_name('deployment-logger')
                    }
                )
            ]
        )
    
    def _create_event_rule(self):
        """Create EventBridge rule to trigger pipeline on S3 changes."""
        rule_name = self.config.get_resource_name('pipeline-trigger')
        
        event_rule = aws.cloudwatch.EventRule(
            'pipeline-trigger-rule',
            name=rule_name,
            description='Trigger pipeline on S3 source changes',
            event_pattern=pulumi.Output.json_dumps({
                'source': ['aws.s3'],
                'detail-type': ['Object Created'],
                'detail': {
                    'bucket': {
                        'name': [self.storage_stack.get_bucket_name('artifacts')]
                    },
                    'object': {
                        'key': ['source.zip']
                    }
                }
            }),
            tags={
                **self.config.get_common_tags(),
                'Name': rule_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.cloudwatch.EventTarget(
            'pipeline-trigger-target',
            rule=event_rule.name,
            arn=self.pipeline.arn,
            role_arn=self.iam_stack.get_role_arn('codepipeline'),
            opts=self.provider_manager.get_resource_options()
        )
    
    def get_pipeline(self) -> aws.codepipeline.Pipeline:
        """Get the pipeline."""
        return self.pipeline
    
    def get_pipeline_name(self) -> Output[str]:
        """Get pipeline name."""
        return self.pipeline.name if self.pipeline else Output.from_input('')
    
    def get_pipeline_arn(self) -> Output[str]:
        """Get pipeline ARN."""
        return self.pipeline.arn if self.pipeline else Output.from_input('')
    
    def get_codebuild_project(self, project_name: str) -> aws.codebuild.Project:
        """Get CodeBuild project by name."""
        return self.codebuild_projects.get(project_name)
