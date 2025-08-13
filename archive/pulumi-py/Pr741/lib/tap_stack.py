import json
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import Config, ResourceOptions


class TapStackArgs:
  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags

class TapStack(pulumi.ComponentResource):  # pylint: disable=too-many-instance-attributes
  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__('tap:stack:TapStack', name, None, opts)
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

    # Register outputs with proper handling of Output objects
    outputs = {
      "pipelineName": self.pipeline_name,
      "artifactsBucket": self.artifacts_bucket.bucket,
      "buildProjectName": self.build_project.name,
      "notificationsTopicArn": self.notifications_topic.arn,
      "chatbotEnabled": self.slack_enabled,
    }
    
    # Handle chatbot config conditionally
    if self.chatbot_config:
      outputs["chatbotConfigName"] = self.chatbot_config.configuration_name
    else:
      outputs["chatbotConfigName"] = "disabled"
      
    self.register_outputs(outputs)

  def _load_config(self) -> None:
    """Load all configuration values from Pulumi Config with safe defaults"""
    self.config = Config()
    
    # Corporate prefix and naming
    self.name_prefix = self.config.get("namePrefix") or "corp"
    self.resource_name_prefix = f"{self.name_prefix}-{self.environment_suffix}"
    
    # AWS Region configuration - target region vs backend region
    self.target_region = self.config.get("aws.region") or "us-west-2"
    self.backend_region = self.config.get("aws.backendRegion") or "us-east-1"
    
    # GitHub configuration with safe defaults
    self.github_owner = self.config.get("github.owner") or "placeholder-owner"
    self.github_repo = self.config.get("github.repo") or "placeholder-repo"
    self.github_branch = self.config.get("github.branch") or "main"
    self.github_connection_arn = self.config.get("github.connectionArn")
    
    # Deployment configuration
    self.deploy_target_bucket = (
      self.config.get("deploy.targetBucketName") or 
      f"{self.resource_name_prefix}-deploy-target"
    )
    
    # RBAC configuration with safe JSON parsing
    approver_arns_str = self.config.get("rbac.approverArns") or "[]"
    try:
      if isinstance(approver_arns_str, str):
        self.rbac_approver_arns = json.loads(approver_arns_str)
      else:
        self.rbac_approver_arns = approver_arns_str or []
    except json.JSONDecodeError:
      pulumi.log.warn(
        f"Invalid JSON for rbac.approverArns: {approver_arns_str}, using empty list"
      )
      self.rbac_approver_arns = []
    
    # Slack configuration with safe defaults
    self.slack_workspace_id = self.config.get("slack.workspaceId") or "T099JAU1EDT"
    self.slack_channel_id = self.config.get("slack.channelId") or "C0995LYSAKH"
    slack_enabled_str = self.config.get("slack.enabled") or 'false'
    self.slack_enabled = slack_enabled_str.lower() == 'true'
    
    # Build configuration
    self.buildspec_content = self.config.get("build.buildspec") or self._get_default_buildspec()

  def _get_default_buildspec(self) -> str:
    """Return default buildspec YAML content"""
    return """version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - echo Build started on `date`
      - echo Installing dependencies...
  build:
    commands:
      - echo Build phase started on `date`
      - echo Building the application...
      # Add your build commands here
      - echo Build completed on `date`
  post_build:
    commands:
      - echo Post-build phase started on `date`
      - echo Build completed successfully
artifacts:
  files:
    - '**/*'
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
      opts=ResourceOptions(parent=self, depends_on=[self.artifacts_bucket])
    )
      
    # Enable server-side encryption (using V2 for latest provider)
    # Create encryption configuration
    sse_default_cls = (
      aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs
    )
    sse_default_args = sse_default_cls(
      sse_algorithm="AES256"   # or "aws:kms"
      # kms_master_key_id=kms_key.arn,  # uncomment if using KMS
    )
    encryption_rule = aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
      apply_server_side_encryption_by_default=sse_default_args
    )
    aws.s3.BucketServerSideEncryptionConfigurationV2(
      f"{self.resource_name_prefix}-artifacts-bucket-encryption",
      bucket=self.artifacts_bucket.id,
      rules=[encryption_rule],
      opts=ResourceOptions(parent=self, depends_on=[self.artifacts_bucket]),
    )



    # Enable versioning for artifact integrity  
    aws.s3.BucketVersioningV2(
      f"{self.resource_name_prefix}-artifacts-bucket-versioning",
      bucket=self.artifacts_bucket.id,
      versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled"
      ),
      opts=ResourceOptions(parent=self, depends_on=[self.artifacts_bucket])
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
    
    # Store the policy creation for later after CodeStar connection is created
    self._pipeline_policy_bucket_arn = self.artifacts_bucket.arn
    self._pipeline_policy_role = self.pipeline_role
    
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
      opts=ResourceOptions(parent=self, depends_on=[self.artifacts_bucket])
    )
    
    # CodeBuild Policy - Least privilege access
    def create_codebuild_policy(bucket_arn):
      return json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
            ],
            "Resource": (
              f"arn:aws:logs:{self.target_region}:*:log-group:"
              f"/aws/codebuild/{self.resource_name_prefix}-*"
            )
          },
          {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:GetObjectVersion",
              "s3:PutObject"
            ],
            "Resource": [
              f"{bucket_arn}/*"
            ]
          },
          {
            "Effect": "Allow",
            "Action": [
              "s3:ListBucket"
            ],
            "Resource": [
              bucket_arn
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
            "Resource": f"arn:aws:secretsmanager:{self.target_region}:*:secret:*",
            "Condition": {
              "StringEquals": {
                "secretsmanager:ResourceTag/Project": "IaC - AWS Nova Model Breaking"
              }
            }
          }
        ]
      })
    
    aws.iam.RolePolicy(
      f"{self.resource_name_prefix}-codebuild-policy",
      role=self.codebuild_role.id,
      policy=self.artifacts_bucket.arn.apply(create_codebuild_policy),
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
    
    # Now create the pipeline policy with the CodeStar connection ARN
    def create_pipeline_policy(args):
      bucket_arn, connection_arn = args
      return json.dumps({
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
              bucket_arn,
              f"{bucket_arn}/*"
            ]
          },
          {
            "Effect": "Allow",
            "Action": [
              "codebuild:BatchGetBuilds",
              "codebuild:StartBuild"
            ],
            "Resource": [
              f"arn:aws:codebuild:{self.target_region}:*:project/{self.resource_name_prefix}-*"
            ]
          },
          {
            "Effect": "Allow",
            "Action": [
              "codestar-connections:UseConnection"
            ],
            "Resource": connection_arn
          }
        ]
      })
    
    # Create the pipeline policy now that we have the connection ARN
    aws.iam.RolePolicy(
      f"{self.resource_name_prefix}-codepipeline-policy",
      role=self._pipeline_policy_role.id,
      policy=pulumi.Output.all(
        self._pipeline_policy_bucket_arn, self.codestar_connection_arn
      ).apply(create_pipeline_policy),
      opts=ResourceOptions(parent=self)
    )

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
            value=self.target_region
          ),
          aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
            name="AWS_ACCOUNT_ID",
            value=aws.get_caller_identity().account_id
          ),
          aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
            name="ENVIRONMENT",
            value=self.environment_suffix
          ),
          aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
            name="ENVIRONMENT_SUFFIX",
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
      opts=ResourceOptions(parent=self, depends_on=[self.codebuild_role, build_log_group])
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
  pre_build:
    commands:
      - echo Deploy started on `date`
      - echo Syncing to S3 bucket {self.deploy_target_bucket}
  build:
    commands:
      - aws s3 sync . s3://{self.deploy_target_bucket}/ --delete --exclude "*.git*"
  post_build:
    commands:
      - echo Deploy completed on `date`
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
            value=self.target_region
          ),
          aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
            name="DEPLOY_BUCKET",
            value=self.deploy_target_bucket
          ),
          aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
            name="ENVIRONMENT_SUFFIX",
            value=self.environment_suffix
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
      opts=ResourceOptions(parent=self, depends_on=[self.codebuild_role, deploy_log_group])
    )

  def _create_codepipeline(self) -> None:
    """Create CodePipeline with Source, Build, Manual Approval, and Deploy stages"""
    
    pipeline_name = f"{self.resource_name_prefix}-codepipeline"
    self.pipeline_name = pipeline_name
    
    self.pipeline = aws.codepipeline.Pipeline(
      f"{self.resource_name_prefix}-pipeline",
      name=pipeline_name,
      role_arn=self.pipeline_role.arn,
      artifact_stores=[
        aws.codepipeline.PipelineArtifactStoreArgs(
          location=self.artifacts_bucket.bucket,
          type="S3",
          
        )
      ],
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
                "CustomData": (
                  f"Please review and approve the deployment for {self.github_repo} "
                  f"to {self.environment_suffix} environment."
                )
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
      opts=ResourceOptions(parent=self, depends_on=[
        self.pipeline_role, 
        self.artifacts_bucket, 
        self.build_project, 
        self.deploy_project,
        self.codestar_connection if hasattr(self, 'codestar_connection') else None
      ])
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
    if self.slack_enabled:
      
      
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
    else:
      self.chatbot_config = None
    
    # CodeStar Notifications Rule for Pipeline State Changes  
    aws.codestarnotifications.NotificationRule(
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
    def create_topic_policy(args):
      topic_arn, account_id = args
      return json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Sid": "AllowCodeStarNotifications",
            "Effect": "Allow",
            "Principal": {"Service": "codestar-notifications.amazonaws.com"},
            "Action": "SNS:Publish",
            "Resource": topic_arn,
            "Condition": {
              "StringEquals": {
                "aws:SourceAccount": account_id
              }
            }
          }
        ]
      })
    
    aws.sns.TopicPolicy(
      f"{self.resource_name_prefix}-notifications-topic-policy",
      arn=self.notifications_topic.arn,
      policy=pulumi.Output.all(
        self.notifications_topic.arn, aws.get_caller_identity().account_id
      ).apply(create_topic_policy),
      opts=ResourceOptions(parent=self)
    )

  def _enforce_rbac(self) -> None:
    """Create IAM policies to enforce role-based access control for pipeline operations"""
    
    if not self.rbac_approver_arns:
      # If no approvers specified, create a policy document for reference
      # but don't attach it to avoid empty principal errors
      def create_empty_rbac_policy(pipeline_arn):
        return json.dumps({
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AllowPipelineExecution",
              "Effect": "Allow",
              "Action": [
                "codepipeline:StartPipelineExecution"
              ],
              "Resource": pipeline_arn
              #"Principal": {"AWS": "arn:aws:iam::root"}  # Placeholder
            },
            {
              "Sid": "AllowManualApproval",
              "Effect": "Allow",
              "Action": [
                "codepipeline:PutApprovalResult"
              ],
              "Resource": f"{pipeline_arn}/*/*"
              #"Principal": {"AWS": "arn:aws:iam::root"}  # Placeholder
            }
          ]
        })
      
      # Create the policy for documentation purposes
      self.rbac_policy = aws.iam.Policy(
        f"{self.resource_name_prefix}-rbac-policy",
        name=f"{self.resource_name_prefix}-pipeline-rbac",
        description="RBAC policy for pipeline operations - attach to appropriate principals",
        policy=self.pipeline.arn.apply(create_empty_rbac_policy),
        tags={**self.tags, "Purpose": "Pipeline RBAC"},
        opts=ResourceOptions(parent=self)
      )
      
      return
    
    # Create RBAC policy for pipeline operations
    def create_rbac_policy(pipeline_arn):
      return json.dumps({
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
            "Resource": pipeline_arn
          },
          {
            "Sid": "AllowManualApproval",
            "Effect": "Allow",
            "Action": [
              "codepipeline:PutApprovalResult",
              "codepipeline:GetPipelineExecution"
            ],
            "Resource": f"{pipeline_arn}/*/*"
          }
        ]
      })
    
    # Create the RBAC policy
    self.rbac_policy = aws.iam.Policy(
      f"{self.resource_name_prefix}-rbac-policy",
      name=f"{self.resource_name_prefix}-pipeline-rbac",
      description="RBAC policy for pipeline operations",
      policy=self.pipeline.arn.apply(create_rbac_policy),
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
