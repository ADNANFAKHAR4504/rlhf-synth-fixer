from cdktf import TerraformStack
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record, Route53RecordAlias
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck
from constructs import Construct

class DnsModule(Construct):
    def __init__(self, scope: Construct, id: str, primary_provider, compute,
                 environment_suffix: str, migration_phase: str):
        super().__init__(scope, id)

        # Route 53 Hosted Zone
        self.hosted_zone = Route53Zone(self, "hosted-zone",
            provider=primary_provider,
            name=f"payments-{environment_suffix}.example.com",
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

        # Weighted routing record for primary region
        self.primary_record = Route53Record(self, "primary-record",
            provider=primary_provider,
            zone_id=self.hosted_zone.zone_id,
            name=f"api.payments-{environment_suffix}.example.com",
            type="A",
            set_identifier="primary",
            weighted_routing_policy={"weight": 100},  # ISSUE: Should support variable weights for gradual migration
            health_check_id=self.primary_health_check.id,
            alias=Route53RecordAlias(
                name=compute.primary_alb.dns_name,
                zone_id=compute.primary_alb.zone_id,
                evaluate_target_health=True
            )
        )

        # ISSUE: Missing secondary region DNS record
        # Should have weighted record for secondary region ALB

        # ISSUE: Missing health check for secondary region
