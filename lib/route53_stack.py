"""
route53_stack.py

Route53 hosted zones and DNS records.
"""

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
from typing import Optional


class Route53Stack(pulumi.ComponentResource):
    """Route53 DNS configuration."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        domain: str,
        cloudfront_domain: Output[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__("custom:route53:Route53Stack", name, None, opts)

        # Create hosted zone
        self.hosted_zone = aws.route53.Zone(
            f"hosted-zone-{environment_suffix}",
            name=domain,
            comment=f"Hosted zone for {environment_suffix} environment",
            tags={**tags, "Name": f"hosted-zone-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create A record pointing to CloudFront
        self.a_record = aws.route53.Record(
            f"a-record-{environment_suffix}",
            zone_id=self.hosted_zone.zone_id,
            name=domain,
            type="A",
            aliases=[
                aws.route53.RecordAliasArgs(
                    name=cloudfront_domain,
                    zone_id="Z2FDTNDATAQYW2",  # CloudFront hosted zone ID
                    evaluate_target_health=False,
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({
            "hosted_zone_id": self.hosted_zone.zone_id,
            "name_servers": self.hosted_zone.name_servers,
        })
