"""tap_stack.py
Main CDK stack orchestrating PostgreSQL disaster recovery infrastructure.
Note: All resources deployed in a single region due to single-stack architecture.
"""

from typing import Optional
import os
import aws_cdk as cdk
from constructs import Construct
from lib.vpc_stack import VpcStack
from lib.database_stack import DatabaseStack
from lib.failover_stack import FailoverStack
from lib.monitoring_stack import MonitoringStack


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): Environment suffix for resource naming
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Main CDK stack for PostgreSQL disaster recovery.

    This stack orchestrates VPC, database, failover, and monitoring resources.
    Note: All resources are deployed in a single region due to CDK single-stack
    architecture. For true multi-region deployment, separate stacks would be required.

    Args:
        scope (Construct): The parent construct
        construct_id (str): The unique identifier for this stack
        props (Optional[TapStackProps]): Stack properties including environment suffix
        **kwargs: Additional keyword arguments passed to the CDK Stack

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming
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

        # Get regions from environment variables or context
        primary_region = (
            self.node.try_get_context('primaryRegion') or
            os.environ.get('AWS_REGION') or
            'us-east-1'
        )
        replica_region = (
            self.node.try_get_context('replicaRegion') or
            os.environ.get('REPLICA_REGION') or
            'eu-west-1'
        )

        # VPC Infrastructure in both regions
        vpc_stack = VpcStack(
            self,
            f"VpcStack-{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # RDS PostgreSQL with read replica (same region)
        database_stack = DatabaseStack(
            self,
            f"DatabaseStack-{environment_suffix}",
            environment_suffix=environment_suffix,
            primary_vpc=vpc_stack.primary_vpc,
            replica_vpc=vpc_stack.replica_vpc,
            primary_region=primary_region,
            replica_region=replica_region
        )

        # Create SNS topic first for failover notifications
        # This is created here so it can be passed to failover_stack
        from aws_cdk import aws_sns as sns
        sns_topic = sns.Topic(
            self,
            f"FailoverAlarmTopic-{environment_suffix}",
            topic_name=f"db-alarms-{environment_suffix}",
            display_name="Database Replication Alarms"
        )

        # Automated failover mechanism
        failover_stack = FailoverStack(
            self,
            f"FailoverStack-{environment_suffix}",
            environment_suffix=environment_suffix,
            primary_db_instance=database_stack.primary_instance,
            replica_db_instance=database_stack.replica_instance,
            primary_vpc=vpc_stack.primary_vpc,
            sns_topic=sns_topic
        )

        # CloudWatch monitoring and alarms
        monitoring_stack = MonitoringStack(
            self,
            f"MonitoringStack-{environment_suffix}",
            environment_suffix=environment_suffix,
            primary_instance=database_stack.primary_instance,
            replica_instance=database_stack.replica_instance,
            failover_function=failover_stack.failover_function,
            sns_topic=sns_topic
        )

        # Stack outputs
        cdk.CfnOutput(
            self,
            "PrimaryEndpoint",
            value=database_stack.primary_instance.db_instance_endpoint_address,
            description=f"Primary RDS PostgreSQL endpoint ({primary_region})"
        )

        cdk.CfnOutput(
            self,
            "ReplicaEndpoint",
            value=database_stack.replica_instance.db_instance_endpoint_address,
            description=f"Replica RDS PostgreSQL endpoint (same region as primary: {primary_region})"
        )

        cdk.CfnOutput(
            self,
            "Route53CNAME",
            value=failover_stack.route53_cname,
            description="Route53 CNAME for database endpoint"
        )

        cdk.CfnOutput(
            self,
            "FailoverFunctionArn",
            value=failover_stack.failover_function.function_arn,
            description="Lambda function ARN for automated failover"
        )
