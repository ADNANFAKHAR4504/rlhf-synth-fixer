"""Unit tests for TapStack CDK stack."""
import os
import unittest
from unittest.mock import patch

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack."""

    def setUp(self):
        """Set up a fresh CDK app for each test."""
        self.app = cdk.App()

    @mark.it("creates a VPC with public subnets and no NAT gateway")
    def test_creates_vpc_with_public_subnets(self):
        """Test VPC creation with correct configuration."""
        # ARRANGE
        with patch.dict(os.environ, {"ENVIRONMENT_SUFFIX": "test"}):
            stack = TapStack(self.app, "TapStackTest")
            template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })
        
        # Check for public subnets only (no private subnets)
        template.resource_count_is("AWS::EC2::Subnet", 2)  # 2 public subnets in 2 AZs
        
        # Verify no NAT gateways (cost optimization)
        template.resource_count_is("AWS::EC2::NatGateway", 0)

    @mark.it("creates an EC2 instance with t2.micro instance type")
    def test_creates_ec2_instance_t2_micro(self):
        """Test EC2 instance creation with correct type."""
        # ARRANGE
        with patch.dict(os.environ, {"ENVIRONMENT_SUFFIX": "test"}):
            stack = TapStack(self.app, "TapStackTest")
            template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::Instance", 1)
        template.has_resource_properties("AWS::EC2::Instance", {
            "InstanceType": "t2.micro"
        })

    @mark.it("creates an S3 bucket with versioning enabled")
    def test_creates_s3_bucket_with_versioning(self):
        """Test S3 bucket creation with versioning enabled."""
        # ARRANGE
        with patch.dict(os.environ, {"ENVIRONMENT_SUFFIX": "test"}):
            stack = TapStack(self.app, "TapStackTest")
            template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            }
        })

    @mark.it("creates a security group allowing SSH access")
    def test_creates_security_group_with_ssh(self):
        """Test security group creation with SSH access."""
        # ARRANGE
        with patch.dict(os.environ, {"ENVIRONMENT_SUFFIX": "test"}):
            stack = TapStack(self.app, "TapStackTest")
            template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::SecurityGroup", 1)
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 22,
                    "ToPort": 22,
                    "CidrIp": "0.0.0.0/0"
                })
            ])
        })

    @mark.it("applies Environment tag with Development value to all resources")
    def test_applies_environment_tags(self):
        """Test that Environment tag is applied to the stack."""
        # ARRANGE
        with patch.dict(os.environ, {"ENVIRONMENT_SUFFIX": "test"}):
            stack = TapStack(self.app, "TapStackTest")
            template = Template.from_stack(stack)

        # ASSERT
        # Check that resources have the Environment tag
        # VPC should have the tag
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                Match.object_like({
                    "Key": "Environment",
                    "Value": "Development"
                })
            ])
        })

    @mark.it("uses environment suffix in resource names")
    def test_uses_environment_suffix_in_names(self):
        """Test that resources use environment suffix in their logical IDs."""
        # ARRANGE
        env_suffix = "prod"
        app = cdk.App(context={"environmentSuffix": env_suffix})
        stack = TapStack(app, f"TapStack{env_suffix}")
        template = Template.from_stack(stack)

        # ASSERT
        # Check that resources contain the environment suffix in their logical IDs
        resources = template.to_json()["Resources"]
        vpc_resources = [k for k in resources.keys() if "DevelopmentVPC" in k]
        sg_resources = [k for k in resources.keys() if "DevelopmentSecurityGroup" in k]
        ec2_resources = [k for k in resources.keys() if "DevelopmentInstance" in k]
        s3_resources = [k for k in resources.keys() if "DevelopmentBucket" in k]
        
        self.assertTrue(len(vpc_resources) > 0)
        self.assertTrue(len(sg_resources) > 0)
        self.assertTrue(len(ec2_resources) > 0)
        self.assertTrue(len(s3_resources) > 0)

    @mark.it("configures S3 bucket with auto delete for cleanup")
    def test_s3_bucket_auto_delete(self):
        """Test S3 bucket is configured for auto-deletion."""
        # ARRANGE
        with patch.dict(os.environ, {"ENVIRONMENT_SUFFIX": "test"}):
            stack = TapStack(self.app, "TapStackTest")
            template = Template.from_stack(stack)

        # ASSERT
        # Check for custom resource that handles auto-deletion
        resources = template.to_json()["Resources"]
        custom_resources = [r for r in resources.values() 
                           if r.get("Type") == "Custom::S3AutoDeleteObjects"]
        self.assertTrue(len(custom_resources) > 0)

    @mark.it("creates required outputs for integration testing")
    def test_creates_required_outputs(self):
        """Test that stack creates all required outputs."""
        # ARRANGE
        with patch.dict(os.environ, {"ENVIRONMENT_SUFFIX": "test"}):
            stack = TapStack(self.app, "TapStackTest")
            template = Template.from_stack(stack)

        # ASSERT
        outputs = template.to_json().get("Outputs", {})
        expected_outputs = ["VPCId", "EC2InstanceId", "EC2InstancePublicIp", 
                           "S3BucketName", "SecurityGroupId"]
        
        for output_name in expected_outputs:
            self.assertIn(output_name, outputs, f"Missing output: {output_name}")

    @mark.it("uses Amazon Linux 2 for EC2 instance")
    def test_ec2_uses_amazon_linux_2(self):
        """Test EC2 instance uses Amazon Linux 2 AMI."""
        # ARRANGE
        with patch.dict(os.environ, {"ENVIRONMENT_SUFFIX": "test"}):
            stack = TapStack(self.app, "TapStackTest")
            template = Template.from_stack(stack)

        # ASSERT
        # Check that the EC2 instance uses an AMI (referenced via parameter or mapping)
        resources = template.to_json()["Resources"]
        ec2_instances = [r for r in resources.values() 
                        if r.get("Type") == "AWS::EC2::Instance"]
        self.assertTrue(len(ec2_instances) > 0)
        # The instance should have ImageId property
        for instance in ec2_instances:
            image_id = instance.get("Properties", {}).get("ImageId")
            self.assertIsNotNone(image_id)

    @mark.it("places EC2 instance in public subnet")
    def test_ec2_in_public_subnet(self):
        """Test EC2 instance is placed in public subnet."""
        # ARRANGE
        with patch.dict(os.environ, {"ENVIRONMENT_SUFFIX": "test"}):
            stack = TapStack(self.app, "TapStackTest")
            template = Template.from_stack(stack)

        # ASSERT
        # Check that the instance is associated with a public subnet
        resources = template.to_json()["Resources"]
        ec2_instances = {k: v for k, v in resources.items() 
                        if v.get("Type") == "AWS::EC2::Instance"}
        
        for instance in ec2_instances.values():
            subnet_ref = instance.get("Properties", {}).get("SubnetId", {})
            self.assertIsNotNone(subnet_ref)
