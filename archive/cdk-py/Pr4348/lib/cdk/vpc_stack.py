from aws_cdk import aws_ec2 as ec2, Stack
from constructs import Construct


class VpcStack(Stack):
  def __init__(self, scope: Construct, stack_id: str, **kwargs):
    super().__init__(scope, stack_id, **kwargs)

    self.vpc = ec2.Vpc(
      self,
      "VPC",
      cidr="10.0.0.0/16",
      max_azs=2,
      subnet_configuration=[
        ec2.SubnetConfiguration(
          name="public",
          subnet_type=ec2.SubnetType.PUBLIC,
          cidr_mask=24,
        ),
        ec2.SubnetConfiguration(
          name="private",
          subnet_type=ec2.SubnetType.PRIVATE_WITH_NAT,
          cidr_mask=24,
        ),
      ],
      nat_gateways=1,
    )
