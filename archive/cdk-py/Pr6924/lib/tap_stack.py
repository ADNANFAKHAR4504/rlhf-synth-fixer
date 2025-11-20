"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of CI/CD pipeline, ECS, secrets, and monitoring
stacks for containerized application deployments with blue/green deployment support.
"""

from typing import Optional

import aws_cdk as cdk
from constructs import Construct
from .pipeline_stack import PipelineStack
from .ecs_stack import EcsStack
from .secrets_stack import SecretsStack
from .monitoring_stack import MonitoringStack


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the multi-stage CI/CD pipeline project.

    This stack orchestrates the instantiation of pipeline, ECS, secrets, and monitoring
    stacks for containerized application deployments in a single AWS account with
    blue/green deployment support using AWS CodeDeploy.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
        stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
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
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create nested stacks in proper order
        secrets_stack = SecretsStack(
            self,
            "SecretsStack",
            environment_suffix=environment_suffix
        )

        pipeline_stack = PipelineStack(
            self,
            "PipelineStack",
            environment_suffix=environment_suffix
        )

        ecs_stack = EcsStack(
            self,
            "EcsStack",
            environment_suffix=environment_suffix
        )

        monitoring_stack = MonitoringStack(
            self,
            "MonitoringStack",
            environment_suffix=environment_suffix,
            pipeline_name=f"cicd-pipeline-{environment_suffix}",
            failure_topic=pipeline_stack.failure_topic,
            pipeline=pipeline_stack.pipeline
        )

        # Add ECS deployment stages to pipeline after all stacks are created
        pipeline_stack.add_ecs_deployment_stages(
            deployment_group=ecs_stack.deployment_group
        )

        # Stack outputs
        cdk.CfnOutput(
            self,
            "PipelineName",
            value=pipeline_stack.pipeline.pipeline_name,
            description="Name of the CI/CD pipeline"
        )

        cdk.CfnOutput(
            self,
            "ClusterName",
            value=ecs_stack.cluster.cluster_name,
            description="Name of the ECS cluster"
        )

        cdk.CfnOutput(
            self,
            "LoadBalancerDNS",
            value=ecs_stack.alb.load_balancer_dns_name,
            description="DNS name of the Application Load Balancer"
        )

        cdk.CfnOutput(
            self,
            "ServiceName",
            value=ecs_stack.service.service_name,
            description="Name of the ECS Fargate service"
        )

        cdk.CfnOutput(
            self,
            "BlueTargetGroupArn",
            value=ecs_stack.blue_target_group.target_group_arn,
            description="ARN of the blue target group"
        )

        cdk.CfnOutput(
            self,
            "GreenTargetGroupArn",
            value=ecs_stack.green_target_group.target_group_arn,
            description="ARN of the green target group"
        )

        cdk.CfnOutput(
            self,
            "ListenerArn",
            value=ecs_stack.listener.listener_arn,
            description="ARN of the production listener"
        )

        cdk.CfnOutput(
            self,
            "TestListenerArn",
            value=ecs_stack.test_listener.listener_arn,
            description="ARN of the test listener"
        )

        cdk.CfnOutput(
            self,
            "ArtifactBucketName",
            value=pipeline_stack.artifact_bucket.bucket_name,
            description="Name of the artifact S3 bucket"
        )

        cdk.CfnOutput(
            self,
            "DockerSecretArn",
            value=secrets_stack.docker_secret.secret_arn,
            description="ARN of the Docker credentials secret"
        )

        cdk.CfnOutput(
            self,
            "FailureTopicArn",
            value=pipeline_stack.failure_topic.topic_arn,
            description="ARN of the failure notification SNS topic"
        )

        cdk.CfnOutput(
            self,
            "CodeDeployApplicationName",
            value=ecs_stack.application.application_name,
            description="Name of the CodeDeploy Application"
        )

        cdk.CfnOutput(
            self,
            "CodeDeployDeploymentGroupName",
            value=ecs_stack.deployment_group.deployment_group_name,
            description="Name of the CodeDeploy Deployment Group"
        )
