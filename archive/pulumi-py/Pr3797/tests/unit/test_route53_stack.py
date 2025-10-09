import pytest
import pulumi
from pulumi import ResourceOptions
from typing import Dict
from lib.route53_stack import Route53Stack

def test_route53_stack():
    name = "test-route53-stack"
    environment_suffix = "test"
    tags: Dict[str, str] = {"environment": "test"}
    cloudfront_domain_name = pulumi.Output.from_input("test-cloudfront.cloudfront.net")
    cloudfront_hosted_zone_id = pulumi.Output.from_input("Z2FDTNDATAQYW2")  # Dummy CloudFront hosted zone ID

    route53_stack = Route53Stack(
        name=name,
        environment_suffix=environment_suffix,
        cloudfront_domain_name=cloudfront_domain_name,
        cloudfront_hosted_zone_id=cloudfront_hosted_zone_id,
        tags=tags
    )

    assert route53_stack is not None