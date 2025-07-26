from aws_cdk import (
  NestedStack,
  CfnOutput,
  Fn,
  aws_route53 as route53,
)
from constructs import Construct


class Route53Stack(NestedStack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    # Create a hosted zone for the domain
    # Note: In production, you'd typically use an existing hosted zone
    self.hosted_zone = route53.HostedZone(
        self, "HostedZone",
        zone_name="turing229210.com"
    )

    # Failover routing will be implemented when ALB targets are available
    # This is a placeholder for proper multi-region DNS failover

    # Export Route53 outputs for integration tests
    CfnOutput(self, "HostedZoneId",
              value=self.hosted_zone.hosted_zone_id,
              description="The Route53 hosted zone ID")

    CfnOutput(self, "HostedZoneName",
              value=self.hosted_zone.zone_name,
              description="The Route53 hosted zone name")

    CfnOutput(self, "NameServers",
              value=Fn.join(",", self.hosted_zone.hosted_zone_name_servers or []),
              description="Comma-separated list of name servers")
