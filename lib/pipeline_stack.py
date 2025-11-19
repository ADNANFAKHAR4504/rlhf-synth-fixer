"""pipeline_stack.py

This module defines the PipelineStack for AWS CodePipeline infrastructure.
It creates a multi-stage CI/CD pipeline with source, build, test, and deploy stages,
along with manual approval gates and SNS notifications.
"""

from aws_cdk import (
    Stack,
    Duration,
    aws_codepipeline as codepipeline,
    aws_codepipeline_actions as codepipeline_actions,
    aws_codebuild as codebuild,
    aws_s3 as s3,
    aws_ecr as ecr,
    aws_iam as iam,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    RemovalPolicy,
)
from constructs import Construct


class PipelineStack(Stack):
    """Creates CI/CD pipeline infrastructure with CodePipeline, CodeBuild, and SNS."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Artifact bucket with versioning, encryption, and lifecycle rules
        artifact_bucket = s3.Bucket(
            self,
            f"ArtifactBucket{environment_suffix}",
            bucket_name=f"cicd-artifacts-{environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    noncurrent_version_expiration=Duration.days(90)
                )
            ]
        )

        # Cache bucket with 7-day expiration
        cache_bucket = s3.Bucket(
            self,
            f"CacheBucket{environment_suffix}",
            bucket_name=f"build-cache-{environment_suffix}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    expiration=Duration.days(7)
                )
            ]
        )

        # SNS topic for approval notifications
        approval_topic = sns.Topic(
            self,
            f"ApprovalTopic{environment_suffix}",
            display_name="Pipeline Approval Notifications"
        )
        approval_topic.apply_removal_policy(RemovalPolicy.DESTROY)

        approval_topic.add_subscription(
            subscriptions.EmailSubscription("approvals@example.com")
        )

        # SNS topic for failure notifications
        failure_topic = sns.Topic(
            self,
            f"FailureTopic{environment_suffix}",
            display_name="Pipeline Failure Notifications"
        )
        failure_topic.apply_removal_policy(RemovalPolicy.DESTROY)

        # ECR repository for build images
        build_image_repo = ecr.Repository(
            self,
            f"BuildImageRepo{environment_suffix}",
            repository_name=f"build-image-{environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_images=True,
            image_scan_on_push=True,
            lifecycle_rules=[
                ecr.LifecycleRule(
                    max_image_count=10,
                    description="Keep only 10 most recent images"
                )
            ]
        )

        # CodeBuild project for building
        build_project = codebuild.PipelineProject(
            self,
            f"BuildProject{environment_suffix}",
            project_name=f"app-build-{environment_suffix}",
            environment=codebuild.BuildEnvironment(
                build_image=codebuild.LinuxBuildImage.from_ecr_repository(
                    repository=build_image_repo
                ),
                compute_type=codebuild.ComputeType.SMALL,
                privileged=True
            ),
            cache=codebuild.Cache.bucket(cache_bucket, prefix="docker-cache"),
            build_spec=codebuild.BuildSpec.from_object({
                "version": "0.2",
                "phases": {
                    "pre_build": {
                        "commands": [
                            "echo Logging in to Amazon ECR...",
                            ("aws ecr get-login-password --region $AWS_DEFAULT_REGION | "
                             "docker login --username AWS --password-stdin "
                             "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com")
                        ]
                    },
                    "build": {
                        "commands": [
                            "echo Build started on `date`",
                            "docker build -t app:latest .",
                            ("docker tag app:latest "
                             "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/app:latest"),
                            ("docker push "
                             "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/app:latest")
                        ]
                    }
                },
                "cache": {
                    "paths": ["/root/.docker"]
                }
            }),
            environment_variables={
                "AWS_DEFAULT_REGION": codebuild.BuildEnvironmentVariable(value=self.region),
                "AWS_ACCOUNT_ID": codebuild.BuildEnvironmentVariable(value=self.account)
            }
        )

        # Grant ECR permissions to build project
        build_image_repo.grant_pull_push(build_project)

        # CodeBuild project for testing
        test_project = codebuild.PipelineProject(
            self,
            f"TestProject{environment_suffix}",
            project_name=f"app-test-{environment_suffix}",
            environment=codebuild.BuildEnvironment(
                build_image=codebuild.LinuxBuildImage.STANDARD_5_0,
                compute_type=codebuild.ComputeType.SMALL
            ),
            build_spec=codebuild.BuildSpec.from_object({
                "version": "0.2",
                "phases": {
                    "install": {
                        "commands": [
                            "pip install -r requirements.txt"
                        ]
                    },
                    "test": {
                        "commands": [
                            "pytest tests/ --cov --cov-report=term"
                        ]
                    }
                },
                "reports": {
                    "pytest_reports": {
                        "files": ["test-results.xml"],
                        "file_format": "JUNITXML"
                    }
                }
            })
        )

        # Pipeline
        pipeline = codepipeline.Pipeline(
            self,
            f"Pipeline{environment_suffix}",
            pipeline_name=f"cicd-pipeline-{environment_suffix}",
            artifact_bucket=artifact_bucket,
            restart_execution_on_update=True
        )

        # Source stage
        connection_arn_param = self.node.try_get_context('codeStarConnectionArn') or \
            "arn:aws:codestar-connections:us-east-1:123456789012:connection/example"

        source_output = codepipeline.Artifact()
        source_action = codepipeline_actions.CodeStarConnectionsSourceAction(
            action_name="Source",
            owner="myorg",
            repo="myapp",
            branch="main",
            output=source_output,
            connection_arn=connection_arn_param
        )

        pipeline.add_stage(
            stage_name="Source",
            actions=[source_action]
        )

        # Build stage
        build_output = codepipeline.Artifact()
        build_action = codepipeline_actions.CodeBuildAction(
            action_name="Build",
            project=build_project,
            input=source_output,
            outputs=[build_output]
        )

        pipeline.add_stage(
            stage_name="Build",
            actions=[build_action]
        )

        # Test stage
        test_action = codepipeline_actions.CodeBuildAction(
            action_name="Test",
            project=test_project,
            input=build_output
        )

        pipeline.add_stage(
            stage_name="Test",
            actions=[test_action]
        )

        # Manual approval for staging
        staging_approval_action = codepipeline_actions.ManualApprovalAction(
            action_name="ApproveStaging",
            notification_topic=approval_topic,
            additional_information="Approve deployment to staging environment"
        )

        pipeline.add_stage(
            stage_name="ApproveStagingDeploy",
            actions=[staging_approval_action]
        )

        # Manual approval for production
        prod_approval_action = codepipeline_actions.ManualApprovalAction(
            action_name="ApproveProduction",
            notification_topic=approval_topic,
            additional_information="Approve production deployment - verify staging tests passed"
        )

        pipeline.add_stage(
            stage_name="ApproveProductionDeploy",
            actions=[prod_approval_action]
        )

        # Store references for other stacks
        self.failure_topic = failure_topic
        self.pipeline = pipeline
        self.artifact_bucket = artifact_bucket
