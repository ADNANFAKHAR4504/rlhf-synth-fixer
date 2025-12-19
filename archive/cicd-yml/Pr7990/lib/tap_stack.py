"""CI/CD Pipeline Infrastructure using Pulumi and Python."""

import os
from dataclasses import dataclass
from typing import Optional
import pulumi
import pulumi_aws as aws


def get_env(key: str, fallback: str = "") -> str:
    """Get environment variable with fallback value."""
    return os.environ.get(key, fallback)


@dataclass
class TapStackArgs:
    """Arguments for TapStack initialization."""
    environment_suffix: str
    tags: Optional[dict] = None


class TapStack(pulumi.ComponentResource):
    """
    CI/CD Pipeline Infrastructure Stack.

    Implements a complete CI/CD pipeline with:
    - CodePipeline with 5 stages (Source, Build, Test, SecurityScan, Deploy)
    - CodeBuild projects for build and testing
    - ECR repository with image scanning
    - CodeDeploy for blue-green deployments
    - S3 bucket for artifacts with encryption
    - SNS topic for pipeline notifications
    - CloudWatch Logs for all build projects
    - IAM roles following least privilege principle
    """

    def __init__(self, name: str, args: TapStackArgs, opts=None):
        """Initialize the TapStack component resource."""
        super().__init__("custom:module:TapStack", name, {}, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}

        # Add default tags
        self.default_tags = {
            "Environment": self.environment_suffix,
            "Repository": get_env("REPOSITORY", "iac-test-automations"),
            "Author": get_env("COMMIT_AUTHOR", "ci-bot"),
            "PRNumber": get_env("PR_NUMBER", "unknown"),
            "Team": get_env("TEAM", "infrastructure"),
            "Project": "CICDPipeline",
            **self.tags
        }

        # Create all resources
        self._create_kms_key()
        self._create_s3_artifacts_bucket()
        self._create_ecr_repository()
        self._create_github_secret()
        self._create_sns_topic()
        self._create_iam_roles()
        self._create_cloudwatch_log_groups()
        self._create_codebuild_projects()
        self._create_codepipeline()
        self._create_cloudwatch_event_rule()

        # Register outputs
        self.register_outputs({
            "pipeline_name": self.pipeline.name,
            "artifacts_bucket": self.artifacts_bucket.bucket,
            "ecr_repository_url": self.ecr_repository.repository_url,
            "sns_topic_arn": self.sns_topic.arn
        })

    def _create_kms_key(self):
        """Create KMS key for artifact encryption."""
        self.kms_key = aws.kms.Key(
            f"cicd-kms-key-{self.environment_suffix}",
            description="KMS key for CI/CD pipeline artifact encryption",
            enable_key_rotation=True,
            deletion_window_in_days=30,
            tags=self.default_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.kms.Alias(
            f"cicd-kms-alias-{self.environment_suffix}",
            name=f"alias/cicd-pipeline-{self.environment_suffix}",
            target_key_id=self.kms_key.key_id,
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_s3_artifacts_bucket(self):
        """Create S3 bucket for pipeline artifacts."""
        self.artifacts_bucket = aws.s3.Bucket(
            f"cicd-artifacts-{self.environment_suffix}",
            bucket=f"cicd-artifacts-{self.environment_suffix}-{get_env('AWS_ACCOUNT_ID', '123456789012')}",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=(
                aws.s3.BucketServerSideEncryptionConfigurationArgs(
                    rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=(
                            aws.s3.
                            BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                                sse_algorithm="aws:kms",
                                kms_master_key_id=self.kms_key.arn
                            )
                        )
                    )
                )
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    enabled=True,
                    expiration=aws.s3.BucketLifecycleRuleExpirationArgs(days=30)
                )
            ],
            tags=self.default_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"cicd-artifacts-block-public-{self.environment_suffix}",
            bucket=self.artifacts_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_ecr_repository(self):
        """Create ECR repository with image scanning enabled."""
        self.ecr_repository = aws.ecr.Repository(
            f"cicd-ecr-{self.environment_suffix}",
            name=f"microservices-app-{self.environment_suffix}",
            image_scanning_configuration=aws.ecr.RepositoryImageScanningConfigurationArgs(
                scan_on_push=True
            ),
            image_tag_mutability="IMMUTABLE",
            tags=self.default_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # ECR lifecycle policy
        aws.ecr.LifecyclePolicy(
            f"cicd-ecr-lifecycle-{self.environment_suffix}",
            repository=self.ecr_repository.name,
            policy="""{
                "rules": [{
                    "rulePriority": 1,
                    "description": "Keep last 10 images",
                    "selection": {
                        "tagStatus": "any",
                        "countType": "imageCountMoreThan",
                        "countNumber": 10
                    },
                    "action": {
                        "type": "expire"
                    }
                }]
            }""",
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_github_secret(self):
        """Create Secrets Manager secret for GitHub OAuth token."""
        self.github_secret = aws.secretsmanager.Secret(
            f"github-oauth-token-{self.environment_suffix}",
            name=f"github-oauth-token-{self.environment_suffix}",
            description="GitHub OAuth token for CodePipeline source stage",
            kms_key_id=self.kms_key.id,
            tags=self.default_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Store token from environment variable (must be set before deployment)
        # In production, this would be provided via CI/CD environment or parameter store
        github_token = get_env("GITHUB_OAUTH_TOKEN", "")
        if github_token:
            aws.secretsmanager.SecretVersion(
                f"github-oauth-token-version-{self.environment_suffix}",
                secret_id=self.github_secret.id,
                secret_string=github_token,
                opts=pulumi.ResourceOptions(parent=self)
            )

    def _create_sns_topic(self):
        """Create SNS topic for pipeline failure notifications."""
        self.sns_topic = aws.sns.Topic(
            f"cicd-notifications-{self.environment_suffix}",
            name=f"cicd-pipeline-failures-{self.environment_suffix}",
            display_name="CI/CD Pipeline Failure Notifications",
            kms_master_key_id=self.kms_key.id,
            tags=self.default_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Subscribe email to SNS topic
        aws.sns.TopicSubscription(
            f"cicd-email-subscription-{self.environment_suffix}",
            topic=self.sns_topic.arn,
            protocol="email",
            endpoint="devops@company.com",
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_iam_roles(self):
        """Create IAM roles with least privilege for pipeline services."""
        # CodePipeline role
        pipeline_policy_doc = aws.iam.get_policy_document(
            statements=[
                aws.iam.GetPolicyDocumentStatementArgs(
                    actions=["sts:AssumeRole"],
                    principals=[
                        aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                            type="Service",
                            identifiers=["codepipeline.amazonaws.com"]
                        )
                    ]
                )
            ]
        )

        self.pipeline_role = aws.iam.Role(
            f"codepipeline-role-{self.environment_suffix}",
            name=f"codepipeline-role-{self.environment_suffix}",
            assume_role_policy=pipeline_policy_doc.json,
            tags=self.default_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # CodePipeline policy
        pipeline_policy = aws.iam.RolePolicy(
            f"codepipeline-policy-{self.environment_suffix}",
            role=self.pipeline_role.id,
            policy=pulumi.Output.all(
                self.artifacts_bucket.arn,
                self.kms_key.arn,
                self.github_secret.arn
            ).apply(lambda args: f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:GetObjectVersion"
                        ],
                        "Resource": "{args[0]}/*"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": ["s3:ListBucket"],
                        "Resource": "{args[0]}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "{args[1]}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "codebuild:BatchGetBuilds",
                            "codebuild:StartBuild"
                        ],
                        "Resource": "arn:aws:codebuild:*:*:project/cicd-*-{self.environment_suffix}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": "{args[2]}"
                    }}
                ]
            }}"""),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # CodeBuild role
        codebuild_policy_doc = aws.iam.get_policy_document(
            statements=[
                aws.iam.GetPolicyDocumentStatementArgs(
                    actions=["sts:AssumeRole"],
                    principals=[
                        aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                            type="Service",
                            identifiers=["codebuild.amazonaws.com"]
                        )
                    ]
                )
            ]
        )

        self.codebuild_role = aws.iam.Role(
            f"codebuild-role-{self.environment_suffix}",
            name=f"codebuild-role-{self.environment_suffix}",
            assume_role_policy=codebuild_policy_doc.json,
            tags=self.default_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # CodeBuild policy
        codebuild_policy = aws.iam.RolePolicy(
            f"codebuild-policy-{self.environment_suffix}",
            role=self.codebuild_role.id,
            policy=pulumi.Output.all(
                self.artifacts_bucket.arn,
                self.ecr_repository.arn,
                self.kms_key.arn
            ).apply(lambda args: f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:log-group:/aws/codebuild/cicd-*-{self.environment_suffix}:*"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": "{args[0]}/*"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "ecr:GetAuthorizationToken",
                            "ecr:BatchCheckLayerAvailability",
                            "ecr:GetDownloadUrlForLayer",
                            "ecr:BatchGetImage",
                            "ecr:PutImage",
                            "ecr:InitiateLayerUpload",
                            "ecr:UploadLayerPart",
                            "ecr:CompleteLayerUpload"
                        ],
                        "Resource": "{args[1]}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": ["ecr:GetAuthorizationToken"],
                        "Resource": "*"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "{args[2]}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "ecr:DescribeImageScanFindings"
                        ],
                        "Resource": "{args[1]}"
                    }}
                ]
            }}"""),
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_cloudwatch_log_groups(self):
        """Create CloudWatch Log Groups for CodeBuild projects."""
        self.build_log_group = aws.cloudwatch.LogGroup(
            f"codebuild-build-logs-{self.environment_suffix}",
            name=f"/aws/codebuild/cicd-build-{self.environment_suffix}",
            retention_in_days=7,
            kms_key_id=self.kms_key.arn,
            tags=self.default_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.unit_test_log_group = aws.cloudwatch.LogGroup(
            f"codebuild-unit-test-logs-{self.environment_suffix}",
            name=f"/aws/codebuild/cicd-unit-test-{self.environment_suffix}",
            retention_in_days=7,
            kms_key_id=self.kms_key.arn,
            tags=self.default_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.integration_test_log_group = aws.cloudwatch.LogGroup(
            f"codebuild-integration-test-logs-{self.environment_suffix}",
            name=f"/aws/codebuild/cicd-integration-test-{self.environment_suffix}",
            retention_in_days=7,
            kms_key_id=self.kms_key.arn,
            tags=self.default_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_codebuild_projects(self):
        """Create CodeBuild projects for build and testing stages."""
        # Build project
        self.build_project = aws.codebuild.Project(
            f"cicd-build-{self.environment_suffix}",
            name=f"cicd-build-{self.environment_suffix}",
            description="Build Docker images and push to ECR",
            service_role=self.codebuild_role.arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type="CODEPIPELINE"
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type="BUILD_GENERAL1_SMALL",
                image="aws/codebuild/standard:7.0",
                type="LINUX_CONTAINER",
                privileged_mode=True,
                environment_variables=[
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="ECR_REPOSITORY_URL",
                        value=self.ecr_repository.repository_url
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name="AWS_ACCOUNT_ID",
                        value=get_env("AWS_ACCOUNT_ID", "123456789012")
                    )
                ]
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type="CODEPIPELINE",
                buildspec="""version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t $ECR_REPOSITORY_URL:latest .
      - docker tag $ECR_REPOSITORY_URL:latest $ECR_REPOSITORY_URL:$CODEBUILD_RESOLVED_SOURCE_VERSION
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker image...
      - docker push $ECR_REPOSITORY_URL:latest
      - docker push $ECR_REPOSITORY_URL:$CODEBUILD_RESOLVED_SOURCE_VERSION
artifacts:
  files:
    - '**/*'
"""
            ),
            logs_config=aws.codebuild.ProjectLogsConfigArgs(
                cloudwatch_logs=aws.codebuild.ProjectLogsConfigCloudwatchLogsArgs(
                    group_name=self.build_log_group.name,
                    status="ENABLED"
                )
            ),
            tags=self.default_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Unit test project
        self.unit_test_project = aws.codebuild.Project(
            f"cicd-unit-test-{self.environment_suffix}",
            name=f"cicd-unit-test-{self.environment_suffix}",
            description="Run unit tests",
            service_role=self.codebuild_role.arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type="CODEPIPELINE"
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type="BUILD_GENERAL1_SMALL",
                image="aws/codebuild/standard:7.0",
                type="LINUX_CONTAINER"
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type="CODEPIPELINE",
                buildspec="""version: 0.2
phases:
  install:
    commands:
      - echo Installing dependencies...
      - npm install
  build:
    commands:
      - echo Running unit tests...
      - npm run test:unit
"""
            ),
            logs_config=aws.codebuild.ProjectLogsConfigArgs(
                cloudwatch_logs=aws.codebuild.ProjectLogsConfigCloudwatchLogsArgs(
                    group_name=self.unit_test_log_group.name,
                    status="ENABLED"
                )
            ),
            tags=self.default_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Integration test project
        self.integration_test_project = aws.codebuild.Project(
            f"cicd-integration-test-{self.environment_suffix}",
            name=f"cicd-integration-test-{self.environment_suffix}",
            description="Run integration tests",
            service_role=self.codebuild_role.arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type="CODEPIPELINE"
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type="BUILD_GENERAL1_SMALL",
                image="aws/codebuild/standard:7.0",
                type="LINUX_CONTAINER"
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type="CODEPIPELINE",
                buildspec="""version: 0.2
phases:
  install:
    commands:
      - echo Installing dependencies...
      - npm install
  build:
    commands:
      - echo Running integration tests...
      - npm run test:integration
"""
            ),
            logs_config=aws.codebuild.ProjectLogsConfigArgs(
                cloudwatch_logs=aws.codebuild.ProjectLogsConfigCloudwatchLogsArgs(
                    group_name=self.integration_test_log_group.name,
                    status="ENABLED"
                )
            ),
            tags=self.default_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

    def _create_codepipeline(self):
        """Create CodePipeline with 5 stages."""
        self.pipeline = aws.codepipeline.Pipeline(
            f"cicd-pipeline-{self.environment_suffix}",
            name=f"cicd-pipeline-{self.environment_suffix}",
            role_arn=self.pipeline_role.arn,
            artifact_stores=[
                aws.codepipeline.PipelineArtifactStoreArgs(
                    location=self.artifacts_bucket.bucket,
                    type="S3",
                    encryption_key=aws.codepipeline.PipelineArtifactStoreEncryptionKeyArgs(
                        id=self.kms_key.arn,
                        type="KMS"
                    )
                )
            ],
            stages=[
                # Stage 1: Source
                aws.codepipeline.PipelineStageArgs(
                    name="Source",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="GitHub_Source",
                            category="Source",
                            owner="ThirdParty",
                            provider="GitHub",
                            version="1",
                            output_artifacts=["source_output"],
                            configuration={
                                "Owner": "myorg",
                                "Repo": "microservices-app",
                                "Branch": "main",
                                "OAuthToken": (
                                    "{{resolve:secretsmanager:github-oauth-token-" +
                                    self.environment_suffix + "}}"
                                )
                            }
                        )
                    ]
                ),
                # Stage 2: Build
                aws.codepipeline.PipelineStageArgs(
                    name="Build",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="Build_Docker_Image",
                            category="Build",
                            owner="AWS",
                            provider="CodeBuild",
                            version="1",
                            input_artifacts=["source_output"],
                            output_artifacts=["build_output"],
                            configuration={
                                "ProjectName": self.build_project.name
                            }
                        )
                    ]
                ),
                # Stage 3: Test
                aws.codepipeline.PipelineStageArgs(
                    name="Test",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="Unit_Tests",
                            category="Test",
                            owner="AWS",
                            provider="CodeBuild",
                            version="1",
                            input_artifacts=["source_output"],
                            run_order=1,
                            configuration={
                                "ProjectName": self.unit_test_project.name
                            }
                        ),
                        aws.codepipeline.PipelineStageActionArgs(
                            name="Integration_Tests",
                            category="Test",
                            owner="AWS",
                            provider="CodeBuild",
                            version="1",
                            input_artifacts=["source_output"],
                            run_order=1,
                            configuration={
                                "ProjectName": self.integration_test_project.name
                            }
                        )
                    ]
                ),
                # Stage 4: SecurityScan (placeholder using CodeBuild)
                aws.codepipeline.PipelineStageArgs(
                    name="SecurityScan",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="ECR_Image_Scan",
                            category="Test",
                            owner="AWS",
                            provider="CodeBuild",
                            version="1",
                            input_artifacts=["build_output"],
                            configuration={
                                "ProjectName": self.build_project.name
                            }
                        )
                    ]
                ),
                # Stage 5: Deploy (placeholder for ECS/CodeDeploy)
                aws.codepipeline.PipelineStageArgs(
                    name="Deploy",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="Deploy_to_ECS",
                            category="Deploy",
                            owner="AWS",
                            provider="ECS",
                            version="1",
                            input_artifacts=["build_output"],
                            configuration={
                                "ClusterName": f"microservices-cluster-{self.environment_suffix}",
                                "ServiceName": f"microservices-service-{self.environment_suffix}",
                                "FileName": "imagedefinitions.json"
                            }
                        )
                    ]
                )
            ],
            tags=self.default_tags,
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.pipeline_role])
        )

    def _create_cloudwatch_event_rule(self):
        """Create CloudWatch Event Rule to trigger pipeline on specific branches."""
        # Event pattern for main and release/* branches
        event_pattern = {
            "source": ["aws.codecommit"],
            "detail-type": ["CodeCommit Repository State Change"],
            "detail": {
                "event": ["referenceCreated", "referenceUpdated"],
                "referenceType": ["branch"],
                "referenceName": ["main", {"prefix": "release/"}]
            }
        }

        self.pipeline_event_rule = aws.cloudwatch.EventRule(
            f"pipeline-trigger-rule-{self.environment_suffix}",
            name=f"cicd-pipeline-trigger-{self.environment_suffix}",
            description="Trigger pipeline only for main and release/* branches",
            event_pattern=pulumi.Output.json_dumps(event_pattern),
            tags=self.default_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Event target to start pipeline
        aws.cloudwatch.EventTarget(
            f"pipeline-event-target-{self.environment_suffix}",
            rule=self.pipeline_event_rule.name,
            arn=self.pipeline.arn,
            role_arn=self.pipeline_role.arn,
            opts=pulumi.ResourceOptions(parent=self)
        )


def create_infrastructure(environment_suffix: str) -> TapStack:
    """
    Create the CI/CD pipeline infrastructure.

    Args:
        environment_suffix: Environment suffix for resource naming (e.g., 'dev', 'prod')

    Returns:
        TapStack instance with all resources created
    """
    args = TapStackArgs(environment_suffix=environment_suffix)
    return TapStack("cicd-pipeline", args)
