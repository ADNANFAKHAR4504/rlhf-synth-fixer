"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of CI/CD pipeline, ECS, secrets, monitoring,
and cross-account IAM stacks for containerized application deployments.
"""

from typing import Optional

import aws_cdk as cdk
from constructs import Construct
from .pipeline_stack import PipelineStack
from .ecs_stack import EcsStack
from .secrets_stack import SecretsStack
from .monitoring_stack import MonitoringStack
from .cross_account_roles import CrossAccountRolesStack


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

    This stack orchestrates the instantiation of pipeline, ECS, secrets, monitoring,
    and cross-account role stacks for containerized application deployments across
    multiple AWS accounts.

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
            failure_topic=pipeline_stack.failure_topic,
            pipeline=pipeline_stack.pipeline
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
