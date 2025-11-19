"""vpc_stack.py
VPC stack for payment processing infrastructure with optimized NAT configuration.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
)
from constructs import Construct


class VpcStackProps:
    """Properties for VPC Stack."""

    def __init__(
        self,
        environment_suffix: str,
        environment: str = "dev",
        cidr: str = "10.0.0.0/16"
    ):
        self.environment_suffix = environment_suffix
        self.environment = environment
        self.cidr = cidr


class VpcStack(cdk.Stack):
    """
    VPC Stack implementing NAT Gateway to NAT Instance optimization for dev environment.
    Requirement 7: Replace NAT Gateways with NAT Instances for development environment.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: VpcStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment = props.environment
        environment_suffix = props.environment_suffix

        # Cost allocation tags
        tags = {
            "Environment": environment,
            "Team": "payments",
            "CostCenter": "engineering",
            "Project": "payment-processing"
        }

        # Create VPC with public and private subnets across 2 AZs
        self.vpc = ec2.Vpc(
            self,
            f"{environment}-payment-vpc-main",
            ip_addresses=ec2.IpAddresses.cidr(props.cidr),
            max_azs=2,
            # Use NAT Instances for dev to save costs (Requirement 7)
            nat_gateway_provider=ec2.NatProvider.instance_v2(
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.T4G,  # ARM-based Graviton2
                    ec2.InstanceSize.NANO
                )
            ) if environment == "dev" else ec2.NatProvider.gateway(),
            nat_gateways=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"{environment}-payment-subnet-public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"{environment}-payment-subnet-private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )

        # Apply cost allocation tags
        for key, value in tags.items():
            cdk.Tags.of(self.vpc).add(key, value)

        # Output VPC ID
        cdk.CfnOutput(
            self,
            "VpcId",
            value=self.vpc.vpc_id,
            export_name=f"{environment}-payment-vpc-id"
        )
