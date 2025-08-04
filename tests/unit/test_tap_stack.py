"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using Pulumi's testing utilities.
"""

import asyncio

import pulumi
import pulumi.runtime
import pytest

from lib.tap_stack import \
    TapStack  # ✅ Adjust based on your actual file structure


# Pulumi Mocks to simulate resource creation without deploying to AWS
class TestMocks(pulumi.runtime.Mocks):
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        return [f"{args.name}_id", args.inputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        return {}

@pytest.fixture(scope="module", autouse=True)
def pulumi_mocks():
    pulumi.runtime.set_mocks(TestMocks())

@pytest.mark.asyncio
async def test_vpc_and_subnets_exported():
    """Test that VPC and subnet outputs are correctly exported from TapStack."""
    # Import module-level outputs if TapStack is not class-based
    import lib.tap_stack as stack

    vpc_id = await pulumi.Output.from_input(stack.vpcId).future()
    public_subnet_ids = await pulumi.Output.from_input(stack.publicSubnetIds).future()
    private_subnet_ids = await pulumi.Output.from_input(stack.privateSubnetIds).future()

    assert isinstance(vpc_id, str)
    assert len(public_subnet_ids) == 2
    assert len(private_subnet_ids) == 2

@pytest.mark.asyncio
async def test_lambda_and_bucket_exports():
    """Test that Lambda function and S3 bucket are created and exported."""
    import lib.tap_stack as stack

    lambda_name = await pulumi.Output.from_input(stack.lambdaName).future()
    bucket_name = await pulumi.Output.from_input(stack.bucketName).future()

    assert isinstance(lambda_name, str)
    assert isinstance(bucket_name, str)
    assert lambda_name != ""
    assert bucket_name != ""
