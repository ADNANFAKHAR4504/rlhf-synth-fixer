"""Routing Stack - Route53 weighted routing for traffic migration."""

from typing import Dict, List, Any
from constructs import Construct
from cdktf import Fn
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record


class RoutingConstruct(Construct):
    """Routing Construct with Route53 weighted routing policy."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        alb_dns_name: str,
        alb_zone_id: str,
        domain_name: str = "payment-api.example.com",
        **kwargs: Any
    ) -> None:
        """Initialize Routing construct.

        Args:
            scope: CDK construct scope
            construct_id: Unique identifier for the construct
            environment_suffix: Environment suffix for resource naming
            alb_dns_name: ALB DNS name
            alb_zone_id: ALB hosted zone ID
            domain_name: Domain name for the API
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # Create Route53 hosted zone
        # Using .internal domain to avoid conflicts with reserved domains
        self.hosted_zone = Route53Zone(
            self,
            f"hosted-zone-{environment_suffix}",
            name=f"payment-{environment_suffix}.internal",
            comment=f"Hosted zone for payment API - {environment_suffix}",
            force_destroy=True,
            tags={
                "Name": f"payment-zone-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "payment-migration"
            }
        )

        # Create weighted routing record for old system (on-prem)
        # For demo purposes, point old system to the same ALB
        # In production, this would point to the actual on-premises system
        self.old_system_record = Route53Record(
            self,
            f"old-system-record-{environment_suffix}",
            zone_id=self.hosted_zone.zone_id,
            name=domain_name,
            type="A",
            set_identifier="old-system",
            weighted_routing_policy={
                "weight": 100
            },
            alias={
                "name": alb_dns_name,  # Using same ALB for demo
                "zone_id": alb_zone_id,  # Using same zone for demo
                "evaluate_target_health": True
            },
            health_check_id=None
        )

        # Create weighted routing record for new system (AWS)
        # Start with 0% traffic to new system
        self.new_system_record = Route53Record(
            self,
            f"new-system-record-{environment_suffix}",
            zone_id=self.hosted_zone.zone_id,
            name=domain_name,
            type="A",
            set_identifier="new-system",
            weighted_routing_policy={
                "weight": 0
            },
            alias={
                "name": alb_dns_name,
                "zone_id": alb_zone_id,
                "evaluate_target_health": True
            }
        )

        # Create canary record for testing (10% traffic)
        self.canary_record = Route53Record(
            self,
            f"canary-record-{environment_suffix}",
            zone_id=self.hosted_zone.zone_id,
            name=f"canary.{domain_name}",
            type="A",
            alias={
                "name": alb_dns_name,
                "zone_id": alb_zone_id,
                "evaluate_target_health": True
            }
        )

    def get_hosted_zone_id(self) -> str:
        """Get hosted zone ID."""
        return self.hosted_zone.zone_id

    def get_name_servers(self) -> List[str]:
        """Get name servers for the hosted zone."""
        return self.hosted_zone.name_servers
