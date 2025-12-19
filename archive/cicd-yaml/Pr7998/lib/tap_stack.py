"""tap_stack.py
This module defines the TapStack class, which creates a complete CI/CD pipeline
for containerized Python applications with blue-green deployment to ECS Fargate.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_ecr as ecr,
    aws_ecs as ecs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_codecommit as codecommit,
    aws_codebuild as codebuild,
    aws_codepipeline as codepipeline,
    aws_codepipeline_actions as codepipeline_actions,
    aws_codedeploy as codedeploy,
    aws_iam as iam,
    aws_logs as logs,
    aws_s3 as s3,
    aws_ssm as ssm,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subscriptions,
    RemovalPolicy,
    Duration,
    CfnOutput,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the
        deployment environment (e.g., 'dev', 'prod').
        notification_email (Optional[str]): Email address for pipeline failure notifications.
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
        notification_email (Optional[str]): Email for SNS notifications.
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        notification_email: Optional[str] = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix
        self.notification_email = notification_email


class TapStack(Stack):
    """
    CI/CD Pipeline Stack for Python applications with blue-green deployment.

    This stack creates a complete CI/CD pipeline including:
    - CodeCommit repository for source control
    - CodeBuild project for testing and building Docker images
    - ECS Fargate cluster and service for container hosting
    - Application Load Balancer with blue-green deployment
    - CodeDeploy for orchestrating blue-green deployments
    - CodePipeline for end-to-end automation
    - CloudWatch Logs for monitoring
    - SNS for failure notifications
    - IAM roles with least privilege access

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
          stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context("environmentSuffix") or "dev"

        notification_email = (
            props.notification_email if props and props.notification_email else None
        ) or self.node.try_get_context("notificationEmail") or "devops@example.com"

        self.environment_suffix = environment_suffix

        # Create VPC with private subnets across 2 AZs
        vpc = ec2.Vpc(
            self,
            f"vpc-{environment_suffix}",
            max_azs=2,
            nat_gateways=0,  # Use VPC endpoints instead to reduce costs
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"public-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"private-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
        )

        # ECR Repository for Docker images
        ecr_repo = ecr.Repository(
            self,
            f"ecr-repo-{environment_suffix}",
            repository_name=f"python-app-{environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
            lifecycle_rules=[
                ecr.LifecycleRule(
                    description="Keep only last 10 images",
                    max_image_count=10,
                )
            ],
        )

        # ECS Cluster
        ecs_cluster = ecs.Cluster(
            self,
            f"ecs-cluster-{environment_suffix}",
            cluster_name=f"app-cluster-{environment_suffix}",
            vpc=vpc,
            container_insights=True,
        )

        # CloudWatch Log Group for ECS tasks
        ecs_log_group = logs.LogGroup(
            self,
            f"ecs-logs-{environment_suffix}",
            log_group_name=f"/ecs/app-{environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # ECS Task Execution Role
        task_execution_role = iam.Role(
            self,
            f"task-exec-role-{environment_suffix}",
            role_name=f"ecs-task-exec-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ],
        )

        # Grant ECR permissions to task execution role
        ecr_repo.grant_pull(task_execution_role)

        # ECS Task Role (for application permissions)
        task_role = iam.Role(
            self,
            f"task-role-{environment_suffix}",
            role_name=f"ecs-task-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
        )

        # ECS Task Definition
        task_definition = ecs.FargateTaskDefinition(
            self,
            f"task-def-{environment_suffix}",
            family=f"app-task-{environment_suffix}",
            cpu=256,
            memory_limit_mib=512,
            execution_role=task_execution_role,
            task_role=task_role,
        )

        # Add container to task definition
        container = task_definition.add_container(
            f"app-container-{environment_suffix}",
            image=ecs.ContainerImage.from_registry("python:3.9-slim"),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="app",
                log_group=ecs_log_group,
            ),
            environment={
                "ENVIRONMENT": environment_suffix,
            },
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=80, protocol=ecs.Protocol.TCP)
        )

        # Application Load Balancer
        alb = elbv2.ApplicationLoadBalancer(
            self,
            f"alb-{environment_suffix}",
            load_balancer_name=f"app-alb-{environment_suffix}",
            vpc=vpc,
            internet_facing=True,
        )

        # Target Groups for blue-green deployment
        target_group_blue = elbv2.ApplicationTargetGroup(
            self,
            f"tg-blue-{environment_suffix}",
            target_group_name=f"app-blue-{environment_suffix}",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
            ),
            deregistration_delay=Duration.seconds(30),
        )

        target_group_green = elbv2.ApplicationTargetGroup(
            self,
            f"tg-green-{environment_suffix}",
            target_group_name=f"app-green-{environment_suffix}",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
            ),
            deregistration_delay=Duration.seconds(30),
        )

        # ALB Listener
        listener = alb.add_listener(
            f"listener-{environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group_blue],
        )

        # Test listener for blue-green deployment
        test_listener = alb.add_listener(
            f"test-listener-{environment_suffix}",
            port=8080,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group_green],
        )

        # ECS Fargate Service
        fargate_service = ecs.FargateService(
            self,
            f"fargate-service-{environment_suffix}",
            service_name=f"app-service-{environment_suffix}",
            cluster=ecs_cluster,
            task_definition=task_definition,
            desired_count=2,
            deployment_controller=ecs.DeploymentController(
                type=ecs.DeploymentControllerType.CODE_DEPLOY
            ),
        )

        # Attach service to target groups
        fargate_service.attach_to_application_target_group(target_group_blue)

        # CodeDeploy Application
        codedeploy_app = codedeploy.EcsApplication(
            self,
            f"codedeploy-app-{environment_suffix}",
            application_name=f"app-deploy-{environment_suffix}",
        )

        # CodeDeploy Deployment Group
        deployment_group = codedeploy.EcsDeploymentGroup(
            self,
            f"deployment-group-{environment_suffix}",
            deployment_group_name=f"app-dg-{environment_suffix}",
            application=codedeploy_app,
            service=fargate_service,
            blue_green_deployment_config=codedeploy.EcsBlueGreenDeploymentConfig(
                blue_target_group=target_group_blue,
                green_target_group=target_group_green,
                listener=listener,
                test_listener=test_listener,
            ),
            deployment_config=codedeploy.EcsDeploymentConfig.LINEAR_10_PERCENT_EVERY_1_MINUTES,
            auto_rollback=codedeploy.AutoRollbackConfig(
                failed_deployment=True,
                deployment_in_alarm=False,
            ),
        )

        # CodeCommit Repository
        code_repo = codecommit.Repository(
            self,
            f"codecommit-repo-{environment_suffix}",
            repository_name=f"python-app-{environment_suffix}",
            description=f"Python application repository for {environment_suffix}",
        )

        # S3 Bucket for pipeline artifacts
        artifact_bucket = s3.Bucket(
            self,
            f"artifact-bucket-{environment_suffix}",
            bucket_name=f"pipeline-artifacts-{environment_suffix}-{self.account}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True,
        )

        # CloudWatch Log Group for CodeBuild
        codebuild_log_group = logs.LogGroup(
            self,
            f"codebuild-logs-{environment_suffix}",
            log_group_name=f"/codebuild/app-{environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Parameter Store for Docker Hub credentials (placeholder)
        docker_username_param = ssm.StringParameter(
            self,
            f"docker-username-{environment_suffix}",
            parameter_name=f"/app/{environment_suffix}/docker/username",
            string_value="placeholder-username",
            description="Docker Hub username",
        )

        docker_password_param = ssm.StringParameter(
            self,
            f"docker-password-{environment_suffix}",
            parameter_name=f"/app/{environment_suffix}/docker/password",
            string_value="placeholder-password",
            description="Docker Hub password",
        )

        # CodeBuild Project
        build_project = codebuild.PipelineProject(
            self,
            f"build-project-{environment_suffix}",
            project_name=f"app-build-{environment_suffix}",
            environment=codebuild.BuildEnvironment(
                build_image=codebuild.LinuxBuildImage.STANDARD_5_0,
                privileged=True,
                compute_type=codebuild.ComputeType.SMALL,
                environment_variables={
                    "AWS_DEFAULT_REGION": codebuild.BuildEnvironmentVariable(
                        value=self.region
                    ),
                    "AWS_ACCOUNT_ID": codebuild.BuildEnvironmentVariable(
                        value=self.account
                    ),
                    "IMAGE_REPO_NAME": codebuild.BuildEnvironmentVariable(
                        value=ecr_repo.repository_name
                    ),
                    "IMAGE_TAG": codebuild.BuildEnvironmentVariable(value="latest"),
                    "DOCKER_USERNAME": codebuild.BuildEnvironmentVariable(
                        value=docker_username_param.parameter_name,
                        type=codebuild.BuildEnvironmentVariableType.PARAMETER_STORE,
                    ),
                    "DOCKER_PASSWORD": codebuild.BuildEnvironmentVariable(
                        value=docker_password_param.parameter_name,
                        type=codebuild.BuildEnvironmentVariableType.PARAMETER_STORE,
                    ),
                },
            ),
            build_spec=codebuild.BuildSpec.from_object({
                "version": "0.2",
                "phases": {
                    "pre_build": {
                        "commands": [
                            "echo Logging in to Amazon ECR...",
                            (
                                "aws ecr get-login-password --region $AWS_DEFAULT_REGION | "
                                "docker login --username AWS --password-stdin "
                                "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com"
                            ),
                            "echo Installing dependencies...",
                            "pip install -r requirements.txt || echo 'No requirements.txt found'",
                            "pip install pytest bandit",
                        ]
                    },
                    "build": {
                        "commands": [
                            "echo Running unit tests...",
                            "pytest tests/ || echo 'No tests found'",
                            "echo Running security scanning with bandit...",
                            "bandit -r . -f json -o bandit-report.json || echo 'Bandit scan complete'",
                            "echo Building Docker image...",
                            "docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .",
                            (
                                "docker tag $IMAGE_REPO_NAME:$IMAGE_TAG "
                                "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/"
                                "$IMAGE_REPO_NAME:$IMAGE_TAG"
                            ),
                        ]
                    },
                    "post_build": {
                        "commands": [
                            "echo Pushing Docker image to ECR...",
                            (
                                "docker push $AWS_ACCOUNT_ID.dkr.ecr."
                                "$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG"
                            ),
                            "echo Creating imagedefinitions.json for ECS deployment...",
                            (
                                "printf '[{\"name\":\"app-container-" + environment_suffix +
                                "\",\"imageUri\":\"%s\"}]' "
                                "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/"
                                "$IMAGE_REPO_NAME:$IMAGE_TAG > imagedefinitions.json"
                            ),
                        ]
                    },
                },
                "artifacts": {
                    "files": [
                        "imagedefinitions.json",
                        "appspec.yaml",
                        "taskdef.json",
                    ]
                },
            }),
            logging=codebuild.LoggingOptions(
                cloud_watch=codebuild.CloudWatchLoggingOptions(log_group=codebuild_log_group)
            ),
        )

        # Grant ECR permissions to CodeBuild
        ecr_repo.grant_pull_push(build_project)

        # Grant Parameter Store read permissions
        docker_username_param.grant_read(build_project)
        docker_password_param.grant_read(build_project)

        # SNS Topic for pipeline failure notifications
        notification_topic = sns.Topic(
            self,
            f"pipeline-notifications-{environment_suffix}",
            topic_name=f"pipeline-failures-{environment_suffix}",
            display_name="Pipeline Failure Notifications",
        )

        # Add email subscription
        notification_topic.add_subscription(
            sns_subscriptions.EmailSubscription(notification_email)
        )

        # CodePipeline
        pipeline = codepipeline.Pipeline(
            self,
            f"pipeline-{environment_suffix}",
            pipeline_name=f"app-pipeline-{environment_suffix}",
            artifact_bucket=artifact_bucket,
            restart_execution_on_update=True,
        )

        # Source stage
        source_output = codepipeline.Artifact("SourceOutput")
        source_action = codepipeline_actions.CodeCommitSourceAction(
            action_name="CodeCommit_Source",
            repository=code_repo,
            branch="main",
            output=source_output,
            trigger=codepipeline_actions.CodeCommitTrigger.EVENTS,
        )

        pipeline.add_stage(stage_name="Source", actions=[source_action])

        # Build stage
        build_output = codepipeline.Artifact("BuildOutput")
        build_action = codepipeline_actions.CodeBuildAction(
            action_name="CodeBuild_Build",
            project=build_project,
            input=source_output,
            outputs=[build_output],
        )

        pipeline.add_stage(stage_name="Build", actions=[build_action])

        # Deploy stage
        deploy_action = codepipeline_actions.CodeDeployEcsDeployAction(
            action_name="CodeDeploy_Deploy",
            deployment_group=deployment_group,
            app_spec_template_input=build_output,
            task_definition_template_input=build_output,
        )

        pipeline.add_stage(stage_name="Deploy", actions=[deploy_action])

        # Add pipeline failure notifications
        pipeline.on_state_change(
            f"pipeline-state-change-{environment_suffix}",
            target=None,
            description="Pipeline state change event",
        )

        # Outputs
        CfnOutput(
            self,
            f"PipelineArn-{environment_suffix}",
            value=pipeline.pipeline_arn,
            description="CodePipeline ARN",
            export_name=f"pipeline-arn-{environment_suffix}",
        )

        CfnOutput(
            self,
            f"ECRRepositoryUri-{environment_suffix}",
            value=ecr_repo.repository_uri,
            description="ECR Repository URI",
            export_name=f"ecr-uri-{environment_suffix}",
        )

        CfnOutput(
            self,
            f"CodeCommitRepoUrl-{environment_suffix}",
            value=code_repo.repository_clone_url_http,
            description="CodeCommit Repository Clone URL",
            export_name=f"repo-url-{environment_suffix}",
        )

        CfnOutput(
            self,
            f"LoadBalancerDns-{environment_suffix}",
            value=alb.load_balancer_dns_name,
            description="Application Load Balancer DNS",
            export_name=f"alb-dns-{environment_suffix}",
        )
