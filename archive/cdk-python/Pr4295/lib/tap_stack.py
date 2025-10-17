"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the video processing pipeline infrastructure.
It orchestrates the instantiation of networking, storage, compute, cache, and API stacks
for a scalable video processing solution.
"""

from typing import Optional

import aws_cdk as cdk
from constructs import Construct

from .network_stack import NetworkStack, NetworkStackProps
from .storage_stack import StorageStack, StorageStackProps
from .cache_stack import CacheStack, CacheStackProps
from .compute_stack import ComputeStack, ComputeStackProps
from .api_stack import ApiStack, ApiStackProps
from .notification_stack import NotificationStack, NotificationStackProps
from .workflow_stack import WorkflowStack, WorkflowStackProps


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
    Represents the main CDK stack for the video processing pipeline.

    This stack orchestrates the instantiation of nested stacks for networking,
    storage (RDS, EFS), caching (ElastiCache Redis), compute (ECS), API Gateway,
    notifications (SNS), and workflow orchestration (Step Functions).
    All resources are deployed with multi-AZ configuration in ap-northeast-1 region.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
            stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming.
        network_stack: Nested stack containing VPC and security groups.
        storage_stack: Nested stack containing RDS and EFS resources.
        cache_stack: Nested stack containing ElastiCache Redis cluster.
        compute_stack: Nested stack containing ECS cluster.
        api_stack: Nested stack containing API Gateway.
        notification_stack: Nested stack containing SNS topics.
        workflow_stack: Nested stack containing Step Functions state machine.
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

        # Create Network Stack (VPC, Security Groups)
        network_props = NetworkStackProps(environment_suffix=environment_suffix)
        self.network_stack = NetworkStack(
            self, f"NetworkStack{environment_suffix}", props=network_props
        )

        # Create Storage Stack (RDS PostgreSQL, EFS)
        storage_props = StorageStackProps(
            environment_suffix=environment_suffix,
            vpc=self.network_stack.vpc,
            rds_security_group=self.network_stack.rds_security_group,
            efs_security_group=self.network_stack.efs_security_group,
        )
        self.storage_stack = StorageStack(
            self, f"StorageStack{environment_suffix}", props=storage_props
        )
        self.storage_stack.add_dependency(self.network_stack)

        # Create Cache Stack (ElastiCache Redis)
        cache_props = CacheStackProps(
            environment_suffix=environment_suffix,
            vpc=self.network_stack.vpc,
            redis_security_group=self.network_stack.redis_security_group,
        )
        self.cache_stack = CacheStack(
            self, f"CacheStack{environment_suffix}", props=cache_props
        )
        self.cache_stack.add_dependency(self.network_stack)

        # Create Compute Stack (ECS Cluster)
        compute_props = ComputeStackProps(
            environment_suffix=environment_suffix,
            vpc=self.network_stack.vpc,
            ecs_security_group=self.network_stack.ecs_security_group,
        )
        self.compute_stack = ComputeStack(
            self, f"ComputeStack{environment_suffix}", props=compute_props
        )
        self.compute_stack.add_dependency(self.network_stack)

        # Create API Stack (API Gateway, Lambda)
        api_props = ApiStackProps(
            environment_suffix=environment_suffix,
            vpc=self.network_stack.vpc,
            database_secret_arn=self.storage_stack.db_secret.secret_arn,
            redis_endpoint=self.cache_stack.replication_group.attr_primary_end_point_address,
        )
        self.api_stack = ApiStack(
            self, f"ApiStack{environment_suffix}", props=api_props
        )
        self.api_stack.add_dependency(self.storage_stack)
        self.api_stack.add_dependency(self.cache_stack)

        # Create Notification Stack (SNS Topics)
        notification_props = NotificationStackProps(
            environment_suffix=environment_suffix,
        )
        self.notification_stack = NotificationStack(
            self, f"NotificationStack{environment_suffix}", props=notification_props
        )

        # Create Workflow Stack (Step Functions State Machine)
        workflow_props = WorkflowStackProps(
            environment_suffix=environment_suffix,
            vpc=self.network_stack.vpc,
            ecs_cluster=self.compute_stack.cluster,
            ecs_security_group=self.network_stack.ecs_security_group,
            completion_topic=self.notification_stack.completion_topic,
            error_topic=self.notification_stack.error_topic,
        )
        self.workflow_stack = WorkflowStack(
            self, f"WorkflowStack{environment_suffix}", props=workflow_props
        )
        self.workflow_stack.add_dependency(self.compute_stack)
        self.workflow_stack.add_dependency(self.notification_stack)
