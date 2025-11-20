# Multi-Stage CI/CD Pipeline Infrastructure

This solution implements a comprehensive CI/CD pipeline using AWS CDK with Python for containerized application deployments across multiple AWS accounts.

## Architecture Overview

The infrastructure includes:
- CodePipeline with 4 stages (source, build, test, deploy)
- CodeBuild projects for building and testing
- ECS Fargate services for container deployments
- S3 artifact storage with encryption
- SNS notifications for approvals and alerts
- CloudWatch monitoring and dashboards
- Secrets Manager for Docker credentials
- Cross-account IAM roles

## File: lib/pipeline_stack.py

```python
from aws_cdk import (
    Stack,
    Duration,
    aws_codepipeline as codepipeline,
    aws_codepipeline_actions as codepipeline_actions,
    aws_codebuild as codebuild,
    aws_s3 as s3,
    aws_iam as iam,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    RemovalPolicy,
)
from constructs import Construct

class PipelineStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Artifact bucket - ISSUE: uses RETAIN policy
        artifact_bucket = s3.Bucket(
            self,
            f"ArtifactBucket{environment_suffix}",
            bucket_name=f"cicd-artifacts-{environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            removal_policy=RemovalPolicy.RETAIN,  # ISSUE: Should be DESTROY
            lifecycle_rules=[
                s3.LifecycleRule(
                    noncurrent_version_expiration=Duration.days(90)
                )
            ]
        )

        # Cache bucket - ISSUE: Missing encryption
        cache_bucket = s3.Bucket(
            self,
            f"CacheBucket{environment_suffix}",
            bucket_name=f"build-cache-{environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
            lifecycle_rules=[
                s3.LifecycleRule(
                    expiration=Duration.days(7)
                )
            ]
        )

        # SNS topic for approvals - ISSUE: Missing removal policy
        approval_topic = sns.Topic(
            self,
            f"ApprovalTopic{environment_suffix}",
            display_name="Pipeline Approval Notifications"
        )

        approval_topic.add_subscription(
            subscriptions.EmailSubscription("approvals@example.com")
        )

        # SNS topic for failures
        failure_topic = sns.Topic(
            self,
            f"FailureTopic{environment_suffix}",
            display_name="Pipeline Failure Notifications",
            removal_policy=RemovalPolicy.DESTROY
        )

        # ISSUE: ECR repository reference is incomplete
        build_project = codebuild.PipelineProject(
            self,
            f"BuildProject{environment_suffix}",
            project_name=f"app-build-{environment_suffix}",
            environment=codebuild.BuildEnvironment(
                build_image=codebuild.LinuxBuildImage.from_ecr_repository(
                    repository=None,  # ISSUE: Needs actual repository
                    tag="latest"
                ),
                compute_type=codebuild.ComputeType.SMALL,
                privileged=True
            ),
            cache=codebuild.Cache.bucket(cache_bucket),
            build_spec=codebuild.BuildSpec.from_object({
                "version": "0.2",
                "phases": {
                    "build": {
                        "commands": [
                            "docker build -t app:latest .",
                            "docker push app:latest"
                        ]
                    }
                },
                "cache": {
                    "paths": ["/root/.docker"]
                }
            })
        )

        # Test project - ISSUE: Uses wrong compute type
        test_project = codebuild.PipelineProject(
            self,
            f"TestProject{environment_suffix}",
            project_name=f"app-test-{environment_suffix}",
            environment=codebuild.BuildEnvironment(
                build_image=codebuild.LinuxBuildImage.STANDARD_5_0,
                compute_type=codebuild.ComputeType.MEDIUM  # ISSUE: Should be SMALL
            ),
            build_spec=codebuild.BuildSpec.from_object({
                "version": "0.2",
                "phases": {
                    "test": {
                        "commands": [
                            "pytest tests/"
                        ]
                    }
                }
            })
        )

        # Pipeline
        pipeline = codepipeline.Pipeline(
            self,
            f"Pipeline{environment_suffix}",
            pipeline_name=f"cicd-pipeline-{environment_suffix}",
            artifact_bucket=artifact_bucket
        )

        # Source stage - ISSUE: Hardcoded connection ARN
        source_output = codepipeline.Artifact()
        source_action = codepipeline_actions.CodeStarConnectionsSourceAction(
            action_name="Source",
            owner="myorg",
            repo="myapp",
            branch="main",
            output=source_output,
            connection_arn="arn:aws:codestar-connections:us-east-1:123456789012:connection/abc123"
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

        # Manual approval for staging - ISSUE: Missing additional information
        staging_approval_action = codepipeline_actions.ManualApprovalAction(
            action_name="ApproveStaging",
            notification_topic=approval_topic
        )

        pipeline.add_stage(
            stage_name="ApproveStagingDeploy",
            actions=[staging_approval_action]
        )

        # Manual approval for production
        prod_approval_action = codepipeline_actions.ManualApprovalAction(
            action_name="ApproveProduction",
            notification_topic=approval_topic,
            additional_information="Approve production deployment"
        )

        pipeline.add_stage(
            stage_name="ApproveProductionDeploy",
            actions=[prod_approval_action]
        )

        # Store failure topic for monitoring stack
        self.failure_topic = failure_topic
        self.pipeline = pipeline


## File: lib/ecs_stack.py

```python
from aws_cdk import (
    Stack,
    Duration,
    aws_ecs as ecs,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_iam as iam,
    RemovalPolicy,
)
from constructs import Construct

class EcsStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # VPC - ISSUE: Single NAT gateway is SPOF
        vpc = ec2.Vpc(
            self,
            f"Vpc{environment_suffix}",
            max_azs=2,
            nat_gateways=1  # ISSUE: Should be 2 for HA
        )

        # ECS Cluster
        cluster = ecs.Cluster(
            self,
            f"Cluster{environment_suffix}",
            cluster_name=f"app-cluster-{environment_suffix}",
            vpc=vpc
        )

        # Task definition - ISSUE: Hardcoded values, missing secrets
        task_definition = ecs.FargateTaskDefinition(
            self,
            f"TaskDef{environment_suffix}",
            memory_limit_mib=512,
            cpu=256
        )

        # Container - ISSUE: Hardcoded environment variables
        container = task_definition.add_container(
            "AppContainer",
            image=ecs.ContainerImage.from_registry("nginx:latest"),
            logging=ecs.LogDrivers.aws_logs(stream_prefix="app"),
            environment={
                "ENV": "production"  # ISSUE: Should use environment_suffix
            }
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=80)
        )

        # ALB
        alb = elbv2.ApplicationLoadBalancer(
            self,
            f"ALB{environment_suffix}",
            vpc=vpc,
            internet_facing=True
        )

        # Target group - ISSUE: Missing proper health check configuration
        target_group = elbv2.ApplicationTargetGroup(
            self,
            f"TargetGroup{environment_suffix}",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/",
                interval=Duration.seconds(30)
                # ISSUE: Missing healthy_threshold, unhealthy_threshold, timeout
            )
        )

        # Listener
        listener = alb.add_listener(
            "Listener",
            port=80,
            default_target_groups=[target_group]
        )

        # Fargate service - ISSUE: Missing blue/green target group
        service = ecs.FargateService(
            self,
            f"Service{environment_suffix}",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=2,
            deployment_controller=ecs.DeploymentController(
                type=ecs.DeploymentControllerType.CODE_DEPLOY
            )
        )

        # Attach to target group
        service.attach_to_application_target_group(target_group)

        self.cluster = cluster
        self.service = service


## File: lib/secrets_stack.py

```python
from aws_cdk import (
    Stack,
    aws_secretsmanager as secretsmanager,
    RemovalPolicy,
)
from constructs import Construct

class SecretsStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Docker registry credentials - ISSUE: Uses RETAIN policy
        docker_secret = secretsmanager.Secret(
            self,
            f"DockerSecret{environment_suffix}",
            secret_name=f"docker-credentials-{environment_suffix}",
            description="Docker registry credentials",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username":"dockeruser"}',
                generate_string_key="password"
            ),
            removal_policy=RemovalPolicy.RETAIN  # ISSUE: Should be DESTROY
        )

        self.docker_secret = docker_secret


## File: lib/monitoring_stack.py

```python
from aws_cdk import (
    Stack,
    aws_cloudwatch as cloudwatch,
    aws_events as events,
    aws_events_targets as targets,
    aws_sns as sns,
)
from constructs import Construct

class MonitoringStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        pipeline_name: str,
        failure_topic: sns.Topic,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            f"PipelineDashboard{environment_suffix}",
            dashboard_name=f"cicd-pipeline-{environment_suffix}"
        )

        # Pipeline failure rule
        pipeline_failure_rule = events.Rule(
            self,
            f"PipelineFailureRule{environment_suffix}",
            event_pattern=events.EventPattern(
                source=["aws.codepipeline"],
                detail_type=["CodePipeline Pipeline Execution State Change"],
                detail={
                    "state": ["FAILED"],
                    "pipeline": [pipeline_name]
                }
            )
        )

        pipeline_failure_rule.add_target(
            targets.SnsTopic(failure_topic)
        )

        # Add metrics to dashboard - ISSUE: Limited metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Pipeline Executions",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/CodePipeline",
                        metric_name="PipelineExecutionSuccess",
                        dimensions_map={"PipelineName": pipeline_name}
                    )
                ]
                # ISSUE: Missing failure metrics, build duration, etc.
            )
        )


## File: lib/cross_account_roles.py

```python
from aws_cdk import (
    Stack,
    aws_iam as iam,
)
from constructs import Construct

class CrossAccountRolesStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        target_account_id: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Cross-account deployment role - ISSUE: Uses PowerUserAccess (too permissive)
        deployment_role = iam.Role(
            self,
            f"DeploymentRole{environment_suffix}",
            role_name=f"cross-account-deploy-{environment_suffix}",
            assumed_by=iam.AccountPrincipal(target_account_id),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("PowerUserAccess")  # ISSUE: Too broad
            ]
        )

        # Deny EC2 terminate
        deployment_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                actions=["ec2:TerminateInstances"],
                resources=["*"]
            )
        )

        self.deployment_role = deployment_role


## File: lib/tap_stack.py

```python
from typing import Optional
import aws_cdk as cdk
from constructs import Construct
from .pipeline_stack import PipelineStack
from .ecs_stack import EcsStack
from .secrets_stack import SecretsStack
from .monitoring_stack import MonitoringStack
from .cross_account_roles import CrossAccountRolesStack

class TapStackProps(cdk.StackProps):
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix

class TapStack(cdk.Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create nested stacks
        secrets_stack = SecretsStack(
            self,
            f"SecretsStack{environment_suffix}",
            environment_suffix=environment_suffix
        )

        pipeline_stack = PipelineStack(
            self,
            f"PipelineStack{environment_suffix}",
            environment_suffix=environment_suffix
        )

        ecs_stack = EcsStack(
            self,
            f"EcsStack{environment_suffix}",
            environment_suffix=environment_suffix
        )

        monitoring_stack = MonitoringStack(
            self,
            f"MonitoringStack{environment_suffix}",
            environment_suffix=environment_suffix,
            pipeline_name=f"cicd-pipeline-{environment_suffix}",
            failure_topic=pipeline_stack.failure_topic
        )

        # Cross-account roles for dev, staging, prod
        dev_roles = CrossAccountRolesStack(
            self,
            f"DevRoles{environment_suffix}",
            environment_suffix=environment_suffix,
            target_account_id="111111111111"
        )

        staging_roles = CrossAccountRolesStack(
            self,
            f"StagingRoles{environment_suffix}",
            environment_suffix=environment_suffix,
            target_account_id="222222222222"
        )

        prod_roles = CrossAccountRolesStack(
            self,
            f"ProdRoles{environment_suffix}",
            environment_suffix=environment_suffix,
            target_account_id="333333333333"
        )


## Deployment

To deploy this infrastructure:

```bash
# Install dependencies
pip install -r requirements.txt

# Synthesize CloudFormation template
cdk synth

# Deploy to AWS
cdk deploy --all --context environmentSuffix=dev
```

## Testing

```bash
# Run unit tests
pytest tests/
```