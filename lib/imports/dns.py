from constructs import Construct
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck
from cdktf_cdktf_provider_aws.route53_record import Route53Record


class DnsConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_provider,
        primary_endpoint: str,
        secondary_endpoint: str
    ):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # Route 53 Hosted Zone
        self.hosted_zone = Route53Zone(
            self,
            "hosted_zone",
            name=f"payment-dr-{environment_suffix}.example.com",
            tags={
                "Name": f"payment-dr-zone-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # Health check for primary endpoint
        self.primary_health_check = Route53HealthCheck(
            self,
            "primary_health_check",
            type="HTTPS",
            resource_path="/health",
            fqdn=primary_endpoint.replace("https://", "").replace("/", ""),
            port=443,
            request_interval=30,
            failure_threshold=3,
            measure_latency=True,
            tags={
                "Name": f"payment-primary-health-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # Health check for secondary endpoint
        self.secondary_health_check = Route53HealthCheck(
            self,
            "secondary_health_check",
            type="HTTPS",
            resource_path="/health",
            fqdn=secondary_endpoint.replace("https://", "").replace("/", ""),
            port=443,
            request_interval=30,
            failure_threshold=3,
            measure_latency=True,
            tags={
                "Name": f"payment-secondary-health-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=primary_provider
        )

        # Primary DNS record with failover
        Route53Record(
            self,
            "primary_record",
            zone_id=self.hosted_zone.zone_id,
            name=f"api.payment-dr-{environment_suffix}.example.com",
            type="CNAME",
            ttl=60,
            records=[primary_endpoint.replace("https://", "")],
            set_identifier="primary",
            failover_routing_policy={
                "type": "PRIMARY"
            },
            health_check_id=self.primary_health_check.id,
            provider=primary_provider
        )

        # Secondary DNS record with failover
        Route53Record(
            self,
            "secondary_record",
            zone_id=self.hosted_zone.zone_id,
            name=f"api.payment-dr-{environment_suffix}.example.com",
            type="CNAME",
            ttl=60,
            records=[secondary_endpoint.replace("https://", "")],
            set_identifier="secondary",
            failover_routing_policy={
                "type": "SECONDARY"
            },
            health_check_id=self.secondary_health_check.id,
            provider=primary_provider
        )

    @property
    def failover_domain(self):
        return f"api.payment-dr-{self.environment_suffix}.example.com"
