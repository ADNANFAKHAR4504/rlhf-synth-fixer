"""
Route 53 DNS failover configuration.
BUG #5: Health check interval set to 60 seconds instead of required 30 seconds
BUG #6: Missing CloudWatch alarm for health check
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional


class Route53Stack(pulumi.ComponentResource):
    """Route 53 DNS configuration with health checks and failover routing."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_endpoint: Output[str],
        secondary_endpoint: Output[str],
        domain_name: Optional[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:infrastructure:Route53Stack', name, None, opts)

        # Create health check for primary region
        # BUG #5: request_interval should be 30, not 60
        self.health_check = aws.route53.HealthCheck(
            f"trading-health-check-{environment_suffix}",
            type="HTTPS",
            resource_path="/health",
            fqdn=primary_endpoint.apply(lambda ep: ep.replace("https://", "").replace("http://", "").split("/")[0]),
            port=443,
            request_interval=30,
            failure_threshold=3,
            measure_latency=True,
            tags={**tags, 'Name': f"trading-health-check-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # BUG #6: Missing CloudWatch alarm for health check status
        # Should create alarm to monitor HealthCheckStatus metric

        if domain_name:
            # Create hosted zone
            self.hosted_zone = aws.route53.Zone(
                f"trading-zone-{environment_suffix}",
                name=domain_name,
                tags={**tags, 'Name': f"trading-zone-{environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )

            # Primary record
            primary_record_value = primary_endpoint.apply(
                lambda ep: ep.replace("https://", "").replace("http://", "").split("/")[0]
            )
            self.primary_record = aws.route53.Record(
                f"trading-primary-record-{environment_suffix}",
                zone_id=self.hosted_zone.zone_id,
                name=f"api.{domain_name}",
                type="CNAME",
                ttl=60,
                records=[primary_record_value],
                set_identifier="primary",
                failover_routing_policies=[aws.route53.RecordFailoverRoutingPolicyArgs(
                    type="PRIMARY"
                )],
                health_check_id=self.health_check.id,
                opts=ResourceOptions(parent=self)
            )

            # Secondary record
            secondary_record_value = secondary_endpoint.apply(
                lambda ep: ep.replace("https://", "").replace("http://", "").split("/")[0]
            )
            self.secondary_record = aws.route53.Record(
                f"trading-secondary-record-{environment_suffix}",
                zone_id=self.hosted_zone.zone_id,
                name=f"api.{domain_name}",
                type="CNAME",
                ttl=60,
                records=[secondary_record_value],
                set_identifier="secondary",
                failover_routing_policies=[aws.route53.RecordFailoverRoutingPolicyArgs(
                    type="SECONDARY"
                )],
                opts=ResourceOptions(parent=self)
            )

        self.health_check_id = self.health_check.id

        self.register_outputs({
            'health_check_id': self.health_check.id,
        })
