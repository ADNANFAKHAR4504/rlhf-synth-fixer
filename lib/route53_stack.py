from aws_cdk import (
    Stack,
    aws_route53 as route53,
    aws_route53_targets as route53_targets,
    aws_elasticloadbalancingv2 as elbv2,
    CfnOutput,
    Duration,
)
from constructs import Construct


class Route53Stack(Stack):
    """Stack for Route 53 weighted routing configuration"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        source_alb: elbv2.ApplicationLoadBalancer,
        target_alb: elbv2.ApplicationLoadBalancer,
        environment_suffix: str,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = environment_suffix

        # Create hosted zone (or import existing)
        self.hosted_zone = route53.HostedZone(
            self,
            f"hosted-zone-{environment_suffix}",
            zone_name=f"payment-migration-{environment_suffix}.example.com",
            comment=f"Hosted zone for payment processing migration - {environment_suffix}",
        )

        # Create health check for source ALB
        source_health_check = route53.CfnHealthCheck(
            self,
            f"source-health-{environment_suffix}",
            health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                type="HTTPS",
                resource_path="/health",
                fully_qualified_domain_name=source_alb.load_balancer_dns_name,
                port=443,
                request_interval=30,
                failure_threshold=3,
            ),
            health_check_tags=[
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key="Name",
                    value=f"source-alb-health-{environment_suffix}",
                )
            ],
        )

        # Create health check for target ALB
        target_health_check = route53.CfnHealthCheck(
            self,
            f"target-health-{environment_suffix}",
            health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                type="HTTPS",
                resource_path="/health",
                fully_qualified_domain_name=target_alb.load_balancer_dns_name,
                port=443,
                request_interval=30,
                failure_threshold=3,
            ),
            health_check_tags=[
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key="Name",
                    value=f"target-alb-health-{environment_suffix}",
                )
            ],
        )

        # Create A records pointing to ALBs
        # Source environment record
        source_record = route53.ARecord(
            self,
            f"source-record-{environment_suffix}",
            zone=self.hosted_zone,
            record_name=f"source.payment-migration-{environment_suffix}.example.com",
            target=route53.RecordTarget.from_alias(
                route53_targets.LoadBalancerTarget(source_alb)
            ),
            ttl=Duration.seconds(60),
        )

        # Target environment record
        target_record = route53.ARecord(
            self,
            f"target-record-{environment_suffix}",
            zone=self.hosted_zone,
            record_name=f"target.payment-migration-{environment_suffix}.example.com",
            target=route53.RecordTarget.from_alias(
                route53_targets.LoadBalancerTarget(target_alb)
            ),
            ttl=Duration.seconds(60),
        )

        # Outputs
        CfnOutput(
            self,
            "HostedZoneId",
            value=self.hosted_zone.hosted_zone_id,
            description="Route 53 hosted zone ID",
            export_name=f"HostedZoneId-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DomainName",
            value=f"api.payment-migration-{environment_suffix}.example.com",
            description="API domain name for traffic routing",
        )

        CfnOutput(
            self,
            "TrafficShiftCommand",
            value=f"aws route53 change-resource-record-sets --hosted-zone-id {self.hosted_zone.hosted_zone_id} --change-batch file://traffic-shift.json",
            description="Command to shift traffic between environments",
        )

        CfnOutput(
            self,
            "SourceHealthCheckId",
            value=source_health_check.attr_health_check_id,
            description="Health check ID for source ALB",
        )

        CfnOutput(
            self,
            "TargetHealthCheckId",
            value=target_health_check.attr_health_check_id,
            description="Health check ID for target ALB",
        )
