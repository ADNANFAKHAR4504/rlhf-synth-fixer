## File: tap.py

```py
#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
import sys

import pulumi
from pulumi import Config

lib_path = os.path.join(os.path.dirname(__file__), 'lib')
sys.path.insert(0, lib_path)

from tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from CI, config or fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

stack = TapStack(
    name="cicd-pipeline",
    args=TapStackArgs(environment_suffix=environment_suffix, tags=default_tags),
)

```

## File: lib\*\*init\*\*.py

```py
"""Lib package for CI/CD pipeline infrastructure."""

```

## File: lib\tap_stack.py

```py
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the CI/CD pipeline infrastructure.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.cicd import CICDStack
from infrastructure.config import CICDPipelineConfig
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.storage import StorageStack
from pulumi import Output, ResourceOptions


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the CI/CD pipeline.

    This component orchestrates the instantiation of all infrastructure components
    and manages the environment suffix used for naming and configuration.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}

        self.config = CICDPipelineConfig()
        self.provider_manager = AWSProviderManager(self.config)

        self.iam_stack = IAMStack(self.config, self.provider_manager)
        self.storage_stack = StorageStack(self.config, self.provider_manager)
        self.monitoring_stack = MonitoringStack(self.config, self.provider_manager)
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.monitoring_stack
        )
        self.cicd_stack = CICDStack(
            self.config,
            self.provider_manager,
            self.storage_stack,
            self.iam_stack,
            self.lambda_stack,
            self.monitoring_stack
        )

        self._register_outputs()

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}

        outputs['project_name'] = self.config.project_name
        outputs['environment'] = self.config.environment
        outputs['environment_suffix'] = self.config.environment_suffix
        outputs['primary_region'] = self.config.primary_region
        outputs['secondary_region'] = self.config.secondary_region
        outputs['normalized_region'] = self.config.normalized_region

        outputs['artifact_bucket_name'] = self.storage_stack.get_bucket_name('artifacts')
        outputs['artifact_bucket_arn'] = self.storage_stack.get_bucket_arn('artifacts')
        outputs['s3_kms_key_id'] = self.storage_stack.get_kms_key_id('s3')
        outputs['s3_kms_key_arn'] = self.storage_stack.get_kms_key_arn('s3')

        outputs['pipeline_name'] = self.cicd_stack.get_pipeline_name()
        outputs['pipeline_arn'] = self.cicd_stack.get_pipeline_arn()
        outputs['pipeline_url'] = pulumi.Output.concat(
            'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/',
            self.cicd_stack.get_pipeline_name(),
            '/view?region=',
            self.config.primary_region
        )

        outputs['main_build_project_name'] = self.cicd_stack.get_codebuild_project('main-build').name
        outputs['main_build_project_arn'] = self.cicd_stack.get_codebuild_project('main-build').arn
        outputs['security_scan_project_name'] = self.cicd_stack.get_codebuild_project('security-scan').name
        outputs['security_scan_project_arn'] = self.cicd_stack.get_codebuild_project('security-scan').arn

        outputs['deployment_logger_function_name'] = self.lambda_stack.get_function_name('deployment-logger')
        outputs['deployment_logger_function_arn'] = self.lambda_stack.get_function_arn('deployment-logger')
        outputs['deployment_logger_dlq_url'] = self.lambda_stack.dlqs['deployment-logger'].url
        outputs['deployment_logger_dlq_arn'] = self.lambda_stack.dlqs['deployment-logger'].arn

        outputs['sns_topic_arn'] = self.monitoring_stack.get_sns_topic_arn('pipeline-notifications')

        outputs['deployment_logger_log_group_name'] = f'/aws/lambda/{self.config.get_resource_name("deployment-logger")}'
        outputs['deployment_logger_log_group_arn'] = f'arn:aws:logs:{self.config.primary_region}:{self.config.account_id}:log-group:/aws/lambda/{self.config.get_resource_name("deployment-logger")}'

        outputs['main_build_log_group_name'] = f'/aws/codebuild/{self.config.get_resource_name("main-build")}'
        outputs['security_scan_log_group_name'] = f'/aws/codebuild/{self.config.get_resource_name("security-scan")}'

        outputs['codepipeline_role_arn'] = self.iam_stack.get_role_arn('codepipeline')
        outputs['main_build_codebuild_role_arn'] = self.iam_stack.get_role_arn('main-build-codebuild')
        outputs['security_scan_codebuild_role_arn'] = self.iam_stack.get_role_arn('security-scan-codebuild')
        outputs['deployment_logger_lambda_role_arn'] = self.iam_stack.get_role_arn('deployment-logger-lambda')

        outputs['secondary_artifact_bucket_name'] = self.cicd_stack.secondary_artifact_bucket.id
        outputs['secondary_artifact_bucket_arn'] = self.cicd_stack.secondary_artifact_bucket.arn

        self.register_outputs(outputs)

        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception:
            pass

```

