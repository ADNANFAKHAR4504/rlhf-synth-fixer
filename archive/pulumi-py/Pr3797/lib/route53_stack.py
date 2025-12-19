"""
Route 53 Stack for DNS management.
"""

import pulumi
from pulumi_aws import route53
from pulumi import ResourceOptions, Output
from typing import Optional


class Route53Stack(pulumi.ComponentResource):
    """
    Creates Route 53 hosted zone and DNS records for CloudFront distribution.
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        cloudfront_domain_name: Output[str],
        cloudfront_hosted_zone_id: Output[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:route53:Route53Stack', name, None, opts)

        # Create hosted zone with unique domain name
        # Using a subdomain pattern that won't conflict with AWS reserved names
        domain_name = f"tap-cdn-{environment_suffix}.local"

        self.zone = route53.Zone(
            f"dns-zone-{environment_suffix}",
            name=domain_name,
            comment=f"DNS zone for TAP CDN - {environment_suffix}",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create A record (alias) pointing to CloudFront
        route53.Record(
            f"cloudfront-a-record-{environment_suffix}",
            zone_id=self.zone.zone_id,
            name=f"cdn.{domain_name}",
            type="A",
            aliases=[route53.RecordAliasArgs(
                name=cloudfront_domain_name,
                zone_id=cloudfront_hosted_zone_id,
                evaluate_target_health=False
            )],
            opts=ResourceOptions(parent=self)
        )

        # Create AAAA record (IPv6 alias) pointing to CloudFront
        route53.Record(
            f"cloudfront-aaaa-record-{environment_suffix}",
            zone_id=self.zone.zone_id,
            name=f"cdn.{domain_name}",
            type="AAAA",
            aliases=[route53.RecordAliasArgs(
                name=cloudfront_domain_name,
                zone_id=cloudfront_hosted_zone_id,
                evaluate_target_health=False
            )],
            opts=ResourceOptions(parent=self)
        )

        self.zone_id = self.zone.zone_id
        self.name_servers = self.zone.name_servers

        self.register_outputs({
            'zone_id': self.zone_id,
            'name_servers': self.name_servers
        })
