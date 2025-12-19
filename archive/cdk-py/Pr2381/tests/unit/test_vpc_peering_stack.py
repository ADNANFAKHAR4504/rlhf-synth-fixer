# tests/unit/test_vpc_peering_stack.py

import os
import sys
import pytest

from aws_cdk import App, Stack, Environment
from aws_cdk.assertions import Template
from aws_cdk import aws_ec2 as ec2

# Ensure lib directory is accessible
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from lib.cdk.vpc_peering_stack import VpcPeeringStack


@pytest.fixture
def app():
    return App()


@pytest.fixture
def test_env():
    return Environment(account="123456789012", region="us-west-2")


@pytest.fixture
def mock_vpcs(app, test_env):
    vpc_stack = Stack(app, "MockVpcStack", env=test_env)

    vpc1 = ec2.Vpc(
        vpc_stack, "MockVPC1",
        cidr="10.0.0.0/16",
        max_azs=2,
        subnet_configuration=[
            ec2.SubnetConfiguration(
                name="public",
                subnet_type=ec2.SubnetType.PUBLIC,
                cidr_mask=24
            )
        ]
    )

    vpc2 = ec2.Vpc(
        vpc_stack, "MockVPC2",
        cidr="10.1.0.0/16",
        max_azs=2,
        subnet_configuration=[
            ec2.SubnetConfiguration(
                name="public",
                subnet_type=ec2.SubnetType.PUBLIC,
                cidr_mask=24
            )
        ]
    )

    return vpc1, vpc2


def test_vpc_peering_connection_created(app, test_env, mock_vpcs):
    vpc1, vpc2 = mock_vpcs

    stack = VpcPeeringStack(
        app, "TestVpcPeeringStack",
        vpc1=vpc1, vpc2=vpc2,
        env=test_env
    )

    template = Template.from_stack(stack)
    template.resource_count_is("AWS::EC2::VPCPeeringConnection", 1)
    