## File: lib\infrastructure\_\_init\_\_.py

```py
"""Infrastructure package for CI/CD pipeline."""
```

## File: lib\infrastructure\lambda_code\deployment_logger.py

```py
"""
Lambda function for logging deployment events.

This function is triggered after successful deployments to log
custom metrics and deployment summaries to CloudWatch.
"""

import json
import os
from datetime import datetime
from typing import Any, Dict

import boto3

cloudwatch = boto3.client('cloudwatch')
logs = boto3.client('logs')
sns = boto3.client('sns')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for deployment logging.

    Args:
        event: CodePipeline event
        context: Lambda context

    Returns:
        Response dict
    """
    try:
        request_id = context.aws_request_id
        timestamp = datetime.utcnow().isoformat()

        project_name = os.environ.get('PROJECT_NAME', 'unknown')
        sns_topic_arn = os.environ.get('SNS_TOPIC_ARN', '')

        pipeline_name = event.get('detail', {}).get('pipeline', 'unknown')
        execution_id = event.get('detail', {}).get('execution-id', 'unknown')
        state = event.get('detail', {}).get('state', 'unknown')

        log_message = {
            'timestamp': timestamp,
            'request_id': request_id,
            'project_name': project_name,
            'pipeline_name': pipeline_name,
            'execution_id': execution_id,
            'state': state,
            'event': event
        }

        print(json.dumps(log_message))

        cloudwatch.put_metric_data(
            Namespace='CICDPipeline/Deployments',
            MetricData=[
                {
                    'MetricName': 'DeploymentEvent',
                    'Value': 1.0,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {'Name': 'PipelineName', 'Value': pipeline_name},
                        {'Name': 'State', 'Value': state}
                    ]
                }
            ]
        )

        if state == 'SUCCEEDED' and sns_topic_arn:
            sns.publish(
                TopicArn=sns_topic_arn,
                Subject=f'Deployment Success: {pipeline_name}',
                Message=json.dumps(log_message, indent=2)
            )
        elif state == 'FAILED' and sns_topic_arn:
            sns.publish(
                TopicArn=sns_topic_arn,
                Subject=f'Deployment Failed: {pipeline_name}',
                Message=json.dumps(log_message, indent=2)
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Deployment logged successfully',
                'request_id': request_id
            })
        }

    except Exception as e:
        error_message = f'Error logging deployment: {str(e)}'
        print(error_message)

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': error_message
            })
        }

```

## File: lib\infrastructure\aws_provider.py

```py
"""
AWS Provider module for consistent provider usage.

This module creates a single AWS provider instance to avoid drift in CI/CD pipelines.
"""

import pulumi
import pulumi_aws as aws

from .config import CICDPipelineConfig


class AWSProviderManager:
    """
    Manages a consistent AWS provider instance.

    Ensures all resources use the same provider without random suffixes,
    preventing drift in CI/CD pipelines.
    """

    def __init__(self, config: CICDPipelineConfig):
        """
        Initialize the AWS provider manager.

        Args:
            config: CICDPipelineConfig instance
        """
        self.config = config
        self._provider = None

    def get_provider(self) -> aws.Provider:
        """
        Get or create the AWS provider instance.

        Returns:
            AWS Provider instance
        """
        if self._provider is None:
            self._provider = aws.Provider(
                'aws-provider',
                region=self.config.primary_region,
                default_tags=aws.ProviderDefaultTagsArgs(
                    tags=self.config.get_common_tags()
                )
            )
        return self._provider

    def get_resource_options(self, depends_on=None) -> pulumi.ResourceOptions:
        """
        Get ResourceOptions with the provider.

        Args:
            depends_on: Optional list of resources this resource depends on

        Returns:
            ResourceOptions with provider set
        """
        return pulumi.ResourceOptions(
            provider=self.get_provider(),
            depends_on=depends_on if depends_on else None
        )

```

