from cdktf import TerraformStack
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record, Route53RecordAlias
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck
from constructs import Construct

class DnsModule(Construct):
    def __init__(self, scope: Construct, id: str, primary_provider, secondary_provider,
                 compute, environment_suffix: str, migration_phase: str):
        super().__init__(scope, id)
        
        # Determine weights based on migration phase
        if migration_phase == "legacy":
            primary_weight = 100
            secondary_weight = 0
        elif migration_phase == "migration":
            primary_weight = 50
            secondary_weight = 50
        else:  # production
            primary_weight = 0
            secondary_weight = 100

        # Route 53 Hosted Zone
        self.hosted_zone = Route53Zone(self, "hosted-zone",
            provider=primary_provider,
            name=f"payment-system-{environment_suffix}.internal",
            tags={
                "Name": f"payment-zone-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Health check for primary ALB
        self.primary_health_check = Route53HealthCheck(self, "primary-health-check",
            provider=primary_provider,
            fqdn=compute.primary_alb.dns_name,
            port=80,
            type="HTTP",
            resource_path="/health",
            failure_threshold=3,
            request_interval=30,
            tags={
                "Name": f"payment-health-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Health check for secondary ALB
        self.secondary_health_check = Route53HealthCheck(self, "secondary-health-check",
            provider=primary_provider,
            fqdn=compute.secondary_alb.dns_name,
            port=80,
            type="HTTP",
            resource_path="/health",
            failure_threshold=3,
            request_interval=30,
            tags={
                "Name": f"payment-health-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Weighted routing record for primary region
        self.primary_record = Route53Record(self, "primary-record",
            provider=primary_provider,
            zone_id=self.hosted_zone.zone_id,
            name=f"api.payment-system-{environment_suffix}.internal",
            type="A",
            set_identifier="primary",
            weighted_routing_policy={"weight": primary_weight},
            health_check_id=self.primary_health_check.id,
            alias=Route53RecordAlias(
                name=compute.primary_alb.dns_name,
                zone_id=compute.primary_alb.zone_id,
                evaluate_target_health=True
            )
        )

        # Weighted routing record for secondary region
        self.secondary_record = Route53Record(self, "secondary-record",
            provider=primary_provider,
            zone_id=self.hosted_zone.zone_id,
            name=f"api.payment-system-{environment_suffix}.internal",
            type="A",
            set_identifier="secondary",
            weighted_routing_policy={"weight": secondary_weight},
            health_check_id=self.secondary_health_check.id,
            alias=Route53RecordAlias(
                name=compute.secondary_alb.dns_name,
                zone_id=compute.secondary_alb.zone_id,
                evaluate_target_health=True
            )
        )
