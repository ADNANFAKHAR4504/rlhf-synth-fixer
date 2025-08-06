"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""
import pulumi
import pytest
from moto import mock_aws

# Apne code ko import karein
from lib import tap_stack

# Yeh Pulumi ke Mocks hain jo AWS se asli baat-cheet ki nakal karte hain.
# Isse hum bina deploy kiye Pulumi resources ko test kar sakte hain.
class MyMocks(pulumi.runtime.Mocks):
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        # Har naye resource ke liye, hum ek dummy ID aur uske inputs return karte hain
        # Taaki hum check kar sakein ki resource sahi properties ke saath ban raha hai.
        outputs = args.inputs
        outputs['id'] = f"{args.name}_id"
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs['ipv6_cidr_block'] = "2600:1f18:61e0:e800::/56"
        if args.typ == "aws:iam/role:Role":
            outputs['arn'] = f"arn:aws:iam::123456789012:role/{args.name}"
        return [f"{args.name}_id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        # Agar code aws.get_* jaisa koi function call karta hai to hum dummy data return karte hain.
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {"names": ["us-east-1a", "us-east-1b"]}
        if args.token == "aws:ec2/getAmi:getAmi":
            return {"id": "ami-12345678"}
        return {}

# Har test se pehle Pulumi ko mock mode mein daalna zaroori hai.
pulumi.runtime.set_mocks(MyMocks())

# moto decorator ka istemal karein taaki AWS calls mock ho jayein.
# @pulumi.runtime.test decorator test function ko Pulumi ke event loop mein chalata hai.

@pulumi.runtime.test
@mock_aws
def test_vpc_creation_has_correct_cidr():
    """
    Test karta hai ki VPC sahi IPv4 CIDR block ke saath ban raha hai.
    """
    # VPC banane waale function ko call karein
    networking_stack = tap_stack.create_vpc_and_networking()
    vpc = networking_stack['vpc']

    # VPC ke CIDR block ko check karein
    def check_cidr(cidr):
        assert cidr == '10.0.0.0/16'

    # .apply() ka istemal Pulumi Output ki value nikalne ke liye hota hai
    vpc.cidr_block.apply(check_cidr)


@pulumi.runtime.test
@mock_aws
def test_subnet_creation_count():
    """
    Test karta hai ki 2 public subnets ban rahe hain.
    """
    networking_stack = tap_stack.create_vpc_and_networking()
    subnets = networking_stack['public_subnets']
    
    # Check karein ki list mein 2 subnets hain
    assert len(subnets) == 2


@pulumi.runtime.test
@mock_aws
def test_iam_role_has_correct_tags():
    """
    Test karta hai ki IAM role sahi tags ke saath ban raha hai.
    """
    role, _ = tap_stack.create_iam_role()

    def check_tags(tags):
        assert tags['ManagedBy'] == 'Pulumi'
        assert 'Project' in tags

    role.tags.apply(check_tags)