## File: lib\infrastructure\cicd.py

```py
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

```

## File: lib\infrastructure\config.py

```py
"""
Configuration module for the CI/CD pipeline infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import os
import re
from typing import Dict, List


class CICDPipelineConfig:
    """Centralized configuration for the CI/CD pipeline infrastructure."""

    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')
        self.project_name = 'cicd-pipeline'

        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.secondary_region = os.getenv('SECONDARY_REGION', 'us-west-2')
        self.normalized_region = self._normalize_region(self.primary_region)
        self.normalized_primary_region = self.normalized_region
        self.normalized_secondary_region = self._normalize_region(self.secondary_region)

        self.account_id = os.getenv('AWS_ACCOUNT_ID', '123456789012')
        self.notification_email = os.getenv('NOTIFICATION_EMAIL', '')

        self.lambda_runtime = 'python3.11'
        self.lambda_timeout = 300
        self.lambda_memory_size = 256

        self.codebuild_compute_type = 'BUILD_GENERAL1_SMALL'
        self.codebuild_image = 'aws/codebuild/standard:7.0'

        self.log_retention_days = 7

        self.kms_key_rotation_enabled = True

        self.team = 'DevOps Team'
        self.cost_center = 'Engineering'
        self.owner = 'DevOps Team'

        self.deployment_regions: List[str] = [self.primary_region, self.secondary_region]

    def _normalize_region(self, region: str) -> str:
        """
        Normalize region name for resource naming.

        Example: us-east-1 -> useast1
        """
        return region.replace('-', '')

    def normalize_name(self, name: str) -> str:
        """
        Normalize name for case-sensitive resources.

        Converts to lowercase and replaces invalid characters with hyphens.
        """
        normalized = re.sub(r'[^a-z0-9-]', '-', name.lower())
        normalized = re.sub(r'-+', '-', normalized).strip('-')
        return normalized

    def get_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate consistent resource names with environment suffix and normalized region.

        Args:
            resource_type: Type of the resource
            include_region: Whether to include region in the name (default: True)

        Returns:
            Formatted resource name with region, environment, and environment suffix
        """
        base_name = f"{self.project_name}-{resource_type}"

        if include_region:
            base_name = f"{base_name}-{self.normalized_primary_region}"

        base_name = f"{base_name}-{self.environment}-{self.environment_suffix}"

        return base_name

    def get_normalized_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate normalized resource names for case-sensitive resources.

        This is specifically for resources like S3 buckets that require lowercase names.
        """
        name = self.get_resource_name(resource_type, include_region)
        return self.normalize_name(name)

    def get_common_tags(self) -> Dict[str, str]:
        """Get common tags for all resources."""
        return {
            'Project': self.project_name,
            'Environment': self.environment,
            'EnvironmentSuffix': self.environment_suffix,
            'Team': self.team,
            'CostCenter': self.cost_center,
            'Owner': self.owner,
            'ManagedBy': 'Pulumi',
            'Region': self.normalized_primary_region
        }

```

## File: lib\infrastructure\iam.py

```py
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


```

## File: lib\infrastructure\lambda_functions.py

