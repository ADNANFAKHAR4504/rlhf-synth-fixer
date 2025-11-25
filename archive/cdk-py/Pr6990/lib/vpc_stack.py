"""vpc_stack.py
VPC infrastructure for primary and replica databases.
Note: Both VPCs are deployed in the same region due to single-stack architecture.
RDS read replicas in the same region do not require VPC peering.
"""

from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
)


class VpcStack(Construct):
    """
    Creates VPC infrastructure for primary and replica databases.

    Note: Both VPCs are created in the same region (stack's region) due to
    CDK single-stack architecture limitations. For true multi-region deployment,
    separate stacks would be required.

    Args:
        scope (Construct): The parent construct
        construct_id (str): The unique identifier for this construct
        environment_suffix (str): Environment suffix for resource naming

    Attributes:
        primary_vpc (ec2.Vpc): VPC for primary database
        replica_vpc (ec2.Vpc): VPC for replica database (same region as primary)
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Primary VPC
        self.primary_vpc = ec2.Vpc(
            self,
            f"PrimaryVpc-{environment_suffix}",
            vpc_name=f"primary-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            nat_gateways=0,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"private-subnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # Replica VPC (different CIDR to avoid overlap)
        # Note: This VPC is created in the same region as primary due to single-stack architecture
        # For true cross-region deployment, a multi-stack approach would be required
        self.replica_vpc = ec2.Vpc(
            self,
            f"ReplicaVpc-{environment_suffix}",
            vpc_name=f"replica-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.1.0.0/16"),
            max_azs=2,
            nat_gateways=0,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"private-subnet-replica-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # VPC Endpoints for S3 (cost optimization - avoid NAT Gateway)
        self.primary_vpc.add_gateway_endpoint(
            f"PrimaryS3Endpoint-{environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.S3
        )

        self.replica_vpc.add_gateway_endpoint(
            f"ReplicaS3Endpoint-{environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.S3
        )
