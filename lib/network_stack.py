"""network_stack.py

This module defines the NetworkStack, which creates VPC infrastructure
for the video processing pipeline with multi-AZ configuration.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2
from constructs import Construct


class NetworkStackProps(cdk.NestedStackProps):
    """Properties for NetworkStack."""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class NetworkStack(cdk.NestedStack):
    """
    NetworkStack creates VPC infrastructure with multi-AZ configuration.

    This stack provides:
    - VPC with public and private subnets across 2 AZs
    - NAT Gateways for outbound internet access from private subnets
    - VPC endpoints for AWS services
    - Security groups for different application tiers
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[NetworkStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = props.environment_suffix if props else "dev"

        # Create VPC with 2 AZs for multi-AZ configuration
        # Using 1 NAT gateway for cost optimization and to avoid EIP quota limits
        self.vpc = ec2.Vpc(
            self,
            "VideoProcessingVPC",
            vpc_name=f"video-processing-vpc-{environment_suffix}",
            max_azs=2,
            nat_gateways=1,
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Database",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True,
        )

        # Security group for ECS tasks
        self.ecs_security_group = ec2.SecurityGroup(
            self,
            "ECSSecurityGroup",
            vpc=self.vpc,
            description="Security group for ECS video processing tasks",
            security_group_name=f"ecs-sg-{environment_suffix}",
            allow_all_outbound=True,
        )

        # Security group for RDS database
        self.rds_security_group = ec2.SecurityGroup(
            self,
            "RDSSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS PostgreSQL database",
            security_group_name=f"rds-sg-{environment_suffix}",
            allow_all_outbound=False,
        )

        # Allow ECS tasks to connect to RDS on port 5432
        self.rds_security_group.add_ingress_rule(
            peer=self.ecs_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL access from ECS tasks",
        )

        # Security group for ElastiCache Redis
        self.redis_security_group = ec2.SecurityGroup(
            self,
            "RedisSecurityGroup",
            vpc=self.vpc,
            description="Security group for ElastiCache Redis cluster",
            security_group_name=f"redis-sg-{environment_suffix}",
            allow_all_outbound=False,
        )

        # Allow ECS tasks to connect to Redis on port 6379
        self.redis_security_group.add_ingress_rule(
            peer=self.ecs_security_group,
            connection=ec2.Port.tcp(6379),
            description="Allow Redis access from ECS tasks",
        )

        # Security group for EFS
        self.efs_security_group = ec2.SecurityGroup(
            self,
            "EFSSecurityGroup",
            vpc=self.vpc,
            description="Security group for EFS file system",
            security_group_name=f"efs-sg-{environment_suffix}",
            allow_all_outbound=False,
        )

        # Allow ECS tasks to connect to EFS on port 2049 (NFS)
        self.efs_security_group.add_ingress_rule(
            peer=self.ecs_security_group,
            connection=ec2.Port.tcp(2049),
            description="Allow NFS access from ECS tasks",
        )

        # Add VPC endpoints for cost optimization
        self.vpc.add_gateway_endpoint(
            "S3Endpoint",
            service=ec2.GatewayVpcEndpointAwsService.S3,
        )

        self.vpc.add_gateway_endpoint(
            "DynamoDBEndpoint",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        )

        # Output VPC ID
        cdk.CfnOutput(
            self,
            "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID for the video processing pipeline",
            export_name=f"VpcId-{environment_suffix}",
        )