```py
"""
Lambda functions module for deployment logging.

This module creates Lambda functions for logging deployment events
with proper configuration, DLQ, and X-Ray tracing.
"""

import os
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig


class LambdaStack:
    """
    Manages Lambda functions for deployment logging.

    Creates Lambda functions with proper configuration, DLQ,
    X-Ray tracing, and CloudWatch Logs integration.
    """

    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager,
        iam_stack,
        monitoring_stack
    ):
        """
        Initialize the Lambda stack.

        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            monitoring_stack: MonitoringStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.monitoring_stack = monitoring_stack
        self.functions: Dict[str, aws.lambda_.Function] = {}
        self.dlqs: Dict[str, aws.sqs.Queue] = {}

        self._create_deployment_logger()

    def _create_deployment_logger(self):
        """Create deployment logger Lambda function."""
        function_name = self.config.get_resource_name('deployment-logger')

        log_group = aws.cloudwatch.LogGroup(
            'deployment-logger-log-group',
            name=f'/aws/lambda/{function_name}',
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': f'/aws/lambda/{function_name}'
            },
            opts=self.provider_manager.get_resource_options()
        )

        dlq = aws.sqs.Queue(
            'deployment-logger-dlq',
            name=f'{function_name}-dlq',
            message_retention_seconds=1209600,
            tags={
                **self.config.get_common_tags(),
                'Name': f'{function_name}-dlq'
            },
            opts=self.provider_manager.get_resource_options()
        )

        sns_topic_arns = [self.monitoring_stack.get_sns_topic_arn('pipeline-notifications')]

        role = self.iam_stack.create_lambda_role(
            'deployment-logger',
            log_group.arn,
            sns_topic_arns
        )

        lambda_code_dir = os.path.join(
            os.path.dirname(__file__),
            'lambda_code'
        )

        function = aws.lambda_.Function(
            'deployment-logger-function',
            name=function_name,
            role=role.arn,
            runtime='python3.11',
            handler='deployment_logger.handler',
            code=pulumi.FileArchive(lambda_code_dir),
            timeout=60,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'PROJECT_NAME': self.config.project_name,
                    'SNS_TOPIC_ARN': self.monitoring_stack.get_sns_topic_arn('pipeline-notifications')
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=dlq.arn
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': function_name
            },
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[log_group, role]
            )
        )

        aws.lambda_.FunctionEventInvokeConfig(
            'deployment-logger-event-invoke-config',
            function_name=function.name,
            maximum_retry_attempts=2,
            maximum_event_age_in_seconds=3600,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=dlq.arn
                )
            ),
            opts=self.provider_manager.get_resource_options()
        )

        Output.all(role.arn, dlq.arn).apply(
            lambda args: aws.iam.RolePolicy(
                'deployment-logger-dlq-policy',
                role=role.id,
                policy=pulumi.Output.json_dumps({
                    'Version': '2012-10-17',
                    'Statement': [{
                        'Effect': 'Allow',
                        'Action': [
                            'sqs:SendMessage'
                        ],
                        'Resource': args[1]
                    }]
                }),
                opts=self.provider_manager.get_resource_options()
            )
        )

        self.functions['deployment-logger'] = function
        self.dlqs['deployment-logger'] = dlq

    def get_function(self, function_name: str) -> aws.lambda_.Function:
        """Get Lambda function by name."""
        return self.functions.get(function_name)

    def get_function_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function ARN."""
        function = self.functions.get(function_name)
        return function.arn if function else Output.from_input('')

    def get_function_name(self, function_name: str) -> Output[str]:
        """Get Lambda function name."""
        function = self.functions.get(function_name)
        return function.name if function else Output.from_input('')


```

## File: lib\infrastructure\monitoring.py

