"""tap_stack.py
Main CDK stack orchestrating all monitoring infrastructure components.
"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct
from .monitoring_stack import MonitoringStack, MonitoringStackProps


class TapStackProps(cdk.StackProps):
    """Properties for TapStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Main CDK stack for FedRAMP-compliant monitoring infrastructure.

    Orchestrates the creation of monitoring resources for database activities,
    container metrics, and API access patterns.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create monitoring infrastructure
        monitoring_props = MonitoringStackProps(
            environment_suffix=environment_suffix
        )

        monitoring_stack = MonitoringStack(
            self,
            "MonitoringResources",
            props=monitoring_props
        )

        # Export key outputs
        cdk.CfnOutput(
            self,
            "VPCId",
            value=monitoring_stack.vpc.vpc_id,
            description="VPC ID for monitoring infrastructure"
        )

        cdk.CfnOutput(
            self,
            "RDSEndpoint",
            value=monitoring_stack.database.db_instance_endpoint_address,
            description="RDS database endpoint"
        )

        cdk.CfnOutput(
            self,
            "ECSClusterName",
            value=monitoring_stack.ecs_cluster.cluster_name,
            description="ECS cluster name"
        )

        cdk.CfnOutput(
            self,
            "APIGatewayURL",
            value=monitoring_stack.api_gateway.url,
            description="API Gateway endpoint URL"
        )

        cdk.CfnOutput(
            self,
            "KinesisStreamName",
            value=monitoring_stack.kinesis_stream.stream_name,
            description="Kinesis stream for log aggregation"
        )

        cdk.CfnOutput(
            self,
            "RedisEndpoint",
            value=monitoring_stack.redis_cluster.attr_primary_end_point_address,
            description="ElastiCache Redis endpoint"
        )
