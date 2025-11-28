"""Route 53 DNS for payment processing system."""

from constructs import Construct
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record


class DnsStack(Construct):
    """Route 53 DNS with simple routing."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 provider, lambda_url: str):
        super().__init__(scope, construct_id)

        # Hosted zone
        hosted_zone = Route53Zone(
            self, "hosted_zone",
            name=f"payment-{environment_suffix}.testing.local",
            comment=f"Payment processing system - {environment_suffix}",
            tags={"Name": f"payment-zone-{environment_suffix}"},
            provider=provider,
        )

        # Clean Lambda URL
        clean_url = lambda_url.replace("https://", "").rstrip("/")

        # Simple DNS record
        Route53Record(
            self, "api_record",
            zone_id=hosted_zone.zone_id,
            name=f"api.payment-{environment_suffix}.testing.local",
            type="CNAME",
            ttl=60,
            records=[clean_url],
            provider=provider,
        )

        self.hosted_zone_id = hosted_zone.zone_id
