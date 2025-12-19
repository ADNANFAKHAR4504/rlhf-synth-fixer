"""
tap_stack.py

CI/CD Pipeline Infrastructure for Automated Pulumi Deployments

This module creates a complete CI/CD pipeline using AWS Code Pipeline and CodeBuild
to automatically deploy Pulumi infrastructure when code is pushed to GitHub.

Features:
- CodePipeline with GitHub source integration
- CodeBuild project configured for Pulumi execution
- S3 buckets for artifacts and Pulumi state with encryption
- IAM roles following least-privilege principles
- CloudWatch Logs with configurable retention
- SNS notifications for pipeline failures
- Parameter Store for secure token management
"""

import json
from typing import Dict, Optional

import pulumi
import pulumi_aws as aws
import pulumi_random as random
from pulumi import Output, ResourceOptions


class TapStackArgs:
    """
    Arguments for TapStack component.

    Args:
        environment_suffix: Suffix for resource naming (e.g., 'dev', 'staging', 'prod')
        tags: Additional tags to apply to all resources
        github_owner: GitHub repository owner/organization
        github_repo: GitHub repository name
        github_branch: Branch to monitor for changes
        notification_email: Email address for pipeline failure notifications
        pulumi_access_token: Pulumi access token (will be stored as SecureString)
    """

    def __init__(
        self,
        *,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None,
        github_owner: Optional[str] = None,
        github_repo: Optional[str] = None,
        github_connection_arn: Optional[str] = None,
        github_branch: Optional[str] = 'main',
        notification_email: Optional[str] = None,
        pulumi_access_token: Optional[str] = None
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}
        self.github_owner = github_owner or 'example-org'
        self.github_repo = github_repo or 'example-repo'
        # GitHub CodeStar Connections ARN used by CodePipeline Source action
        self.github_connection_arn = github_connection_arn
        self.github_branch = github_branch
        self.notification_email = notification_email or 'devops@example.com'
        self.pulumi_access_token = pulumi_access_token or 'placeholder-token'


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component for CI/CD pipeline infrastructure.

    Creates ~15+ resources including:
    - 2 S3 buckets (artifacts and Pulumi state)
    - 2 IAM roles with policies
    - CodeBuild project with CloudWatch Logs
    - CodePipeline with 3 stages
    - SNS topic with email subscription
    - Notification rule
    - SSM Parameter for Pulumi token
    - KMS key for encryption
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.env_suffix = args.environment_suffix
        self.github_owner = args.github_owner
        self.github_repo = args.github_repo
        # Make the CodeStar Connections ARN available on the stack instance
        self.github_connection_arn = args.github_connection_arn
        self.github_branch = args.github_branch
        self.notification_email = args.notification_email

        # Generate a random suffix to ensure unique resource names
        self.random_suffix = random.RandomString(
            f'random-suffix-{self.env_suffix}',
            length=4,
            lower=True,
            upper=False,
            numeric=True,
            special=False,
            opts=ResourceOptions(parent=self)
        )

        # Default tags for all resources
        self.default_tags = {
            'Environment': self.env_suffix,
            'ManagedBy': 'Pulumi',
            'Project': 'pulumi-cicd-pipeline',
            'Purpose': 'CI/CD automation',
            **args.tags
        }

        # Get current AWS account ID and region
        current = aws.get_caller_identity()
        self.account_id = current.account_id
        region = aws.get_region()
        self.region = region.name

        # Step 1: Create KMS key for encryption
        self.kms_key = self._create_kms_key()

        # Step 2: Create S3 buckets
        self.artifact_bucket = self._create_artifact_bucket()
        self.state_bucket = self._create_state_bucket()

        # Step 3: Create Parameter Store for Pulumi token
        self.pulumi_token_param = self._create_pulumi_token_param(args.pulumi_access_token)

        # Step 4: Create IAM roles
        self.pipeline_role = self._create_pipeline_role()
        self.codebuild_role = self._create_codebuild_role()

        # Step 5: Create CloudWatch log group
        self.log_group = self._create_log_group()

        # Step 6: Create CodeBuild project
        self.codebuild_project = self._create_codebuild_project()

        # Step 7: Create SNS topic with subscription
        self.sns_topic, self.sns_subscription = self._create_sns_topic()

        # Conditionally create pipeline resources if GitHub connection ARN is provided
        if self.github_connection_arn:
            # Step 8: Create CodePipeline
            self.pipeline = self._create_pipeline()

            # Step 9: Create notification rule
            self.notification_rule = self._create_notification_rule()
        else:
            # Set to None if not created
            self.pipeline = None
            self.notification_rule = None

        # Register outputs
        self.register_outputs({
            'pipeline_name': self.pipeline.name if self.pipeline else None,
            'pipeline_arn': self.pipeline.arn if self.pipeline else None,
            'artifact_bucket_name': self.artifact_bucket.id,
            'state_bucket_name': self.state_bucket.id,
            'codebuild_project_name': self.codebuild_project.name,
            'sns_topic_arn': self.sns_topic.arn,
            'log_group_name': self.log_group.name,
            'pulumi_token_parameter': self.pulumi_token_param.name
        })

    def _create_kms_key(self) -> aws.kms.Key:
        """Create KMS customer-managed key for encryption."""
        key = aws.kms.Key(
            f'pipeline-kms-{self.env_suffix}',
            description=f'KMS key for CI/CD pipeline encryption - {self.env_suffix}',
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={**self.default_tags, 'Name': f'pipeline-kms-{self.env_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        aws.kms.Alias(
            f'pipeline-kms-alias-{self.env_suffix}',
            name=f'alias/pipeline-{self.env_suffix}',
            target_key_id=key.id,
            opts=ResourceOptions(parent=self)
        )

        return key

    def _create_artifact_bucket(self) -> aws.s3.Bucket:
        """Create S3 bucket for pipeline artifacts with security best practices."""
        bucket_name = self.random_suffix.result.apply(
            lambda suffix: f'pipeline-artifacts-{self.account_id}-{self.env_suffix}-{suffix}'
        )
        bucket = aws.s3.Bucket(
            f'pipeline-artifacts-{self.env_suffix}',
            bucket=bucket_name,
            tags={**self.default_tags, 'Name': f'pipeline-artifacts-{self.env_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Versioning
        aws.s3.BucketVersioning(
            f'pipeline-artifacts-versioning-{self.env_suffix}',
            bucket=bucket.id,
            versioning_configuration={
                'status': 'Enabled'
            },
            opts=ResourceOptions(parent=self)
        )

        # Server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            f'pipeline-artifacts-encryption-{self.env_suffix}',
            bucket=bucket.id,
            rules=[{
                'apply_server_side_encryption_by_default': {
                    'sse_algorithm': 'aws:kms',
                    'kms_master_key_id': self.kms_key.arn
                },
                'bucket_key_enabled': True
            }],
            opts=ResourceOptions(parent=self)
        )

        # Lifecycle configuration
        aws.s3.BucketLifecycleConfiguration(
            f'pipeline-artifacts-lifecycle-{self.env_suffix}',
            bucket=bucket.id,
            rules=[{
                'id': 'expire-old-artifacts',
                'status': 'Enabled',
                'expiration': {'days': 30}
            }],
            opts=ResourceOptions(parent=self)
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f'pipeline-artifacts-public-block-{self.env_suffix}',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        return bucket

    def _create_state_bucket(self) -> aws.s3.Bucket:
        """Create S3 bucket for Pulumi state backend."""
        bucket_name = self.random_suffix.result.apply(
            lambda suffix: f'pulumi-state-{self.account_id}-{self.env_suffix}-{suffix}'
        )
        bucket = aws.s3.Bucket(
            f'pulumi-state-{self.env_suffix}',
            bucket=bucket_name,
            tags={**self.default_tags, 'Name': f'pulumi-state-{self.env_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Versioning
        aws.s3.BucketVersioning(
            f'pulumi-state-versioning-{self.env_suffix}',
            bucket=bucket.id,
            versioning_configuration={
                'status': 'Enabled'
            },
            opts=ResourceOptions(parent=self)
        )

        # Server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            f'pulumi-state-encryption-{self.env_suffix}',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=
                        aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm="aws:kms",
                            kms_master_key_id=self.kms_key.arn
                        ),
                    bucket_key_enabled=True
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f'pulumi-state-public-block-{self.env_suffix}',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        return bucket
    def _create_pulumi_token_param(self, token_value: str) -> aws.ssm.Parameter:
        """Create SSM Parameter for Pulumi access token as SecureString."""
        param = aws.ssm.Parameter(
            f'pulumi-token-{self.env_suffix}',
            name=f'/pulumi/token/{self.env_suffix}',
            type='SecureString',
            value=pulumi.Output.secret(token_value),
            description=f'Pulumi access token for CI/CD pipeline - {self.env_suffix}',
            key_id=self.kms_key.id,
            overwrite=True,
            tags={**self.default_tags, 'Name': f'pulumi-token-{self.env_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        return param

    def _create_pipeline_role(self) -> aws.iam.Role:
        """Create IAM role for CodePipeline with least-privilege permissions."""
        role_name = f'pipeline-role-{self.env_suffix}'
        role = aws.iam.Role(
            f'pipeline-role-{self.env_suffix}',
            name=role_name,
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Action': 'sts:AssumeRole',
                    'Effect': 'Allow',
                    'Principal': {'Service': 'codepipeline.amazonaws.com'}
                }]
            }),
            tags={**self.default_tags, 'Name': f'pipeline-role-{self.env_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Least-privilege policy - specific actions and resources only
        policy = aws.iam.RolePolicy(
            f'pipeline-policy-{self.env_suffix}',
            role=role.id,
            policy=Output.all(
                self.artifact_bucket.arn,
                (self.codebuild_project.arn if hasattr(self, 'codebuild_project')
                 else Output.from_input(
                     f'arn:aws:codebuild:{self.region}:{self.account_id}:'
                     f'project/pulumi-build-{self.env_suffix}'))
            ).apply(lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Action': [
                            's3:GetObject',
                            's3:GetObjectVersion',
                            's3:PutObject',
                            's3:GetBucketLocation',
                            's3:ListBucket'
                        ],
                        'Resource': [
                            args[0],
                            f'{args[0]}/*'
                        ]
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'codebuild:BatchGetBuilds',
                            'codebuild:StartBuild'
                        ],
                        'Resource': ([args[1]] if len(args) > 1 and args[1]
                                     else [f'arn:aws:codebuild:{self.region}:'
                                           f'{self.account_id}:project/'
                                           f'pulumi-build-{self.env_suffix}'])
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        return role

    def _create_codebuild_role(self) -> aws.iam.Role:
        """Create IAM role for CodeBuild with least-privilege permissions."""
        role_name = f'codebuild-role-{self.env_suffix}'
        role = aws.iam.Role(
            f'codebuild-role-{self.env_suffix}',
            name=role_name,
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Action': 'sts:AssumeRole',
                    'Effect': 'Allow',
                    'Principal': {'Service': 'codebuild.amazonaws.com'}
                }]
            }),
            tags={**self.default_tags, 'Name': f'codebuild-role-{self.env_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Least-privilege policy
        policy = aws.iam.RolePolicy(
            f'codebuild-policy-{self.env_suffix}',
            role=role.id,
            policy=Output.all(
                self.artifact_bucket.arn,
                self.state_bucket.arn,
                self.pulumi_token_param.arn
            ).apply(lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'logs:CreateLogStream',
                            'logs:PutLogEvents'
                        ],
                        'Resource': [
                            f'arn:aws:logs:{self.region}:{self.account_id}:'
                            f'log-group:/aws/codebuild/pulumi-build-{self.env_suffix}',
                            f'arn:aws:logs:{self.region}:{self.account_id}:'
                            f'log-group:/aws/codebuild/pulumi-build-{self.env_suffix}:*'
                        ]
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            's3:GetObject',
                            's3:GetObjectVersion',
                            's3:PutObject',
                            's3:ListBucket'
                        ],
                        'Resource': [
                            args[0],
                            f'{args[0]}/*',
                            args[1],
                            f'{args[1]}/*'
                        ]
                    },
                    {
                        'Effect': 'Allow',
                        'Action': ['ssm:GetParameter'],
                        'Resource': [args[2]]
                    },
                    {
                        'Effect': 'Allow',
                        'Action': ['kms:Decrypt'],
                        'Resource': [f'arn:aws:kms:{self.region}:{self.account_id}:key/*']
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        return role

    def _create_log_group(self) -> aws.cloudwatch.LogGroup:
        """Create CloudWatch log group with 14-day retention."""
        log_group_name = self.random_suffix.result.apply(
            lambda suffix: f'/aws/codebuild/pulumi-build-{self.env_suffix}-{suffix}'
        )
        log_group = aws.cloudwatch.LogGroup(
            f'codebuild-logs-{self.env_suffix}',
            name=log_group_name,
            retention_in_days=14,
            tags={**self.default_tags, 'Name': f'codebuild-logs-{self.env_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        return log_group

    def _create_codebuild_project(self) -> aws.codebuild.Project:
        """Create CodeBuild project with complete buildspec for Pulumi execution."""
        # Complete buildspec with all required phases
        buildspec = {
            'version': 0.2,
            'phases': {
                'install': {
                    'runtime-versions': {
                        'python': '3.12'
                    },
                    'commands': [
                        'echo "Installing pipenv..."',
                        'pip install pipenv',
                        'echo "Installing Python dependencies..."',
                        'pipenv install --deploy',
                        'echo "Installing Pulumi CLI..."',
                        'curl -fsSL https://get.pulumi.com | sh -s -- --version 3.207.0',
                        'export PATH=$PATH:$HOME/.pulumi/bin',
                        'pipenv run pulumi version'
                    ]
                },
                'pre_build': {
                    'commands': [
                        'cd lib',
                        'echo "Configuring Pulumi..."',
                        'export PULUMI_ACCESS_TOKEN=$PULUMI_TOKEN',
                        'pipenv run pulumi login',
                        'pipenv run pulumi stack select $PULUMI_STACK || pipenv run pulumi stack init $PULUMI_STACK',
                        'echo "Running Pulumi preview..."',
                        'pipenv run pulumi preview --non-interactive'
                    ]
                },
                'build': {
                    'commands': [
                        'cd lib',
                        'echo "Running Pulumi update..."',
                        'pipenv run pulumi up --yes --non-interactive',
                        'echo "Pulumi deployment complete"'
                    ]
                }
            },
            'artifacts': {
                'files': ['**/*']
            }
        }

        project_name = self.random_suffix.result.apply(
            lambda suffix: f'pulumi-build-{self.env_suffix}-{suffix}'
        )
        project = aws.codebuild.Project(
            f'pulumi-build-{self.env_suffix}',
            name=project_name,
            description=f'CodeBuild project for Pulumi deployments - {self.env_suffix}',
            artifacts={'type': 'CODEPIPELINE'},
            environment={
                'compute_type': 'BUILD_GENERAL1_SMALL',
                'image': 'aws/codebuild/standard:7.0',
                'type': 'LINUX_CONTAINER',
                'environment_variables': [
                    {
                        'name': 'PULUMI_TOKEN',
                        'type': 'PARAMETER_STORE',
                        'value': self.pulumi_token_param.name
                    },
                    {
                        'name': 'PULUMI_STACK',
                        'type': 'PLAINTEXT',
                        'value': self.env_suffix
                    },
                    {
                        'name': 'AWS_REGION',
                        'type': 'PLAINTEXT',
                        'value': self.region
                    },
                    {
                        'name': 'PULUMI_BACKEND_URL',
                        'type': 'PLAINTEXT',
                        'value': self.state_bucket.bucket.apply(lambda b: f's3://{b}?region={self.region}')
                    }
                ]
            },
            source={
                'type': 'CODEPIPELINE',
                'buildspec': json.dumps(buildspec)
            },
            service_role=self.codebuild_role.arn,
            logs_config={
                'cloudwatch_logs': {
                    'status': 'ENABLED',
                    'group_name': self.log_group.name
                }
            },
            tags={**self.default_tags, 'Name': f'pulumi-build-{self.env_suffix}'},
            opts=ResourceOptions(parent=self, depends_on=[self.log_group, self.codebuild_role])
        )

        return project

    def _create_sns_topic(self):
        """Create SNS topic with email subscription for notifications."""
        topic_name = self.random_suffix.result.apply(
            lambda suffix: f'pipeline-notifications-{self.env_suffix}-{suffix}'
        )
        topic = aws.sns.Topic(
            f'pipeline-notifications-{self.env_suffix}',
            name=topic_name,
            kms_master_key_id=self.kms_key.id,
            tags=self.random_suffix.result.apply(
                lambda suffix: {**self.default_tags, 'Name': f'pipeline-notifications-{self.env_suffix}-{suffix}'}
            ),
            opts=ResourceOptions(parent=self)
        )

        # Email subscription
        subscription = aws.sns.TopicSubscription(
            f'pipeline-email-subscription-{self.env_suffix}',
            topic=topic.arn,
            protocol='email',
            endpoint=self.notification_email,
            opts=ResourceOptions(parent=self)
        )

        return topic, subscription

    def _create_pipeline(self) -> aws.codepipeline.Pipeline:
        """Create CodePipeline with 3 stages: Source, Build, Deploy."""
        pipeline_name = self.random_suffix.result.apply(
            lambda suffix: f'pulumi-cicd-pipeline-{self.env_suffix}-{suffix}'
        )
        pipeline = aws.codepipeline.Pipeline(
            f'pulumi-cicd-pipeline-{self.env_suffix}',
            name=pipeline_name,
            role_arn=self.pipeline_role.arn,
            artifact_stores=[{
                'location': self.artifact_bucket.bucket,
                'type': 'S3',
                'encryption_key': {
                    'id': self.kms_key.arn,
                    'type': 'KMS'
                }
            }],
            stages=[
                {
                    'name': 'Source',
                    'actions': [{
                        'name': 'SourceAction',
                        'category': 'Source',
                        'owner': 'AWS',                               
                        'provider': 'CodeStarSourceConnection',       
                        'version': '1',                               
                        'output_artifacts': ['source_output'],
                        'configuration': {
                            'ConnectionArn': self.github_connection_arn,  
                            'FullRepositoryId': f'{self.github_owner}/{self.github_repo}',
                            'BranchName': self.github_branch,
                        },
                    }]
                },
                {
                    'name': 'Build',
                    'actions': [{
                        'name': 'BuildAction',
                        'category': 'Build',
                        'owner': 'AWS',
                        'provider': 'CodeBuild',
                        'version': '1',
                        'input_artifacts': ['source_output'],
                        'output_artifacts': ['build_output'],
                        'configuration': {
                            'ProjectName': self.codebuild_project.name
                        }
                    }]
                },
                {
                    'name': 'Deploy',
                    'actions': [{
                        'name': 'ManualApproval',
                        'category': 'Approval',
                        'owner': 'AWS',
                        'provider': 'Manual',
                        'version': '1',
                        'configuration': {
                            'NotificationArn': self.sns_topic.arn,
                            'CustomData': 'Please review and approve the Pulumi deployment'
                        }
                    }]
                }
            ],
            tags={**self.default_tags, 'Name': f'pulumi-pipeline-{self.env_suffix}'},

            opts=ResourceOptions(
                parent=self,
                depends_on=[self.pipeline_role, self.codebuild_project, self.sns_topic]
            )
        )

        return pipeline

    def _create_notification_rule(self) -> aws.codestarnotifications.NotificationRule:
        """Create notification rule to send pipeline failures to SNS."""
        notification_rule_name = self.random_suffix.result.apply(
            lambda suffix: f'pipeline-failures-{self.env_suffix}-{suffix}'
        )
        rule = aws.codestarnotifications.NotificationRule(
            f'pipeline-notification-rule-{self.env_suffix}',
            name=notification_rule_name,
            detail_type='FULL',
            resource=self.pipeline.arn,
            event_type_ids=[
                'codepipeline-pipeline-pipeline-execution-failed',
                'codepipeline-pipeline-pipeline-execution-canceled',
                'codepipeline-pipeline-pipeline-execution-superseded'
            ],
            targets=[{
                'address': self.sns_topic.arn,
                'type': 'SNS'
            }],
            tags={**self.default_tags, 'Name': f'pipeline-notification-rule-{self.env_suffix}'},
            opts=ResourceOptions(parent=self, depends_on=[self.pipeline, self.sns_topic])
        )

        return rule
