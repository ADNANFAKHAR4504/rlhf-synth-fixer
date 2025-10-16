# tests/unit/test_vpc_stack.py

import pytest
from aws_cdk import App, Environment
from aws_cdk.assertions import Template

from lib.cdk.vpc_stack import VpcStack


@pytest.fixture
def vpc_stack():
    app = App()
    stack = VpcStack(app, "TestVPCStack", env=Environment(region="us-east-1"))
    return Template.from_stack(stack)


def test_vpc_configuration(vpc_stack):
    # Verify VPC has correct CIDR and DNS settings
    vpc_stack.resource_count_is("AWS::EC2::VPC", 1)
    vpc_stack.has_resource_properties("AWS::EC2::VPC", {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": True,
        "EnableDnsSupport": True
    })

    # Verify 4 subnets
    vpc_stack.resource_count_is("AWS::EC2::Subnet", 4)

    # Inspect the JSON output to count public/private subnets
    resources = vpc_stack.to_json()["Resources"]

    public_subnets = [
        res for res in resources.values()
        if res["Type"] == "AWS::EC2::Subnet" and res["Properties"].get("MapPublicIpOnLaunch") is True
    ]

    private_subnets = [
        res for res in resources.values()
        if res["Type"] == "AWS::EC2::Subnet" and res["Properties"].get("MapPublicIpOnLaunch") is False
    ]

    assert len(public_subnets) == 2, "Expected 2 public subnets"
    assert len(private_subnets) == 2, "Expected 2 private subnets"

    # Verify NAT Gateway
    vpc_stack.resource_count_is("AWS::EC2::NatGateway", 1)
    