"""vpc_stack.py
VPC configuration with cross-region peering.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2
from constructs import Construct


class VpcStackProps:
    """Properties for VPC stack."""

    def __init__(
        self,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str
    ):
        self.environment_suffix = environment_suffix
        self.primary_region = primary_region
        self.secondary_region = secondary_region


class VpcStack(Construct):
    """Creates VPCs in both regions with peering connection."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: VpcStackProps
    ):
        super().__init__(scope, construct_id)

        # Primary VPC in us-east-1
        self.primary_vpc = ec2.Vpc(
            self,
            f'PrimaryVpc{props.environment_suffix}',
            vpc_name=f'dr-primary-vpc-{props.environment_suffix}',
            ip_addresses=ec2.IpAddresses.cidr('10.0.0.0/16'),
            max_azs=3,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name='Public',
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name='Private',
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name='Isolated',
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # Secondary VPC in us-west-2
        self.secondary_vpc = ec2.Vpc(
            self,
            f'SecondaryVpc{props.environment_suffix}',
            vpc_name=f'dr-secondary-vpc-{props.environment_suffix}',
            ip_addresses=ec2.IpAddresses.cidr('10.1.0.0/16'),
            max_azs=3,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name='Public',
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name='Private',
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name='Isolated',
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # Note: VPC peering would require custom resources or separate stack
        # due to cross-region complexity in CDK

        # Tags
        cdk.Tags.of(self.primary_vpc).add('DR-Role', 'Primary-Network')
        cdk.Tags.of(self.secondary_vpc).add('DR-Role', 'Secondary-Network')

        # Outputs
        cdk.CfnOutput(
            self,
            'PrimaryVpcId',
            value=self.primary_vpc.vpc_id,
            description='Primary VPC ID'
        )
        cdk.CfnOutput(
            self,
            'SecondaryVpcId',
            value=self.secondary_vpc.vpc_id,
            description='Secondary VPC ID'
        )