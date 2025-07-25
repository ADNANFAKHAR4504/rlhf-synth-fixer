from aws_cdk import (
    NestedStack,
    aws_route53 as route53,
    aws_route53_targets as targets,
)
from constructs import Construct

# You need to import your AlbStack class for this to work
from .alb_stack import AlbStack  # <-- Replace with actual path

class Route53Stack(NestedStack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        hosted_zone = route53.HostedZone.from_lookup(
            self, "HostedZone",
            domain_name="example.com"
        )

        alb_stack = AlbStack(self, "AlbStack-us-east-1", vpc=...)  # You must pass a VPC here!

        record_set = route53.RecordSet(
            self, "AppRecordSet",
            zone=hosted_zone,
            record_type=route53.RecordType.A,
            target=route53.RecordTarget.from_alias(
                targets.LoadBalancerTarget(load_balancer=alb_stack.alb)
            )
        )


