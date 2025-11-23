"""Route 53 DNS with health checks and failover."""

from constructs import Construct
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck


class DnsStack(Construct):
    """Route 53 DNS with health checks and failover routing."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 primary_provider, primary_lambda_url: str, secondary_lambda_url: str):
        super().__init__(scope, construct_id)

        # Hosted zone
        hosted_zone = Route53Zone(
            self, "hosted_zone",
            name=f"payment-{environment_suffix}.testing.local",
            comment=f"Payment processing system - {environment_suffix}",
            tags={"Name": f"payment-zone-{environment_suffix}"},
            provider=primary_provider,
        )

        # Clean Lambda URLs
        primary_url = primary_lambda_url.replace("https://", "").rstrip("/")
        secondary_url = secondary_lambda_url.replace("https://", "").rstrip("/")

        # Health checks
        primary_health = Route53HealthCheck(
            self, "primary_health",
            type="HTTPS",
            resource_path="/",
            fqdn=primary_url,
            port=443,
            request_interval=30,
            failure_threshold=3,
            measure_latency=True,
            tags={"Name": f"payment-primary-health-{environment_suffix}"},
            provider=primary_provider,
        )

        secondary_health = Route53HealthCheck(
            self, "secondary_health",
            type="HTTPS",
            resource_path="/",
            fqdn=secondary_url,
            port=443,
            request_interval=30,
            failure_threshold=3,
            measure_latency=True,
            tags={"Name": f"payment-secondary-health-{environment_suffix}"},
            provider=primary_provider,
        )

        # Failover records
        Route53Record(
            self, "primary_record",
            zone_id=hosted_zone.zone_id,
            name=f"api.payment-{environment_suffix}.testing.local",
            type="CNAME",
            ttl=60,
            records=[primary_url],
            set_identifier="primary",
            health_check_id=primary_health.id,
            failover_routing_policy={"type": "PRIMARY"},
            provider=primary_provider,
        )

        Route53Record(
            self, "secondary_record",
            zone_id=hosted_zone.zone_id,
            name=f"api.payment-{environment_suffix}.testing.local",
            type="CNAME",
            ttl=60,
            records=[secondary_url],
            set_identifier="secondary",
            health_check_id=secondary_health.id,
            failover_routing_policy={"type": "SECONDARY"},
            provider=primary_provider,
        )

        self.hosted_zone_id = hosted_zone.zone_id