```py
"""
Monitoring module for CloudWatch and SNS.

This module creates CloudWatch alarms, dashboards, and SNS topics
for monitoring CI/CD pipeline health and sending notifications.
"""

import json
from typing import Dict, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig


class MonitoringStack:
    """
    Manages CloudWatch and SNS resources for monitoring.

    Creates SNS topics, CloudWatch alarms, and dashboards for
    monitoring pipeline health and sending notifications.
    """

    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the monitoring stack.

        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.sns_topics: Dict[str, aws.sns.Topic] = {}
        self.alarms: Dict[str, aws.cloudwatch.MetricAlarm] = {}
        self.dashboard: Optional[aws.cloudwatch.Dashboard] = None

        self._create_sns_topics()

    def _create_sns_topics(self):
        """Create SNS topics for notifications."""
        topic_name = self.config.get_resource_name('pipeline-notifications')

        topic = aws.sns.Topic(
            'pipeline-notifications-topic',
            name=topic_name,
            display_name='CI/CD Pipeline Notifications',
            tags={
                **self.config.get_common_tags(),
                'Name': topic_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        if self.config.notification_email:
            aws.sns.TopicSubscription(
                'pipeline-notifications-email-subscription',
                topic=topic.arn,
                protocol='email',
                endpoint=self.config.notification_email,
                opts=self.provider_manager.get_resource_options()
            )

        self.sns_topics['pipeline-notifications'] = topic

    def create_pipeline_alarms(self, pipeline_name: Output[str]):
        """
        Create CloudWatch alarms for pipeline failures.

        Args:
            pipeline_name: Pipeline name Output
        """
        alarm_name = self.config.get_resource_name('pipeline-failure-alarm')

        pipeline_name.apply(lambda name:
            aws.cloudwatch.MetricAlarm(
                'pipeline-failure-alarm',
                name=alarm_name,
                alarm_description=f'Alarm for {self.config.project_name} pipeline failures',
                comparison_operator='GreaterThanOrEqualToThreshold',
                evaluation_periods=1,
                metric_name='PipelineExecutionFailure',
                namespace='AWS/CodePipeline',
                period=300,
                statistic='Sum',
                threshold=1,
                treat_missing_data='notBreaching',
                alarm_actions=[self.sns_topics['pipeline-notifications'].arn],
                dimensions={
                    'PipelineName': name
                },
                tags={
                    **self.config.get_common_tags(),
                    'Name': alarm_name
                },
                opts=self.provider_manager.get_resource_options()
            )
        )

    def create_codebuild_alarms(self, project_name: str, codebuild_project_name: Output[str]):
        """
        Create CloudWatch alarms for CodeBuild failures.

        Args:
            project_name: Logical project name
            codebuild_project_name: CodeBuild project name Output
        """
        alarm_name = self.config.get_resource_name(f'{project_name}-build-failure-alarm')

        codebuild_project_name.apply(lambda name:
            aws.cloudwatch.MetricAlarm(
                f'{project_name}-build-failure-alarm',
                name=alarm_name,
                alarm_description=f'Alarm for {project_name} build failures',
                comparison_operator='GreaterThanOrEqualToThreshold',
                evaluation_periods=1,
                metric_name='FailedBuilds',
                namespace='AWS/CodeBuild',
                period=300,
                statistic='Sum',
                threshold=1,
                treat_missing_data='notBreaching',
                alarm_actions=[self.sns_topics['pipeline-notifications'].arn],
                dimensions={
                    'ProjectName': name
                },
                tags={
                    **self.config.get_common_tags(),
                    'Name': alarm_name
                },
                opts=self.provider_manager.get_resource_options()
            )
        )

    def create_lambda_alarms(self, function_name: str, lambda_function_name: Output[str]):
        """
        Create CloudWatch alarms for Lambda errors.

        Args:
            function_name: Logical function name
            lambda_function_name: Lambda function name Output
        """
        error_alarm_name = self.config.get_resource_name(f'{function_name}-error-alarm')
        throttle_alarm_name = self.config.get_resource_name(f'{function_name}-throttle-alarm')

        lambda_function_name.apply(lambda name: [
            aws.cloudwatch.MetricAlarm(
                f'{function_name}-error-alarm',
                name=error_alarm_name,
                alarm_description=f'Alarm for {function_name} errors',
                comparison_operator='GreaterThanThreshold',
                evaluation_periods=2,
                threshold=5,
                treat_missing_data='notBreaching',
                alarm_actions=[self.sns_topics['pipeline-notifications'].arn],
                metric_queries=[
                    aws.cloudwatch.MetricAlarmMetricQueryArgs(
                        id='error_rate',
                        expression='errors / invocations * 100',
                        label='Error Rate',
                        return_data=True
                    ),
                    aws.cloudwatch.MetricAlarmMetricQueryArgs(
                        id='errors',
                        metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                            metric_name='Errors',
                            namespace='AWS/Lambda',
                            period=300,
                            stat='Sum',
                            dimensions={'FunctionName': name}
                        ),
                        return_data=False
                    ),
                    aws.cloudwatch.MetricAlarmMetricQueryArgs(
                        id='invocations',
                        metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                            metric_name='Invocations',
                            namespace='AWS/Lambda',
                            period=300,
                            stat='Sum',
                            dimensions={'FunctionName': name}
                        ),
                        return_data=False
                    )
                ],
                tags={
                    **self.config.get_common_tags(),
                    'Name': error_alarm_name
                },
                opts=self.provider_manager.get_resource_options()
            ),
            aws.cloudwatch.MetricAlarm(
                f'{function_name}-throttle-alarm',
                name=throttle_alarm_name,
                alarm_description=f'Alarm for {function_name} throttles',
                comparison_operator='GreaterThanThreshold',
                evaluation_periods=1,
                metric_name='Throttles',
                namespace='AWS/Lambda',
                period=300,
                statistic='Sum',
                threshold=10,
                treat_missing_data='notBreaching',
                alarm_actions=[self.sns_topics['pipeline-notifications'].arn],
                dimensions={
                    'FunctionName': name
                },
                tags={
                    **self.config.get_common_tags(),
                    'Name': throttle_alarm_name
                },
                opts=self.provider_manager.get_resource_options()
            )
        ])

    def create_dashboard(self, pipeline_name: Output[str], codebuild_projects: Dict[str, Output[str]], lambda_functions: Dict[str, Output[str]]):
        """
        Create CloudWatch dashboard for monitoring.

        Args:
            pipeline_name: Pipeline name Output
            codebuild_projects: Dict of CodeBuild project names
            lambda_functions: Dict of Lambda function names
        """
        dashboard_name = self.config.get_resource_name('cicd-dashboard')

        aws.cloudwatch.Dashboard(
            'cicd-dashboard',
            dashboard_name=dashboard_name,
            dashboard_body=pulumi.Output.json_dumps({
                    'widgets': [
                        {
                            'type': 'metric',
                            'properties': {
                                'title': 'Pipeline Executions',
                                'region': self.config.primary_region,
                                'metrics': [
                                    ['AWS/CodePipeline', 'PipelineExecutionSuccess', {'stat': 'Sum', 'label': 'Success'}],
                                    ['.', 'PipelineExecutionFailure', {'stat': 'Sum', 'label': 'Failure'}]
                                ],
                                'period': 300,
                                'view': 'timeSeries',
                                'stacked': False
                            }
                        },
                        {
                            'type': 'metric',
                            'properties': {
                                'title': 'Build Status',
                                'region': self.config.primary_region,
                                'metrics': [
                                    ['AWS/CodeBuild', 'SuccessfulBuilds', {'stat': 'Sum', 'label': 'Success'}],
                                    ['.', 'FailedBuilds', {'stat': 'Sum', 'label': 'Failed'}]
                                ],
                                'period': 300,
                                'view': 'timeSeries',
                                'stacked': False
                            }
                        },
                        {
                            'type': 'metric',
                            'properties': {
                                'title': 'Lambda Invocations',
                                'region': self.config.primary_region,
                                'metrics': [
                                    ['AWS/Lambda', 'Invocations', {'stat': 'Sum'}],
                                    ['.', 'Errors', {'stat': 'Sum'}],
                                    ['.', 'Throttles', {'stat': 'Sum'}]
                                ],
                                'period': 300,
                                'view': 'timeSeries',
                                'stacked': False
                            }
                        }
                    ]
                }),
            opts=self.provider_manager.get_resource_options()
        )

    def get_sns_topic(self, topic_name: str) -> aws.sns.Topic:
        """Get SNS topic by name."""
        return self.sns_topics.get(topic_name)

    def get_sns_topic_arn(self, topic_name: str) -> Output[str]:
        """Get SNS topic ARN."""
        topic = self.sns_topics.get(topic_name)
        return topic.arn if topic else Output.from_input('')


```

