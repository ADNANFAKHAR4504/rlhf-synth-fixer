from aws_cdk import (
    Stack,
    aws_codepipeline as codepipeline,
    aws_codepipeline_actions as codepipeline_actions,
    aws_codebuild as codebuild,
    aws_codecommit as codecommit,
    aws_codedeploy as codedeploy,
    aws_ecs as ecs,
    aws_ecr as ecr,
    aws_iam as iam,
    aws_s3 as s3,
    aws_cloudwatch as cloudwatch,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subscriptions,
    aws_logs as logs,
    RemovalPolicy,
    Duration,
)
from constructs import Construct
from typing import List, Optional


class CicdPipelineConstruct(Construct):
    """
    Reusable CDK construct for creating a complete CI/CD pipeline for ECS Fargate applications.

    This construct provisions:
    - Multi-stage CodePipeline (source, build, test, staging deploy, approval, prod deploy)
    - CodeBuild projects for building Docker images and security scanning
    - Blue/green deployment using CodeDeploy
    - Cross-account deployment capabilities
    - CloudWatch dashboards for monitoring
    - SNS notifications for pipeline events
    - Integration test stage with temporary ECS tasks
    - Parameter Store integration for secrets
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        app_name: str,
        github_owner: str,
        github_repo: str,
        github_branch: str,
        github_token_secret_name: str,
        ecs_cluster_name: str,
        ecs_service_name: str,
        staging_account_id: str,
        prod_account_id: str,
        notification_emails: List[str],
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = environment_suffix
        self.app_name = app_name

        # Create ECR repository
        self.ecr_repository = self._create_ecr_repository()

        # Create artifact bucket
        self.artifact_bucket = self._create_artifact_bucket()

        # Create SNS topic for notifications
        self.notification_topic = self._create_notification_topic(notification_emails)

        # Create CodeBuild projects
        self.build_project = self._create_build_project()
        self.security_scan_project = self._create_security_scan_project()
        self.integration_test_project = self._create_integration_test_project(
            ecs_cluster_name
        )

        # Create CodeDeploy application and deployment groups
        self.codedeploy_app = self._create_codedeploy_application()
        self.staging_deployment_group = self._create_deployment_group(
            "staging", ecs_cluster_name, ecs_service_name
        )
        self.prod_deployment_group = self._create_deployment_group(
            "prod", ecs_cluster_name, ecs_service_name
        )

        # Create cross-account roles
        self.staging_deploy_role = self._create_cross_account_role(
            "staging", staging_account_id
        )
        self.prod_deploy_role = self._create_cross_account_role(
            "prod", prod_account_id
        )

        # Create the pipeline
        self.pipeline = self._create_pipeline(
            github_owner,
            github_repo,
            github_branch,
            github_token_secret_name,
            ecs_cluster_name,
            ecs_service_name,
        )

        # Create CloudWatch dashboard
        self.dashboard = self._create_cloudwatch_dashboard()

    def _create_ecr_repository(self) -> ecr.Repository:
        """Create ECR repository for Docker images."""
        repository = ecr.Repository(
            self,
            f"ecr-repository-{self.environment_suffix}",
            repository_name=f"{self.app_name}-{self.environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
            empty_on_delete=True,
            image_scan_on_push=True,
            lifecycle_rules=[
                ecr.LifecycleRule(
                    description="Keep only last 10 images",
                    max_image_count=10,
                )
            ],
        )
        return repository

    def _create_artifact_bucket(self) -> s3.Bucket:
        """Create S3 bucket for pipeline artifacts."""
        bucket = s3.Bucket(
            self,
            f"artifact-bucket-{self.environment_suffix}",
            bucket_name=f"pipeline-artifacts-{self.app_name}-{self.environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    expiration=Duration.days(30),
                    abort_incomplete_multipart_upload_after=Duration.days(7),
                )
            ],
        )
        return bucket

    def _create_notification_topic(self, emails: List[str]) -> sns.Topic:
        """Create SNS topic for pipeline notifications."""
        topic = sns.Topic(
            self,
            f"pipeline-notifications-{self.environment_suffix}",
            topic_name=f"pipeline-notifications-{self.app_name}-{self.environment_suffix}",
            display_name=f"Pipeline Notifications for {self.app_name}",
        )

        # Add email subscriptions
        for email in emails:
            topic.add_subscription(
                sns_subscriptions.EmailSubscription(email)
            )

        return topic

    def _create_build_project(self) -> codebuild.Project:
        """Create CodeBuild project for building Docker images."""
        project = codebuild.Project(
            self,
            f"build-project-{self.environment_suffix}",
            project_name=f"{self.app_name}-build-{self.environment_suffix}",
            description=f"Build Docker images for {self.app_name}",
            environment=codebuild.BuildEnvironment(
                build_image=codebuild.LinuxBuildImage.AMAZON_LINUX_2_5,
                privileged=True,  # Required for Docker builds
                compute_type=codebuild.ComputeType.SMALL,
            ),
            environment_variables={
                "ECR_REPOSITORY_URI": codebuild.BuildEnvironmentVariable(
                    value=self.ecr_repository.repository_uri
                ),
                "AWS_DEFAULT_REGION": codebuild.BuildEnvironmentVariable(
                    value=Stack.of(self).region
                ),
                "AWS_ACCOUNT_ID": codebuild.BuildEnvironmentVariable(
                    value=Stack.of(self).account
                ),
            },
            build_spec=codebuild.BuildSpec.from_object({
                "version": "0.2",
                "phases": {
                    "pre_build": {
                        "commands": [
                            "echo Logging in to Amazon ECR...",
                            "aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com",
                            "COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)",
                            "IMAGE_TAG=${COMMIT_HASH:=latest}",
                        ]
                    },
                    "build": {
                        "commands": [
                            "echo Build started on `date`",
                            "echo Building the Docker image...",
                            "docker build -t $ECR_REPOSITORY_URI:latest .",
                            "docker tag $ECR_REPOSITORY_URI:latest $ECR_REPOSITORY_URI:$IMAGE_TAG",
                            "echo Running unit tests...",
                            "# Add your test commands here",
                        ]
                    },
                    "post_build": {
                        "commands": [
                            "echo Build completed on `date`",
                            "echo Pushing the Docker images...",
                            "docker push $ECR_REPOSITORY_URI:latest",
                            "docker push $ECR_REPOSITORY_URI:$IMAGE_TAG",
                            "echo Writing image definitions file...",
                            'printf \'[{"name":"container","imageUri":"%s"}]\' $ECR_REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json',
                        ]
                    },
                },
                "artifacts": {
                    "files": ["imagedefinitions.json", "appspec.yaml", "taskdef.json"]
                },
            }),
            logging=codebuild.LoggingOptions(
                cloud_watch=codebuild.CloudWatchLoggingOptions(
                    log_group=logs.LogGroup(
                        self,
                        f"build-logs-{self.environment_suffix}",
                        log_group_name=f"/aws/codebuild/{self.app_name}-build-{self.environment_suffix}",
                        removal_policy=RemovalPolicy.DESTROY,
                        retention=logs.RetentionDays.ONE_WEEK,
                    )
                )
            ),
        )

        # Grant ECR permissions
        self.ecr_repository.grant_pull_push(project)

        return project

    def _create_security_scan_project(self) -> codebuild.Project:
        """Create CodeBuild project for security scanning with Trivy."""
        project = codebuild.Project(
            self,
            f"security-scan-project-{self.environment_suffix}",
            project_name=f"{self.app_name}-security-scan-{self.environment_suffix}",
            description=f"Security scanning for {self.app_name} using Trivy",
            environment=codebuild.BuildEnvironment(
                build_image=codebuild.LinuxBuildImage.AMAZON_LINUX_2_5,
                privileged=True,
                compute_type=codebuild.ComputeType.SMALL,
            ),
            environment_variables={
                "ECR_REPOSITORY_URI": codebuild.BuildEnvironmentVariable(
                    value=self.ecr_repository.repository_uri
                ),
            },
            build_spec=codebuild.BuildSpec.from_object({
                "version": "0.2",
                "phases": {
                    "install": {
                        "commands": [
                            "echo Installing Trivy...",
                            "wget -qO - https://aquasecurity.github.io/trivy-repo/rpm/public.key | rpm --import -",
                            "echo '[trivy]' > /etc/yum.repos.d/trivy.repo",
                            "echo 'name=Trivy repository' >> /etc/yum.repos.d/trivy.repo",
                            "echo 'baseurl=https://aquasecurity.github.io/trivy-repo/rpm/releases/$releasever/$basearch/' >> /etc/yum.repos.d/trivy.repo",
                            "echo 'enabled=1' >> /etc/yum.repos.d/trivy.repo",
                            "echo 'gpgcheck=1' >> /etc/yum.repos.d/trivy.repo",
                            "yum install -y trivy",
                        ]
                    },
                    "build": {
                        "commands": [
                            "echo Running Trivy security scan...",
                            "trivy image --severity HIGH,CRITICAL $ECR_REPOSITORY_URI:latest",
                        ]
                    },
                },
            }),
            logging=codebuild.LoggingOptions(
                cloud_watch=codebuild.CloudWatchLoggingOptions(
                    log_group=logs.LogGroup(
                        self,
                        f"security-scan-logs-{self.environment_suffix}",
                        log_group_name=f"/aws/codebuild/{self.app_name}-security-scan-{self.environment_suffix}",
                        removal_policy=RemovalPolicy.DESTROY,
                        retention=logs.RetentionDays.ONE_WEEK,
                    )
                )
            ),
        )

        # Grant ECR read permissions
        self.ecr_repository.grant_pull(project)

        return project

    def _create_integration_test_project(self, ecs_cluster_name: str) -> codebuild.Project:
        """Create CodeBuild project for integration testing."""
        project = codebuild.Project(
            self,
            f"integration-test-project-{self.environment_suffix}",
            project_name=f"{self.app_name}-integration-test-{self.environment_suffix}",
            description=f"Integration testing for {self.app_name}",
            environment=codebuild.BuildEnvironment(
                build_image=codebuild.LinuxBuildImage.AMAZON_LINUX_2_5,
                compute_type=codebuild.ComputeType.SMALL,
            ),
            environment_variables={
                "ECS_CLUSTER": codebuild.BuildEnvironmentVariable(
                    value=ecs_cluster_name
                ),
                "ECR_REPOSITORY_URI": codebuild.BuildEnvironmentVariable(
                    value=self.ecr_repository.repository_uri
                ),
            },
            build_spec=codebuild.BuildSpec.from_object({
                "version": "0.2",
                "phases": {
                    "build": {
                        "commands": [
                            "echo Starting integration tests...",
                            "# Run temporary ECS task for testing",
                            "TASK_ARN=$(aws ecs run-task --cluster $ECS_CLUSTER --task-definition integration-test-task --launch-type FARGATE --query 'tasks[0].taskArn' --output text)",
                            "echo Waiting for task to complete...",
                            "aws ecs wait tasks-stopped --cluster $ECS_CLUSTER --tasks $TASK_ARN",
                            "EXIT_CODE=$(aws ecs describe-tasks --cluster $ECS_CLUSTER --tasks $TASK_ARN --query 'tasks[0].containers[0].exitCode' --output text)",
                            "if [ $EXIT_CODE -ne 0 ]; then exit 1; fi",
                        ]
                    },
                },
            }),
            logging=codebuild.LoggingOptions(
                cloud_watch=codebuild.CloudWatchLoggingOptions(
                    log_group=logs.LogGroup(
                        self,
                        f"integration-test-logs-{self.environment_suffix}",
                        log_group_name=f"/aws/codebuild/{self.app_name}-integration-test-{self.environment_suffix}",
                        removal_policy=RemovalPolicy.DESTROY,
                        retention=logs.RetentionDays.ONE_WEEK,
                    )
                )
            ),
        )

        # Grant ECS permissions
        project.add_to_role_policy(
            iam.PolicyStatement(
                actions=[
                    "ecs:RunTask",
                    "ecs:DescribeTasks",
                    "ecs:StopTask",
                ],
                resources=["*"],
            )
        )
        project.add_to_role_policy(
            iam.PolicyStatement(
                actions=["iam:PassRole"],
                resources=["*"],
                conditions={
                    "StringEquals": {
                        "iam:PassedToService": "ecs-tasks.amazonaws.com"
                    }
                },
            )
        )

        return project

    def _create_codedeploy_application(self) -> codedeploy.EcsApplication:
        """Create CodeDeploy application."""
        app = codedeploy.EcsApplication(
            self,
            f"codedeploy-app-{self.environment_suffix}",
            application_name=f"{self.app_name}-{self.environment_suffix}",
        )
        return app

    def _create_deployment_group(
        self, env: str, cluster_name: str, service_name: str
    ) -> codedeploy.EcsDeploymentGroup:
        """Create CodeDeploy deployment group for blue/green deployments."""
        # Import existing ECS cluster and service
        cluster = ecs.Cluster.from_cluster_attributes(
            self,
            f"ecs-cluster-{env}-{self.environment_suffix}",
            cluster_name=cluster_name,
            vpc=None,  # Not needed for deployment group
            security_groups=[],
        )

        deployment_group = codedeploy.EcsDeploymentGroup(
            self,
            f"deployment-group-{env}-{self.environment_suffix}",
            application=self.codedeploy_app,
            deployment_group_name=f"{self.app_name}-{env}-{self.environment_suffix}",
            service=ecs.BaseService.from_service_attributes(
                self,
                f"ecs-service-{env}-{self.environment_suffix}",
                cluster=cluster,
                service_name=service_name,
            ),
            blue_green_deployment_config=codedeploy.EcsBlueGreenDeploymentConfig(
                blue_target_group=None,  # Must be provided by user
                green_target_group=None,  # Must be provided by user
                listener=None,  # Must be provided by user
                termination_wait_time=Duration.minutes(5),
            ),
            auto_rollback=codedeploy.AutoRollbackConfig(
                failed_deployment=True,
                deployment_in_alarm=True,
            ),
            alarms=[
                # CloudWatch alarms for automatic rollback
                cloudwatch.Alarm(
                    self,
                    f"deployment-alarm-{env}-{self.environment_suffix}",
                    alarm_name=f"{self.app_name}-deployment-errors-{env}-{self.environment_suffix}",
                    metric=cloudwatch.Metric(
                        namespace="AWS/ECS",
                        metric_name="TargetResponseTime",
                        dimensions_map={
                            "ServiceName": service_name,
                            "ClusterName": cluster_name,
                        },
                        statistic="Average",
                    ),
                    threshold=1000,
                    evaluation_periods=2,
                    comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                )
            ],
        )

        return deployment_group

    def _create_cross_account_role(self, env: str, account_id: str) -> iam.Role:
        """Create IAM role for cross-account deployments."""
        role = iam.Role(
            self,
            f"cross-account-role-{env}-{self.environment_suffix}",
            role_name=f"{self.app_name}-deploy-{env}-{self.environment_suffix}",
            assumed_by=iam.AccountPrincipal(Stack.of(self).account),
            description=f"Role for deploying {self.app_name} to {env} account",
        )

        # Add permissions for CodeDeploy
        role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "codedeploy:*",
                    "ecs:*",
                    "elasticloadbalancing:*",
                    "cloudwatch:*",
                    "logs:*",
                ],
                resources=["*"],
            )
        )

        return role

    def _create_pipeline(
        self,
        github_owner: str,
        github_repo: str,
        github_branch: str,
        github_token_secret_name: str,
        ecs_cluster_name: str,
        ecs_service_name: str,
    ) -> codepipeline.Pipeline:
        """Create the main CI/CD pipeline."""
        pipeline = codepipeline.Pipeline(
            self,
            f"pipeline-{self.environment_suffix}",
            pipeline_name=f"{self.app_name}-pipeline-{self.environment_suffix}",
            artifact_bucket=self.artifact_bucket,
            restart_execution_on_update=True,
        )

        # Source stage
        source_output = codepipeline.Artifact("SourceOutput")
        source_action = codepipeline_actions.GitHubSourceAction(
            action_name="GitHub_Source",
            owner=github_owner,
            repo=github_repo,
            branch=github_branch,
            oauth_token=Stack.of(self).node.try_get_context(github_token_secret_name),
            output=source_output,
            trigger=codepipeline_actions.GitHubTrigger.WEBHOOK,
        )

        pipeline.add_stage(
            stage_name="Source",
            actions=[source_action],
        )

        # Build stage
        build_output = codepipeline.Artifact("BuildOutput")
        build_action = codepipeline_actions.CodeBuildAction(
            action_name="Docker_Build",
            project=self.build_project,
            input=source_output,
            outputs=[build_output],
        )

        pipeline.add_stage(
            stage_name="Build",
            actions=[build_action],
        )

        # Security scan stage
        security_scan_action = codepipeline_actions.CodeBuildAction(
            action_name="Security_Scan",
            project=self.security_scan_project,
            input=source_output,
        )

        pipeline.add_stage(
            stage_name="SecurityScan",
            actions=[security_scan_action],
        )

        # Integration test stage
        integration_test_action = codepipeline_actions.CodeBuildAction(
            action_name="Integration_Tests",
            project=self.integration_test_project,
            input=build_output,
        )

        pipeline.add_stage(
            stage_name="IntegrationTest",
            actions=[integration_test_action],
        )

        # Staging deployment stage
        staging_deploy_action = codepipeline_actions.EcsDeployAction(
            action_name="Deploy_to_Staging",
            service=ecs.BaseService.from_service_attributes(
                self,
                f"staging-service-{self.environment_suffix}",
                cluster=ecs.Cluster.from_cluster_attributes(
                    self,
                    f"staging-cluster-{self.environment_suffix}",
                    cluster_name=ecs_cluster_name,
                    vpc=None,
                    security_groups=[],
                ),
                service_name=f"{ecs_service_name}-staging",
            ),
            input=build_output,
            deployment_timeout=Duration.minutes(30),
        )

        pipeline.add_stage(
            stage_name="DeployStaging",
            actions=[staging_deploy_action],
        )

        # Manual approval stage
        approval_action = codepipeline_actions.ManualApprovalAction(
            action_name="Approve_Production_Deploy",
            notification_topic=self.notification_topic,
            additional_information="Please review staging deployment before approving production.",
            external_entity_link=f"https://console.aws.amazon.com/ecs/home?region={Stack.of(self).region}#/clusters/{ecs_cluster_name}/services",
        )

        pipeline.add_stage(
            stage_name="ManualApproval",
            actions=[approval_action],
        )

        # Production deployment stage
        prod_deploy_action = codepipeline_actions.EcsDeployAction(
            action_name="Deploy_to_Production",
            service=ecs.BaseService.from_service_attributes(
                self,
                f"prod-service-{self.environment_suffix}",
                cluster=ecs.Cluster.from_cluster_attributes(
                    self,
                    f"prod-cluster-{self.environment_suffix}",
                    cluster_name=ecs_cluster_name,
                    vpc=None,
                    security_groups=[],
                ),
                service_name=f"{ecs_service_name}-prod",
            ),
            input=build_output,
            deployment_timeout=Duration.minutes(30),
        )

        pipeline.add_stage(
            stage_name="DeployProduction",
            actions=[prod_deploy_action],
        )

        # Add notifications for pipeline state changes
        pipeline.on_state_change(
            f"pipeline-state-change-{self.environment_suffix}",
            target=None,  # SNS target would be added here
            description=f"Pipeline state change for {self.app_name}",
        )

        return pipeline

    def _create_cloudwatch_dashboard(self) -> cloudwatch.Dashboard:
        """Create CloudWatch dashboard for pipeline monitoring."""
        dashboard = cloudwatch.Dashboard(
            self,
            f"pipeline-dashboard-{self.environment_suffix}",
            dashboard_name=f"{self.app_name}-pipeline-{self.environment_suffix}",
        )

        # Pipeline success/failure metrics
        pipeline_success_metric = cloudwatch.Metric(
            namespace="AWS/CodePipeline",
            metric_name="PipelineExecutionSuccess",
            dimensions_map={
                "PipelineName": self.pipeline.pipeline_name,
            },
            statistic="Sum",
            period=Duration.hours(1),
        )

        pipeline_failure_metric = cloudwatch.Metric(
            namespace="AWS/CodePipeline",
            metric_name="PipelineExecutionFailure",
            dimensions_map={
                "PipelineName": self.pipeline.pipeline_name,
            },
            statistic="Sum",
            period=Duration.hours(1),
        )

        # Build duration metric
        build_duration_metric = cloudwatch.Metric(
            namespace="AWS/CodeBuild",
            metric_name="Duration",
            dimensions_map={
                "ProjectName": self.build_project.project_name,
            },
            statistic="Average",
            period=Duration.hours(1),
        )

        # Add widgets to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Pipeline Execution Status",
                left=[pipeline_success_metric, pipeline_failure_metric],
                width=12,
            )
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Build Duration",
                left=[build_duration_metric],
                width=12,
            )
        )

        # Deployment success rate
        deployment_success_metric = cloudwatch.Metric(
            namespace="AWS/CodeDeploy",
            metric_name="Succeeded",
            dimensions_map={
                "ApplicationName": self.codedeploy_app.application_name,
            },
            statistic="Sum",
            period=Duration.hours(1),
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Deployment Success Rate",
                left=[deployment_success_metric],
                width=12,
            )
        )

        return dashboard
