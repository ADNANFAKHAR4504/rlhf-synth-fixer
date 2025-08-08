from typing import Optional, List, Dict
import pulumi
from import ResourceOptions, Output, Config
import pulumi_aws as aws
import json

class TapStackArgs:
def **init**(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
self.environment_suffix = environment_suffix or 'dev'
self.tags = tags

class TapStack(pulumi.ComponentResource):
def **init**(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
super().**init**('tap:stack:TapStack', name, None, opts)
self.environment_suffix = args.environment_suffix
self.tags = args.tags or {}

        # Initialize instance variables
        self.config = None
        self.name_prefix = None
        self.resource_name_prefix = None
        self.artifacts_bucket = None
        self.pipeline_role = None
        self.codebuild_role = None
        self.notifications_role = None
        self.codestar_connection = None
        self.build_project = None
        self.deploy_project = None
        self.pipeline = None
        self.pipeline_name = None
        self.notifications_topic = None
        self.chatbot_config = None

        # 1) load config
        self._load_config()

        # 2) infra creation orchestration
        self._create_artifacts_bucket()
        self._create_service_roles()
        self._create_codestar_connection()
        self._create_codebuild_project()
        self._create_codepipeline()
        self._create_notifications()
        self._enforce_rbac()

        self.register_outputs({
            "pipelineName": self.pipeline_name,
            "artifactsBucket": self.artifacts_bucket.bucket,
            "buildProjectName": self.build_project.name,
            "notificationsTopicArn": self.notifications_topic.arn,
            "chatbotConfigName": self.chatbot_config.name,
        })

    def _load_config(self) -> None:
        """Load all configuration values from Pulumi Config"""
        self.config = Config()

        # Corporate prefix and naming
        self.name_prefix = self.config.get("namePrefix") or "corp"
        self.resource_name_prefix = f"{self.name_prefix}-{self.environment_suffix}"

        # GitHub configuration
        self.github_owner = self.config.require("github.owner")
        self.github_repo = self.config.require("github.repo")
        self.github_branch = self.config.get("github.branch") or "main"
        self.github_connection_arn = self.config.get("github.connectionArn")

        # Deployment configuration
        self.deploy_target_bucket = self.config.get("deploy.targetBucketName") or f"{self.resource_name_prefix}-deploy-target"

        # RBAC configuration
        approver_arns_str = self.config.get("rbac.approverArns") or "[]"
        self.rbac_approver_arns = json.loads(approver_arns_str) if isinstance(approver_arns_str, str) else approver_arns_str

        # Slack configuration
        self.slack_workspace_id = self.config.require("slack.workspaceId")
        self.slack_channel_id = self.config.require("slack.channelId")

        # Build configuration
        self.buildspec_content = self.config.get("build.buildspec") or self._get_default_buildspec()

    def _get_default_buildspec(self) -> str:
        """Return default buildspec YAML content"""
        return """version: 0.2

phases:
pre*build:
commands: - echo Logging in to Amazon ECR... - echo Build started on `date` - echo Installing dependencies...
build:
commands: - echo Build phase started on `date` - echo Building the application... # Add your build commands here - echo Build completed on `date`
post_build:
commands: - echo Post-build phase started on `date` - echo Build completed successfully
artifacts:
files: - '\**/\_'
name: BuildArtifacts
"""

    def _create_artifacts_bucket(self) -> None:
        """Create S3 bucket for pipeline artifacts with security best practices"""
        bucket_name = f"{self.resource_name_prefix}-codepipeline-artifacts"

        # Create the artifacts bucket
        self.artifacts_bucket = aws.s3.Bucket(
            f"{self.resource_name_prefix}-artifacts-bucket",
            bucket=bucket_name,
            force_destroy=True,  # For development; consider removing for production
            tags={**self.tags, "Purpose": "CodePipeline Artifacts"},
            opts=ResourceOptions(parent=self)
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"{self.resource_name_prefix}-artifacts-bucket-pab",
            bucket=self.artifacts_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"{self.resource_name_prefix}-artifacts-bucket-encryption",
            bucket=self.artifacts_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )],
            opts=ResourceOptions(parent=self)
        )

        # Enable versioning for artifact integrity
        aws.s3.BucketVersioning(
            f"{self.resource_name_prefix}-artifacts-bucket-versioning",
            bucket=self.artifacts_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self)
        )

    def _create_service_roles(self) -> None:
        """Create IAM roles and policies for CodePipeline, CodeBuild, and Notifications"""

        # CodePipeline Service Role
        pipeline_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "codepipeline.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        self.pipeline_role = aws.iam.Role(
            f"{self.resource_name_prefix}-codepipeline-role",
            assume_role_policy=json.dumps(pipeline_assume_role_policy),
            tags={**self.tags, "Purpose": "CodePipeline Service Role"},
            opts=ResourceOptions(parent=self)
        )

        # CodePipeline Policy - Least privilege access
        pipeline_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetBucketVersioning",
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:PutObject"
                    ],
                    "Resource": [
                        self.artifacts_bucket.arn,
                        self.artifacts_bucket.arn.apply(lambda arn: f"{arn}/*")
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "codebuild:BatchGetBuilds",
                        "codebuild:StartBuild"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "codestar-connections:UseConnection"
                    ],
                    "Resource": "*"
                }
            ]
        }

        aws.iam.RolePolicy(
            f"{self.resource_name_prefix}-codepipeline-policy",
            role=self.pipeline_role.id,
            policy=pulumi.Output.all(self.artifacts_bucket.arn).apply(
                lambda args: json.dumps(pipeline_policy)
            ),
            opts=ResourceOptions(parent=self)
        )

        # CodeBuild Service Role
        codebuild_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "codebuild.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        self.codebuild_role = aws.iam.Role(
            f"{self.resource_name_prefix}-codebuild-role",
            assume_role_policy=json.dumps(codebuild_assume_role_policy),
            tags={**self.tags, "Purpose": "CodeBuild Service Role"},
            opts=ResourceOptions(parent=self)
        )

        # CodeBuild Policy - Least privilege access
        codebuild_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"arn:aws:logs:us-west-2:*:log-group:/aws/codebuild/{self.resource_name_prefix}-*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:PutObject"
                    ],
                    "Resource": [
                        self.artifacts_bucket.arn.apply(lambda arn: f"{arn}/*")
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        self.artifacts_bucket.arn
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:PutObjectAcl",
                        "s3:GetObject",
                        "s3:DeleteObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{self.deploy_target_bucket}",
                        f"arn:aws:s3:::{self.deploy_target_bucket}/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "secretsmanager:ResourceTag/Project": "IaC - AWS Nova Model Breaking"
                        }
                    }
                }
            ]
        }

        aws.iam.RolePolicy(
            f"{self.resource_name_prefix}-codebuild-policy",
            role=self.codebuild_role.id,
            policy=pulumi.Output.all(self.artifacts_bucket.arn).apply(
                lambda args: json.dumps(codebuild_policy)
            ),
            opts=ResourceOptions(parent=self)
        )

        # Notifications Role for AWS Chatbot
        notifications_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "chatbot.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        self.notifications_role = aws.iam.Role(
            f"{self.resource_name_prefix}-notifications-role",
            assume_role_policy=json.dumps(notifications_assume_role_policy),
            tags={**self.tags, "Purpose": "Chatbot Notifications Role"},
            opts=ResourceOptions(parent=self)
        )

        # Attach AWS managed policy for Chatbot
        aws.iam.RolePolicyAttachment(
            f"{self.resource_name_prefix}-notifications-policy-attachment",
            role=self.notifications_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess",
            opts=ResourceOptions(parent=self)
        )

    def _create_codestar_connection(self) -> None:
        """Create or reference CodeStar Connection for GitHub integration"""
        if self.github_connection_arn:
            # Use existing connection ARN from config
            self.codestar_connection_arn = self.github_connection_arn
        else:
            # Create new CodeStar Connection
            self.codestar_connection = aws.codestarconnections.Connection(
                f"{self.resource_name_prefix}-github-connection",
                name=f"{self.resource_name_prefix}-github-connection",
                provider_type="GitHub",
                tags={**self.tags, "Purpose": "GitHub Integration"},
                opts=ResourceOptions(parent=self)
            )
            self.codestar_connection_arn = self.codestar_connection.arn

    def _create_codebuild_project(self) -> None:
        """Create CodeBuild projects for build and deploy stages"""

        # CloudWatch Log Group for build project
        build_log_group = aws.cloudwatch.LogGroup(
            f"{self.resource_name_prefix}-codebuild-logs",
            name=f"/aws/codebuild/{self.resource_name_prefix}-build",
            retention_in_days=14,
            tags={**self.tags, "Purpose": "CodeBuild Logs"},
            opts=ResourceOptions(parent=self)
        )

        # Build Project
        self.build_project = aws.codebuild.Project(
            f"{self.resource_name_prefix}-build-project",
            name=f"{self.resource_name_prefix}-build",
            description="Build project for IaC - AWS Nova Model Breaking",
            service_role=self.codebuild_role.arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type="CODEPIPELINE"
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type="BUILD_GENERAL1_SMALL",
                image="aws/codebuild/amazonlinux2-x86_64-standard:3.0",
                type="LINUX_CONTAINER",
                environment_variables=[
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="AWS_DEFAULT_REGION",
                        value="us-west-2"
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="AWS_ACCOUNT_ID",
                        value=aws.get_caller_identity().account_id
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="ENVIRONMENT",
                        value=self.environment_suffix
                    )
                ]
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type="CODEPIPELINE",
                buildspec=self.buildspec_content
            ),
            logs_config=aws.codebuild.ProjectLogsConfigArgs(
                cloudwatch_logs=aws.codebuild.ProjectLogsConfigCloudwatchLogsArgs(
                    status="ENABLED",
                    group_name=build_log_group.name
                )
            ),
            tags={**self.tags, "Purpose": "Build Stage"},
            opts=ResourceOptions(parent=self)
        )

        # Deploy Project CloudWatch Log Group
        deploy_log_group = aws.cloudwatch.LogGroup(
            f"{self.resource_name_prefix}-deploy-logs",
            name=f"/aws/codebuild/{self.resource_name_prefix}-deploy",
            retention_in_days=14,
            tags={**self.tags, "Purpose": "CodeBuild Deploy Logs"},
            opts=ResourceOptions(parent=self)
        )

        # Deploy buildspec for S3 sync
        deploy_buildspec = f"""version: 0.2

phases:
pre*build:
commands: - echo Deploy started on `date` - echo Syncing to S3 bucket {self.deploy_target_bucket}
build:
commands: - aws s3 sync . s3://{self.deploy_target_bucket}/ --delete --exclude "*.git\_"
post_build:
commands: - echo Deploy completed on `date`
"""

        # Deploy Project
        self.deploy_project = aws.codebuild.Project(
            f"{self.resource_name_prefix}-deploy-project",
            name=f"{self.resource_name_prefix}-deploy",
            description="Deploy project for IaC - AWS Nova Model Breaking",
            service_role=self.codebuild_role.arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type="CODEPIPELINE"
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type="BUILD_GENERAL1_SMALL",
                image="aws/codebuild/amazonlinux2-x86_64-standard:3.0",
                type="LINUX_CONTAINER",
                environment_variables=[
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="AWS_DEFAULT_REGION",
                        value="us-west-2"
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="DEPLOY_BUCKET",
                        value=self.deploy_target_bucket
                    )
                ]
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type="CODEPIPELINE",
                buildspec=deploy_buildspec
            ),
            logs_config=aws.codebuild.ProjectLogsConfigArgs(
                cloudwatch_logs=aws.codebuild.ProjectLogsConfigCloudwatchLogsArgs(
                    status="ENABLED",
                    group_name=deploy_log_group.name
                )
            ),
            tags={**self.tags, "Purpose": "Deploy Stage"},
            opts=ResourceOptions(parent=self)
        )

    def _create_codepipeline(self) -> None:
        """Create CodePipeline with Source, Build, Manual Approval, and Deploy stages"""

        pipeline_name = f"{self.resource_name_prefix}-codepipeline"
        self.pipeline_name = pipeline_name

        self.pipeline = aws.codepipeline.Pipeline(
            f"{self.resource_name_prefix}-pipeline",
            name=pipeline_name,
            role_arn=self.pipeline_role.arn,
            artifact_store=aws.codepipeline.PipelineArtifactStoreArgs(
                location=self.artifacts_bucket.bucket,
                type="S3"
            ),
            stages=[
                # Source Stage - GitHub via CodeStar Connections
                aws.codepipeline.PipelineStageArgs(
                    name="Source",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="Source",
                            category="Source",
                            owner="AWS",
                            provider="CodeStarSourceConnection",
                            version="1",
                            output_artifacts=["SourceOutput"],
                            configuration={
                                "ConnectionArn": self.codestar_connection_arn,
                                "FullRepositoryId": f"{self.github_owner}/{self.github_repo}",
                                "BranchName": self.github_branch,
                                "OutputArtifactFormat": "CODE_ZIP"
                            }
                        )
                    ]
                ),
                # Build Stage
                aws.codepipeline.PipelineStageArgs(
                    name="Build",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="Build",
                            category="Build",
                            owner="AWS",
                            provider="CodeBuild",
                            version="1",
                            input_artifacts=["SourceOutput"],
                            output_artifacts=["BuildOutput"],
                            configuration={
                                "ProjectName": self.build_project.name
                            }
                        )
                    ]
                ),
                # Manual Approval Stage
                aws.codepipeline.PipelineStageArgs(
                    name="Approval",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="ManualApproval",
                            category="Approval",
                            owner="AWS",
                            provider="Manual",
                            version="1",
                            configuration={
                                "CustomData": f"Please review and approve the deployment for {self.github_repo} to {self.environment_suffix} environment."
                            }
                        )
                    ]
                ),
                # Deploy Stage
                aws.codepipeline.PipelineStageArgs(
                    name="Deploy",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="Deploy",
                            category="Build",
                            owner="AWS",
                            provider="CodeBuild",
                            version="1",
                            input_artifacts=["BuildOutput"],
                            configuration={
                                "ProjectName": self.deploy_project.name
                            }
                        )
                    ]
                )
            ],
            tags={**self.tags, "Purpose": "CI/CD Pipeline"},
            opts=ResourceOptions(parent=self)
        )

    def _create_notifications(self) -> None:
        """Create SNS topic, AWS Chatbot configuration, and CodeStar Notifications"""

        # SNS Topic for notifications
        self.notifications_topic = aws.sns.Topic(
            f"{self.resource_name_prefix}-notifications-topic",
            name=f"{self.resource_name_prefix}-pipeline-notifications",
            tags={**self.tags, "Purpose": "Pipeline Notifications"},
            opts=ResourceOptions(parent=self)
        )

        # AWS Chatbot Slack Channel Configuration
        self.chatbot_config = aws.chatbot.SlackChannelConfiguration(
            f"{self.resource_name_prefix}-chatbot-config",
            configuration_name=f"{self.resource_name_prefix}-slack-notifications",
            iam_role_arn=self.notifications_role.arn,
            slack_channel_id=self.slack_channel_id,
            slack_team_id=self.slack_workspace_id,
            sns_topic_arns=[self.notifications_topic.arn],
            logging_level="INFO",
            tags={**self.tags, "Purpose": "Slack Notifications"},
            opts=ResourceOptions(parent=self)
        )

        # CodeStar Notifications Rule for Pipeline State Changes
        pipeline_notification_rule = aws.codestarnotifications.NotificationRule(
            f"{self.resource_name_prefix}-pipeline-notifications",
            name=f"{self.resource_name_prefix}-pipeline-notifications",
            detail_type="FULL",
            event_type_ids=[
                "codepipeline-pipeline-pipeline-execution-failed",
                "codepipeline-pipeline-pipeline-execution-succeeded",
                "codepipeline-pipeline-stage-execution-failed",
                "codepipeline-pipeline-stage-execution-succeeded",
                "codepipeline-pipeline-manual-approval-needed"
            ],
            resource=self.pipeline.arn,
            targets=[
                aws.codestarnotifications.NotificationRuleTargetArgs(
                    address=self.notifications_topic.arn,
                    type="SNS"
                )
            ],
            tags={**self.tags, "Purpose": "Pipeline State Notifications"},
            opts=ResourceOptions(parent=self)
        )

        # SNS Topic Policy to allow CodeStar Notifications to publish
        topic_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AllowCodeStarNotifications",
                    "Effect": "Allow",
                    "Principal": {"Service": "codestar-notifications.amazonaws.com"},
                    "Action": "SNS:Publish",
                    "Resource": self.notifications_topic.arn,
                    "Condition": {
                        "StringEquals": {
                            "aws:SourceAccount": aws.get_caller_identity().account_id
                        }
                    }
                }
            ]
        }

        aws.sns.TopicPolicy(
            f"{self.resource_name_prefix}-notifications-topic-policy",
            arn=self.notifications_topic.arn,
            policy=pulumi.Output.all(self.notifications_topic.arn).apply(
                lambda args: json.dumps(topic_policy)
            ),
            opts=ResourceOptions(parent=self)
        )

    def _enforce_rbac(self) -> None:
        """Create IAM policies to enforce role-based access control for pipeline operations"""

        if not self.rbac_approver_arns:
            # If no approvers specified, create a policy document for reference
            # but don't attach it to avoid empty principal errors
            rbac_policy_doc = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AllowPipelineExecution",
                        "Effect": "Allow",
                        "Action": [
                            "codepipeline:StartPipelineExecution"
                        ],
                        "Resource": self.pipeline.arn,
                        "Principal": {"AWS": "arn:aws:iam::root"}  # Placeholder
                    },
                    {
                        "Sid": "AllowManualApproval",
                        "Effect": "Allow",
                        "Action": [
                            "codepipeline:PutApprovalResult"
                        ],
                        "Resource": self.pipeline.arn.apply(lambda arn: f"{arn}/*/*"),
                        "Principal": {"AWS": "arn:aws:iam::root"}  # Placeholder
                    }
                ]
            }

            # Create the policy for documentation purposes
            self.rbac_policy = aws.iam.Policy(
                f"{self.resource_name_prefix}-rbac-policy",
                name=f"{self.resource_name_prefix}-pipeline-rbac",
                description="RBAC policy for pipeline operations - attach to appropriate principals",
                policy=pulumi.Output.all(self.pipeline.arn).apply(
                    lambda args: json.dumps(rbac_policy_doc)
                ),
                tags={**self.tags, "Purpose": "Pipeline RBAC"},
                opts=ResourceOptions(parent=self)
            )

            return

        # Create RBAC policy for pipeline operations
        rbac_policy_doc = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AllowPipelineExecution",
                    "Effect": "Allow",
                    "Action": [
                        "codepipeline:StartPipelineExecution",
                        "codepipeline:GetPipeline",
                        "codepipeline:GetPipelineExecution",
                        "codepipeline:GetPipelineState"
                    ],
                    "Resource": self.pipeline.arn
                },
                {
                    "Sid": "AllowManualApproval",
                    "Effect": "Allow",
                    "Action": [
                        "codepipeline:PutApprovalResult",
                        "codepipeline:GetPipelineExecution"
                    ],
                    "Resource": self.pipeline.arn.apply(lambda arn: f"{arn}/*/*")
                }
            ]
        }

        # Create the RBAC policy
        self.rbac_policy = aws.iam.Policy(
            f"{self.resource_name_prefix}-rbac-policy",
            name=f"{self.resource_name_prefix}-pipeline-rbac",
            description="RBAC policy for pipeline operations",
            policy=pulumi.Output.all(self.pipeline.arn).apply(
                lambda args: json.dumps(rbac_policy_doc)
            ),
            tags={**self.tags, "Purpose": "Pipeline RBAC"},
            opts=ResourceOptions(parent=self)
        )

        # Create a group for approvers and attach the policy
        approvers_group = aws.iam.Group(
            f"{self.resource_name_prefix}-approvers-group",
            name=f"{self.resource_name_prefix}-pipeline-approvers",
            opts=ResourceOptions(parent=self)
        )

        aws.iam.GroupPolicyAttachment(
            f"{self.resource_name_prefix}-approvers-policy-attachment",
            group=approvers_group.name,
            policy_arn=self.rbac_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        # Note: In a real-world scenario, you would need to add the specified
        # IAM users/roles to this group or directly attach the policy to them.
        # This implementation creates the infrastructure; the actual assignment
        # of principals should be done through additional IAM operations.
