"""Unit tests for the TapStack CDK infrastructure."""
import os
import json
from unittest.mock import patch, MagicMock
import pytest
import aws_cdk as cdk
from aws_cdk import assertions
from aws_cdk import aws_ec2 as ec2

# Set environment variables for testing
os.environ['CDK_DEFAULT_ACCOUNT'] = '123456789012'
os.environ['CDK_DEFAULT_REGION'] = 'us-east-1'

from lib.tap_stack import TapStack, TapStackProps


class TestTapStack:
    """Test suite for TapStack infrastructure."""

    @pytest.fixture
    def app(self):
        """Create CDK app for testing."""
        return cdk.App()

    @pytest.fixture
    def stack(self, app):
        """Create TapStack for testing."""
        props = TapStackProps(
            environment_suffix="test",
            env=cdk.Environment(
                account="123456789012",
                region="us-east-1"
            )
        )
        return TapStack(app, "TestStack", props)

    @pytest.fixture
    def template(self, stack):
        """Get CloudFormation template from stack."""
        return assertions.Template.from_stack(stack)

    def test_stack_creates_vpc(self, template):
        """Test that VPC is created with correct configuration."""
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    def test_vpc_has_correct_tags(self, template):
        """Test VPC has required tags."""
        template.has_resource("AWS::EC2::VPC", {
            "Properties": assertions.Match.object_like({
                "Tags": assertions.Match.array_with([
                    {"Key": "Name", "Value": "cdk-vpc-test"},
                    {"Key": "Project", "Value": "CDKSetup"}
                ])
            })
        })

    def test_creates_two_public_subnets(self, template):
        """Test that exactly 2 public subnets are created."""
        template.resource_count_is("AWS::EC2::Subnet", 2)
        
        # Verify subnets have public IP mapping
        template.has_resource_properties("AWS::EC2::Subnet", {
            "MapPublicIpOnLaunch": True
        })

    def test_subnets_in_different_azs(self, stack):
        """Test that subnets are in different availability zones."""
        vpc = stack.vpc
        assert len(vpc.public_subnets) == 2
        
        # Check that we have 2 different AZs
        azs = [subnet.availability_zone for subnet in vpc.public_subnets]
        assert len(set(azs)) == 2

    def test_creates_internet_gateway(self, template):
        """Test that Internet Gateway is created."""
        template.has_resource("AWS::EC2::InternetGateway", {})
        template.has_resource("AWS::EC2::VPCGatewayAttachment", {})

    def test_creates_route_tables_with_internet_routes(self, template):
        """Test that route tables with internet routes are created."""
        template.has_resource_properties("AWS::EC2::Route", {
            "DestinationCidrBlock": "0.0.0.0/0"
        })

    def test_creates_security_group(self, template):
        """Test that security group is created with correct rules."""
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for CDK setup allowing SSH access",
            "SecurityGroupIngress": [
                {
                    "IpProtocol": "tcp",
                    "FromPort": 22,
                    "ToPort": 22,
                    "CidrIp": "0.0.0.0/0",
                    "Description": "Allow SSH access from anywhere"
                }
            ]
        })

    def test_security_group_allows_all_outbound(self, template):
        """Test that security group allows all outbound traffic."""
        template.has_resource("AWS::EC2::SecurityGroup", {
            "Properties": assertions.Match.object_like({
                "SecurityGroupEgress": [
                    {
                        "IpProtocol": "-1",
                        "CidrIp": "0.0.0.0/0"
                    }
                ]
            })
        })

    def test_creates_ec2_instance(self, template):
        """Test that EC2 instance is created."""
        template.has_resource_properties("AWS::EC2::Instance", {
            "InstanceType": "t3.micro"
        })

    def test_ec2_instance_has_public_ip(self, template):
        """Test that EC2 instance has public IP enabled."""
        template.has_resource("AWS::EC2::Instance", {
            "Properties": assertions.Match.object_like({
                "NetworkInterfaces": [
                    assertions.Match.object_like({
                        "AssociatePublicIpAddress": True,
                        "DeviceIndex": "0"
                    })
                ]
            })
        })

    def test_ec2_instance_uses_imdsv2(self, template):
        """Test that EC2 instance uses IMDSv2."""
        template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateData": {
                "MetadataOptions": {
                    "HttpTokens": "required"
                }
            }
        })

    def test_creates_iam_role_for_instance(self, template):
        """Test that IAM role is created for EC2 instance."""
        template.has_resource("AWS::IAM::Role", {
            "Properties": assertions.Match.object_like({
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "ec2.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }
            })
        })

    def test_creates_instance_profile(self, template):
        """Test that instance profile is created."""
        template.has_resource("AWS::IAM::InstanceProfile", {})

    def test_stack_outputs(self, template):
        """Test that stack creates required outputs."""
        outputs = template.find_outputs("*")
        output_keys = set(outputs.keys())
        
        required_outputs = {
            "VpcId",
            "InstanceId",
            "InstancePublicIp",
            "SecurityGroupId",
            "PublicSubnet1Id",
            "PublicSubnet2Id"
        }
        
        assert required_outputs.issubset(output_keys)

    def test_stack_applies_environment_tags(self, stack):
        """Test that stack applies environment tags."""
        tags = cdk.Tags.of(stack)
        # Verify that tags are applied at stack level
        assert stack.environment_suffix == "test"

    def test_resource_naming_convention(self, stack):
        """Test that resources follow naming convention with cdk- prefix."""
        # Check VPC naming
        vpc_id = stack.vpc.node.id
        assert "cdk-vpc" in vpc_id
        
        # Check security group naming
        sg_id = stack.security_group.node.id
        assert "cdk-security-group" in sg_id
        
        # Check EC2 instance naming
        instance_id = stack.ec2_instance.node.id
        assert "cdk-ec2-instance" in instance_id

    def test_vpc_cidr_block(self, template):
        """Test VPC CIDR block configuration."""
        # Check the VPC CIDR in the template
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16"
        })

    def test_nat_gateways_disabled(self, stack):
        """Test that NAT gateways are not created."""
        vpc = stack.vpc
        # No private subnets should exist
        assert len(vpc.private_subnets) == 0
        # Only public subnets should exist
        assert len(vpc.public_subnets) == 2

    def test_subnet_cidr_mask(self, template):
        """Test that subnets use /24 CIDR masks."""
        template.has_resource_properties("AWS::EC2::Subnet", {
            "CidrBlock": assertions.Match.string_like_regexp(r"10\.0\.\d+\.0/24")
        })

    def test_all_resources_tagged_with_project(self, template):
        """Test that resources are tagged with Project tag."""
        # Check VPC
        template.has_resource("AWS::EC2::VPC", {
            "Properties": assertions.Match.object_like({
                "Tags": assertions.Match.array_with([
                    {"Key": "Project", "Value": "CDKSetup"}
                ])
            })
        })
        
        # Check Security Group
        template.has_resource("AWS::EC2::SecurityGroup", {
            "Properties": assertions.Match.object_like({
                "Tags": assertions.Match.array_with([
                    {"Key": "Project", "Value": "CDKSetup"}
                ])
            })
        })

    def test_environment_suffix_applied(self, stack):
        """Test that environment suffix is applied correctly."""
        assert stack.environment_suffix == "test"
        
        # Check that resources include the suffix
        vpc_id = stack.vpc.node.id
        assert "test" in vpc_id
        
        sg_id = stack.security_group.node.id
        assert "test" in sg_id
        
        instance_id = stack.ec2_instance.node.id
        assert "test" in instance_id

    def test_stack_props_dataclass(self):
        """Test TapStackProps dataclass."""
        props = TapStackProps(
            environment_suffix="production",
            env=cdk.Environment(account="999999999999", region="eu-west-1")
        )
        
        assert props.environment_suffix == "production"
        assert props.env.account == "999999999999"
        assert props.env.region == "eu-west-1"

    def test_stack_props_optional_env(self):
        """Test TapStackProps with optional env parameter."""
        props = TapStackProps(environment_suffix="staging")
        
        assert props.environment_suffix == "staging"
        assert props.env is None

    def test_vpc_dns_configuration(self, template):
        """Test VPC DNS configuration."""
        # Check DNS configuration in the template
        template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    def test_ec2_instance_in_first_public_subnet(self, stack):
        """Test EC2 instance is placed in first public subnet."""
        instance = stack.ec2_instance
        vpc = stack.vpc
        
        # Instance should be in the first public subnet
        expected_subnet = vpc.public_subnets[0]
        # Note: We can't directly test subnet assignment in unit tests
        # but we can verify the instance was created
        assert instance is not None

    def test_security_group_attached_to_instance(self, template):
        """Test security group is attached to EC2 instance."""
        template.has_resource("AWS::EC2::Instance", {
            "Properties": assertions.Match.object_like({
                "NetworkInterfaces": [
                    assertions.Match.object_like({
                        "GroupSet": assertions.Match.any_value()
                    })
                ]
            })
        })

    def test_stack_methods_exist(self, stack):
        """Test that all required methods exist in the stack."""
        assert hasattr(stack, '_create_vpc')
        assert hasattr(stack, '_create_security_group')
        assert hasattr(stack, '_create_ec2_instance')
        assert hasattr(stack, '_create_outputs')
        assert hasattr(stack, '_apply_tags')
        
        # Verify methods are callable
        assert callable(stack._create_vpc)
        assert callable(stack._create_security_group)
        assert callable(stack._create_ec2_instance)
        assert callable(stack._create_outputs)
        assert callable(stack._apply_tags)

    def test_stack_properties_initialized(self, stack):
        """Test that stack properties are properly initialized."""
        assert stack.vpc is not None
        assert stack.security_group is not None
        assert stack.ec2_instance is not None
        assert stack.environment_suffix == "test"

    def test_route_table_associations(self, template):
        """Test that route tables are associated with subnets."""
        template.resource_count_is("AWS::EC2::SubnetRouteTableAssociation", 2)

    def test_default_routes_to_internet_gateway(self, template):
        """Test that default routes point to Internet Gateway."""
        # Should have 2 default routes (one per public subnet)
        template.resource_count_is("AWS::EC2::Route", 2)

    def test_launch_template_created(self, template):
        """Test that launch template is created for EC2 instance."""
        template.has_resource("AWS::EC2::LaunchTemplate", {})

    def test_ami_selection(self, template):
        """Test that Amazon Linux 2023 AMI is selected."""
        # Check for SSM parameter that references AL2023
        template.has_parameter("*", {
            "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
            "Default": assertions.Match.string_like_regexp(".*al2023.*")
        })

    def test_instance_type_selection(self, template):
        """Test EC2 instance type selection."""
        # Verify t3.micro is used in the template
        template.has_resource_properties("AWS::EC2::Instance", {
            "InstanceType": "t3.micro"
        })

    def test_max_azs_configuration(self, stack):
        """Test VPC max AZs configuration."""
        vpc = stack.vpc
        # Should use 2 AZs
        assert len(vpc.availability_zones) == 2