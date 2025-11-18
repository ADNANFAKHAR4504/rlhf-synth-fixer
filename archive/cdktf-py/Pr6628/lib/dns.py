from constructs import Construct
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_zone_association import Route53ZoneAssociation
from typing import Dict


class DnsModule(Construct):
    """
    Creates Route 53 private hosted zones for cross-VPC DNS resolution.
    Enables service discovery across peered VPCs.
    """

    def __init__(
        self,
        scope: Construct,
        id: str,
        payment_vpc_id: str,
        analytics_vpc_id: str,
        environment_suffix: str,
        common_tags: Dict[str, str] = None
    ):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.common_tags = common_tags or {}

        # Create private hosted zone for payment domain
        self.payment_zone = self._create_hosted_zone(
            "payment.internal",
            payment_vpc_id,
            "payment"
        )

        # Associate payment zone with analytics VPC for cross-VPC resolution
        self._associate_zone_with_vpc(
            self.payment_zone,
            analytics_vpc_id,
            "payment",
            "analytics"
        )

        # Create private hosted zone for analytics domain
        self.analytics_zone = self._create_hosted_zone(
            "analytics.internal",
            analytics_vpc_id,
            "analytics"
        )

        # Associate analytics zone with payment VPC for cross-VPC resolution
        self._associate_zone_with_vpc(
            self.analytics_zone,
            payment_vpc_id,
            "analytics",
            "payment"
        )

    def _create_hosted_zone(
        self,
        domain_name: str,
        vpc_id: str,
        vpc_name: str
    ) -> Route53Zone:
        """Create Route 53 private hosted zone"""

        # Include environment suffix in domain name
        full_domain = f"{vpc_name}-{self.environment_suffix}.{domain_name}"

        zone = Route53Zone(
            self,
            f"zone-{vpc_name}-{self.environment_suffix}",
            name=full_domain,
            vpc=[{
                "vpcId": vpc_id
            }],
            tags={
                "Name": f"zone-{vpc_name}-{self.environment_suffix}",
                **self.common_tags
            }
        )
        return zone

    def _associate_zone_with_vpc(
        self,
        zone: Route53Zone,
        vpc_id: str,
        zone_name: str,
        vpc_name: str
    ):
        """Associate hosted zone with additional VPC for cross-VPC DNS"""

        Route53ZoneAssociation(
            self,
            f"zone-assoc-{zone_name}-{vpc_name}-{self.environment_suffix}",
            zone_id=zone.zone_id,
            vpc_id=vpc_id
        )
