from constructs import Construct
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import (
    Route53Record,
    Route53RecordAlias,
    Route53RecordFailoverRoutingPolicy
)
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck


class TrafficManagementConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_provider,
        primary_alb_dns: str,
        secondary_alb_dns: str,
        primary_region: str,
        secondary_region: str,
        primary_alb_zone_id: str,
        secondary_alb_zone_id: str
    ):
        super().__init__(scope, construct_id)

        # Route 53 hosted zone
        self.hosted_zone = Route53Zone(
            self,
            "hosted-zone",
            name=f"trading-platform-{environment_suffix}.internal",
            tags={"Name": f"trading-zone-{environment_suffix}"},
            provider=primary_provider
        )

        # Health check for primary region
        primary_health_check = Route53HealthCheck(
            self,
            "primary-health-check",
            fqdn=primary_alb_dns,
            port=80,
            type="HTTP",
            resource_path="/health",
            failure_threshold=2,
            request_interval=30,
            measure_latency=True,
            tags={"Name": f"primary-health-{environment_suffix}"},
            provider=primary_provider
        )

        # Health check for secondary region
        secondary_health_check = Route53HealthCheck(
            self,
            "secondary-health-check",
            fqdn=secondary_alb_dns,
            port=80,
            type="HTTP",
            resource_path="/health",
            failure_threshold=2,
            request_interval=30,
            measure_latency=True,
            tags={"Name": f"secondary-health-{environment_suffix}"},
            provider=primary_provider
        )

        # Primary region DNS record with failover routing
        Route53Record(
            self,
            "primary-record",
            zone_id=self.hosted_zone.zone_id,
            name=f"trading-platform-{environment_suffix}.internal",
            type="A",
            alias=Route53RecordAlias(
                name=primary_alb_dns,
                zone_id=primary_alb_zone_id,
                evaluate_target_health=True
            ),
            health_check_id=primary_health_check.id,
            failover_routing_policy=Route53RecordFailoverRoutingPolicy(
                type="PRIMARY"
            ),
            set_identifier=f"primary-{environment_suffix}",
            provider=primary_provider
        )

        # Secondary region DNS record with failover routing
        Route53Record(
            self,
            "secondary-record",
            zone_id=self.hosted_zone.zone_id,
            name=f"trading-platform-{environment_suffix}.internal",
            type="A",
            alias=Route53RecordAlias(
                name=secondary_alb_dns,
                zone_id=secondary_alb_zone_id,
                evaluate_target_health=True
            ),
            health_check_id=secondary_health_check.id,
            failover_routing_policy=Route53RecordFailoverRoutingPolicy(
                type="SECONDARY"
            ),
            set_identifier=f"secondary-{environment_suffix}",
            provider=primary_provider
        )

    @property
    def domain_name(self):
        return self.hosted_zone.name