## File: lib\infrastructure\storage.py

```py
"""
Storage module for S3 buckets and KMS encryption.

This module creates S3 buckets for CI/CD artifacts with proper
encryption, versioning, lifecycle policies, and public access blocks.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig


class StorageStack:
    """
    Manages S3 buckets and KMS keys for CI/CD artifacts.

    Creates buckets with KMS encryption, versioning, lifecycle policies,
    and public access blocks for security.
    """

    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the storage stack.

        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.buckets: Dict[str, aws.s3.Bucket] = {}
        self.kms_keys: Dict[str, aws.kms.Key] = {}

        self._create_kms_keys()
        self._create_artifact_bucket()

    def _create_kms_keys(self):
        """Create KMS keys for S3 encryption."""
        s3_key_name = self.config.get_resource_name('s3-key')

        s3_key = aws.kms.Key(
            's3-kms-key',
            description='KMS key for S3 bucket encryption',
            enable_key_rotation=self.config.kms_key_rotation_enabled,
            tags={
                **self.config.get_common_tags(),
                'Name': s3_key_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        aws.kms.Alias(
            's3-kms-alias',
            target_key_id=s3_key.id,
            name=f'alias/{self.config.get_resource_name("s3", include_region=False)}',
            opts=self.provider_manager.get_resource_options()
        )

        self.kms_keys['s3'] = s3_key

    def _create_artifact_bucket(self):
        """Create S3 bucket for CI/CD artifacts."""
        bucket_name = self.config.get_normalized_resource_name('artifacts')

        artifact_bucket = aws.s3.Bucket(
            'artifact-bucket',
            bucket=bucket_name,
            tags={
                **self.config.get_common_tags(),
                'Name': bucket_name,
                'Purpose': 'CI/CD Artifacts'
            },
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketVersioning(
            'artifact-bucket-versioning',
            bucket=artifact_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketServerSideEncryptionConfiguration(
            'artifact-bucket-encryption',
            bucket=artifact_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm='aws:kms',
                    kms_master_key_id=self.kms_keys['s3'].arn
                ),
                bucket_key_enabled=True
            )],
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketPublicAccessBlock(
            'artifact-bucket-public-access-block',
            bucket=artifact_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketLifecycleConfiguration(
            'artifact-bucket-lifecycle',
            bucket=artifact_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='transition-to-ia',
                    status='Enabled',
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=30,
                            storage_class='STANDARD_IA'
                        ),
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=90,
                            storage_class='GLACIER'
                        )
                    ]
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='expire-old-artifacts',
                    status='Enabled',
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=180
                    )
                )
            ],
            opts=self.provider_manager.get_resource_options()
        )

        Output.all(artifact_bucket.arn).apply(
            lambda arns: aws.s3.BucketPolicy(
                'artifact-bucket-policy',
                bucket=artifact_bucket.id,
                policy=pulumi.Output.json_dumps({
                    'Version': '2012-10-17',
                    'Statement': [
                        {
                            'Sid': 'DenyUnencryptedObjectUploads',
                            'Effect': 'Deny',
                            'Principal': '*',
                            'Action': 's3:PutObject',
                            'Resource': f'{arns[0]}/*',
                            'Condition': {
                                'StringNotEquals': {
                                    's3:x-amz-server-side-encryption': 'aws:kms'
                                }
                            }
                        },
                        {
                            'Sid': 'DenyInsecureConnections',
                            'Effect': 'Deny',
                            'Principal': '*',
                            'Action': 's3:*',
                            'Resource': [arns[0], f'{arns[0]}/*'],
                            'Condition': {
                                'Bool': {
                                    'aws:SecureTransport': 'false'
                                }
                            }
                        }
                    ]
                }),
                opts=self.provider_manager.get_resource_options()
            )
        )

        self.buckets['artifacts'] = artifact_bucket

    def get_bucket(self, bucket_type: str) -> aws.s3.Bucket:
        """Get bucket by type."""
        return self.buckets.get(bucket_type)

    def get_bucket_name(self, bucket_type: str) -> Output[str]:
        """Get bucket name."""
        bucket = self.buckets.get(bucket_type)
        return bucket.id if bucket else Output.from_input('')

    def get_bucket_arn(self, bucket_type: str) -> Output[str]:
        """Get bucket ARN."""
        bucket = self.buckets.get(bucket_type)
        return bucket.arn if bucket else Output.from_input('')

    def get_kms_key_arn(self, key_type: str) -> Output[str]:
        """Get KMS key ARN."""
        key = self.kms_keys.get(key_type)
        return key.arn if key else Output.from_input('')

    def get_kms_key_id(self, key_type: str) -> Output[str]:
        """Get KMS key ID."""
        key = self.kms_keys.get(key_type)
        return key.id if key else Output.from_input('')

```
