from aws_cdk import (
    aws_route53 as route53,
    aws_route53_targets as targets,
    Stack
)
from constructs import Construct

class Route53Stack(Stack):
    def __init__(self, scope: Construct, id: str, alb1, alb2, **kwargs):
        super().__init__(scope, id, **kwargs)

        # Create a public hosted zone
        zone = route53.HostedZone(self, "Zone", zone_name="app.example.com")

        # Health check for primary ALB
        health_check = route53.CfnHealthCheck(
            self,
            "HealthCheck",
            health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                fully_qualified_domain_name=alb1.load_balancer_dns_name,
                port=80,
                type="HTTP",
                resource_path="/health",
                failure_threshold=3
            )
        )

        # Primary failover record using CfnRecordSet
        route53.CfnRecordSet(
            self,
            "PrimaryRecord",
            hosted_zone_id=zone.hosted_zone_id,
            name="app.app.example.com.",
            type="A",
            set_identifier="primary",
            failover="PRIMARY",
            health_check_id=health_check.ref,
            alias_target=route53.CfnRecordSet.AliasTargetProperty(
                dns_name=alb1.load_balancer_dns_name,
                hosted_zone_id=alb1.env.region  # You might need to hardcode ALB HostedZoneId instead
            )
        )

        # Secondary failover record using CfnRecordSet
        route53.CfnRecordSet(
            self,
            "SecondaryRecord",
            hosted_zone_id=zone.hosted_zone_id,
            name="app.app.example.com.",
            type="A",
            set_identifier="secondary",
            failover="SECONDARY",
            alias_target=route53.CfnRecordSet.AliasTargetProperty(
                dns_name=alb2.load_balancer_dns_name,
                hosted_zone_id=alb2.env.region  # Same as above: make sure it's the HostedZoneId for the ALB
            )
        )
