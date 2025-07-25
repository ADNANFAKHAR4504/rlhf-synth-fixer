from aws_cdk import (
  Stack,
  aws_elasticloadbalancingv2 as elbv2,
  aws_ec2 as ec2,
)
from constructs import Construct


class AlbStack(Stack):
  def __init__(self, scope: Construct, construct_id: str,
               vpc: ec2.Vpc, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    self.alb = elbv2.ApplicationLoadBalancer(self, "AppAlb",
                                             vpc=vpc,
                                             internet_facing=True
                                             )
