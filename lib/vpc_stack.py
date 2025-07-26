from aws_cdk import (
  Stack,
  CfnOutput,
  Fn,
  aws_ec2 as ec2,
)
from constructs import Construct


class VpcStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    self.vpc = ec2.Vpc(self, "AppVpc",
                       max_azs=3,
                       nat_gateways=1,
                       subnet_configuration=[
                           ec2.SubnetConfiguration(
                               name="public",
                               subnet_type=ec2.SubnetType.PUBLIC
                           ),
                           ec2.SubnetConfiguration(
                               name="private",
                               # Use PRIVATE_WITH_EGRESS for NAT routing
                               subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
                           )
                       ]
                       )

    # Export VPC outputs for integration tests
    CfnOutput(self, "VpcId",
              value=self.vpc.vpc_id,
              description="The VPC ID")

    CfnOutput(self, "VpcCidr",
              value=self.vpc.vpc_cidr_block,
              description="The VPC CIDR block")

    CfnOutput(self, "PublicSubnetIds",
              value=Fn.join(",", [subnet.subnet_id for subnet in self.vpc.public_subnets]),
              description="Comma-separated list of public subnet IDs")

    CfnOutput(self, "PrivateSubnetIds",
              value=Fn.join(",", [subnet.subnet_id for subnet in self.vpc.private_subnets]),
              description="Comma-separated list of private subnet IDs")
