"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from constructs import Construct

from lib.vpc_stack import VpcStack
from lib.security_groups_stack import SecurityGroupsStack
from lib.alb_stack import ALBStack
from lib.autoscaling_stack import AutoScalingStack
from lib.rds_stack import RDSStack
from lib.elasticache_stack import ElastiCacheStack
from lib.s3_cloudfront_stack import S3CloudFrontStack
from lib.monitoring_stack import MonitoringStack


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
    Represents the main CDK stack for the Tap project.

    This stack is responsible for orchestrating the instantiation of
    other resource-specific stacks.
    It determines the environment suffix from the provided properties,
        CDK context, or defaults to 'dev'.
    Note:
        - Do NOT create AWS resources directly in this stack.
        - Instead, instantiate separate stacks for each resource type within this stack.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
            stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): Environment suffix used for resource naming.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs,
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            (props.environment_suffix if props else None)
            or self.node.try_get_context("environmentSuffix")
            or "dev"
        )

        # Create VPC Stack
        vpc_stack = VpcStack(
            self, f"VpcStack{environment_suffix}"
        )

        # Create Security Groups
        security_groups = SecurityGroupsStack(
            self, f"SecurityGroups{environment_suffix}", vpc=vpc_stack.vpc
        )

        # Create ALB
        alb_stack = ALBStack(
            self,
            f"ALBStack{environment_suffix}",
            vpc=vpc_stack.vpc,
            security_group=security_groups.alb_sg,
        )

        # Create Auto Scaling Group
        asg_stack = AutoScalingStack(
            self,
            f"AutoScalingStack{environment_suffix}",
            vpc=vpc_stack.vpc,
            security_group=security_groups.ec2_sg,
            target_group=alb_stack.target_group,
        )

        # Create RDS Aurora
        rds_stack = RDSStack(
            self,
            f"RDSStack{environment_suffix}",
            vpc=vpc_stack.vpc,
            security_group=security_groups.db_sg,
        )

        # Create ElastiCache
        elasticache_stack = ElastiCacheStack(
            self,
            f"ElastiCacheStack{environment_suffix}",
            vpc=vpc_stack.vpc,
            security_group=security_groups.redis_sg,
        )

        # Create S3 and CloudFront
        s3_cloudfront_stack = S3CloudFrontStack(
            self, f"S3CloudFrontStack{environment_suffix}"
        )

        # Create Monitoring
        monitoring_stack = MonitoringStack(
            self,
            f"MonitoringStack{environment_suffix}",
            asg=asg_stack.asg,
            alb=alb_stack.alb,
            target_group=alb_stack.target_group,
        )

        # Export key outputs from the main stack
        cdk.CfnOutput(
            self,
            "LoadBalancerDnsName",
            value=alb_stack.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS Name",
            export_name=f"LoadBalancerDnsName-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "VpcId",
            value=vpc_stack.vpc.vpc_id,
            description="VPC ID",
            export_name=f"VpcId-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "DatabaseEndpoint",
            value=rds_stack.cluster.cluster_endpoint.hostname,
            description="RDS Aurora Cluster Endpoint",
            export_name=f"DatabaseEndpoint-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "RedisEndpoint",
            value=elasticache_stack.redis_cluster.attr_configuration_end_point_address,
            description="ElastiCache Redis Endpoint",
            export_name=f"RedisEndpoint-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "CloudFrontDomain",
            value=s3_cloudfront_stack.distribution.distribution_domain_name,
            description="CloudFront Distribution Domain",
            export_name=f"CloudFrontDomain-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "S3BucketName",
            value=s3_cloudfront_stack.image_bucket.bucket_name,
            description="S3 Bucket Name for Images",
            export_name=f"S3BucketName-{environment_suffix}",
        )

        cdk.CfnOutput(
            self,
            "AutoScalingGroupName",
            value=asg_stack.asg.auto_scaling_group_name,
            description="Auto Scaling Group Name",
            export_name=f"AutoScalingGroupName-{environment_suffix}",
        )
