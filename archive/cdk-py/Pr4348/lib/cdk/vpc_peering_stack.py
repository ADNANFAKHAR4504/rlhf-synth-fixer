from aws_cdk import aws_ec2 as ec2, Stack
from constructs import Construct


class VpcPeeringStack(Stack):
  def __init__(
    self,
    scope: Construct,
    stack_id: str,
    vpc1: ec2.Vpc,
    vpc2: ec2.Vpc,
    **kwargs
  ):
    super().__init__(scope, stack_id, **kwargs)

    peering = ec2.CfnVPCPeeringConnection(
      self,
      "Peering",
      vpc_id=vpc1.vpc_id,
      peer_vpc_id=vpc2.vpc_id,
      peer_region="us-east-2",
    )

    # Add routes for VPC1 private subnets
    for index, subnet in enumerate(vpc1.private_subnets):
      ec2.CfnRoute(
        self,
        f"RouteToVPC2-Subnet{index}",
        route_table_id=subnet.route_table.route_table_id,
        destination_cidr_block=vpc2.vpc_cidr_block,
        vpc_peering_connection_id=peering.ref,
      )

    # Add routes for VPC2 private subnets
    for index, subnet in enumerate(vpc2.private_subnets):
      ec2.CfnRoute(
        self,
        f"RouteToVPC1-Subnet{index}",
        route_table_id=subnet.route_table.route_table_id,
        destination_cidr_block=vpc1.vpc_cidr_block,
        vpc_peering_connection_id=peering.ref,
      )
