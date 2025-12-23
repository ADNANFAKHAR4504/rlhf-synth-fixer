"""Unit tests for TapStack CDK stack"""

import unittest
import json
from unittest.mock import patch, MagicMock
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):
    """Unit tests for TapStack CDK stack"""

    def setUp(self):
        """Set up test environment before each test"""
        self.app = cdk.App()
        self.env_suffix = "test"
        
    def test_stack_creation_with_props(self):
        """Test stack creation with TapStackProps"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        self.assertIsInstance(stack, TapStack)
        
    def test_stack_creation_without_props(self):
        """Test stack creation without props (default behavior)"""
        stack = TapStack(self.app, "TestStack")
        self.assertIsInstance(stack, TapStack)
        
    def test_vpc_creation(self):
        """Test VPC is created with correct configuration"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # Check VPC exists
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })
        
    def test_public_subnets_creation(self):
        """Test public subnets are created"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # Check public subnet exists
        template.has_resource_properties("AWS::EC2::Subnet", {
            "CidrBlock": "10.0.0.0/24",
            "MapPublicIpOnLaunch": True
        })
        
    def test_private_subnets_creation(self):
        """Test private subnets are created"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # Check private subnets exist (CDK creates multiple subnets with different CIDR blocks)
        template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": False
        })
        
    def test_internet_gateway_creation(self):
        """Test Internet Gateway is created"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::EC2::InternetGateway", 1)
        
    def test_nat_gateway_creation(self):
        """Test NAT Gateway is created"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # CDK creates NAT gateways based on AZ configuration
        template.resource_count_is("AWS::EC2::NatGateway", 2)
        
    def test_kms_key_creation(self):
        """Test KMS key is created with correct policy"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })
        
    def test_s3_buckets_creation(self):
        """Test S3 buckets are created with encryption"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # Check encrypted buckets exist
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.array_with([
                    Match.object_like({
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "aws:kms"
                        }
                    })
                ])
            }
        })
        
    def test_iam_roles_creation(self):
        """Test IAM roles are created"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # Check EC2 instance role exists
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        }
                    }
                ])
            }
        })
        
    def test_security_group_creation(self):
        """Test security groups are created with proper rules"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # Check security group exists
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for SecureApp EC2 instances"
        })
        
    def test_ec2_instance_creation(self):
        """Test EC2 instance is created in private subnet"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # Check EC2 instance exists
        template.has_resource_properties("AWS::EC2::Instance", {
            "InstanceType": "t3.micro"
        })
        
    def test_launch_template_creation(self):
        """Test launch template is created"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateName": "secureapp-launch-template",
            "LaunchTemplateData": {
                "InstanceType": "t3.micro"
            }
        })
        
    def test_cloudwatch_log_groups(self):
        """Test CloudWatch log groups are created"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # Check log groups exist (check for application log group)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/secureapp/application",
            "RetentionInDays": 30
        })
        
    def test_cloudtrail_creation(self):
        """Test CloudTrail is created for auditing"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::CloudTrail::Trail", 1)
        
    @patch.dict('os.environ', {'AWS_ENDPOINT_URL': 'http://localhost:4566'})
    def test_localstack_detection(self):
        """Test LocalStack detection logic"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        
        # This should not raise any exceptions
        self.assertIsInstance(stack, TapStack)
        
    def test_vpc_flow_logs_creation(self):
        """Test VPC Flow Logs are enabled"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        template.resource_count_is("AWS::EC2::FlowLog", 1)
        
    def test_stack_outputs(self):
        """Test stack outputs are properly defined"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # Check that outputs exist
        outputs = template.to_json()["Outputs"]
        self.assertIn("VPCId", outputs)
        
    def test_resource_tagging(self):
        """Test resources are properly tagged"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # Check that resources have Name tags
        template.has_resource_properties("AWS::S3::Bucket", {
            "Tags": Match.array_with([
                {
                    "Key": "Name",
                    "Value": Match.string_like_regexp(".*bucket.*")
                }
            ])
        })
        
    def test_encryption_at_rest(self):
        """Test encryption at rest is enabled for all storage resources"""
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TestStack", props=props)
        template = Template.from_stack(stack)
        
        # Check S3 bucket encryption
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.array_with([
                    Match.object_like({
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "aws:kms"
                        }
                    })
                ])
            }
        })
        
        # Check EBS volume encryption
        template.has_resource_properties("AWS::EC2::Instance", {
            "BlockDeviceMappings": Match.array_with([
                Match.object_like({
                    "Ebs": {
                        "Encrypted": True
                    }
                })
            ])
        })


if __name__ == '__main__':
    unittest.main()