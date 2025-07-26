from aws_cdk import (
  Stack,
  CfnOutput,
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

    # Export ALB outputs for integration tests
    CfnOutput(self, "LoadBalancerArn",
              value=self.alb.load_balancer_arn,
              description="The Application Load Balancer ARN")

    CfnOutput(self, "LoadBalancerDnsName",
              value=self.alb.load_balancer_dns_name,
              description="The Application Load Balancer DNS name")

    CfnOutput(self, "LoadBalancerHostedZoneId",
              value=self.alb.load_balancer_canonical_hosted_zone_id,
              description="The Application Load Balancer hosted zone ID")
