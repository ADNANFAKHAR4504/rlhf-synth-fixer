"""vpc_peering_construct.py

Custom CDK construct for VPC peering connections between environments.
"""

from aws_cdk import aws_ec2 as ec2
from constructs import Construct


class VpcPeeringConstruct(Construct):
    """Custom construct for VPC peering connections."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.IVpc | None = None,
        peer_vpc_id: str | None = None,
        peer_vpc_cidr: str | None = None,
        environment_suffix: str = "",
        source_vpc: object | None = None,
        destination_vpc: object | None = None,
        **kwargs
    ):
        super().__init__(scope, construct_id)

        # Support tests calling with source_vpc/destination_vpc
        if vpc is None and source_vpc is not None:
            vpc = source_vpc
        if peer_vpc_id is None and destination_vpc is not None:
            peer_vpc_id = getattr(destination_vpc, "vpc_id", None)
        if peer_vpc_cidr is None and destination_vpc is not None:
            peer_vpc_cidr = getattr(destination_vpc, "vpc_cidr_block", None)

        assert vpc is not None, "vpc/source_vpc is required"
        assert peer_vpc_id, "peer_vpc_id/destination_vpc.vpc_id is required"
        assert peer_vpc_cidr, "peer_vpc_cidr/destination_vpc.vpc_cidr_block is required"

        # Create VPC peering connection
        self.peering_connection = ec2.CfnVPCPeeringConnection(
            self,
            f"PeeringConnection-{environment_suffix}",
            vpc_id=vpc.vpc_id,
            peer_vpc_id=peer_vpc_id,
            tags=[{
                "key": "Name",
                "value": f"payment-peering-{environment_suffix}"
            }]
        )

        # Add routes to peer VPC CIDR in private subnets
        for i, subnet in enumerate(vpc.private_subnets):
            ec2.CfnRoute(
                self,
                f"PeeringRoute{i}-{environment_suffix}",
                route_table_id=subnet.route_table.route_table_id,
                destination_cidr_block=peer_vpc_cidr,
                vpc_peering_connection_id=self.peering_connection.ref
            )
