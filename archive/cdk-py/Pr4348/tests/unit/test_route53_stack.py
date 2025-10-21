# tests/unit/test_route53_stack.py

import pytest
import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2, aws_elasticloadbalancingv2 as elbv2
from aws_cdk.assertions import Template

from lib.cdk.route53_stack import Route53Stack


@pytest.fixture
def route53_stack():
    app = cdk.App()
    stack = cdk.Stack(app, "MockStack")

    # Create dummy VPC (required for ALB)
    vpc = ec2.Vpc(stack, "TestVPC", max_azs=1)

    # Create dummy ALBs to pass to Route53Stack
    alb1 = elbv2.ApplicationLoadBalancer(
        stack, "TestALB1",
        vpc=vpc,
        internet_facing=True
    )

    alb2 = elbv2.ApplicationLoadBalancer(
        stack, "TestALB2",
        vpc=vpc,
        internet_facing=True
    )

    # Instantiate Route53Stack with dummy ALBs
    route53 = Route53Stack(app, "TestRoute53Stack", alb1=alb1, alb2=alb2)
    return Template.from_stack(route53)


def test_route53_configuration(route53_stack):
    # Check HostedZone is created
    route53_stack.resource_count_is("AWS::Route53::HostedZone", 1)

    # Check a RecordSet with Failover = PRIMARY exists
    route53_stack.has_resource_properties("AWS::Route53::RecordSet", {
        "Type": "A",
        "Failover": "PRIMARY"
    })
    