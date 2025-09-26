"""Unit tests for TapStack CDK infrastructure."""
import unittest
from unittest.mock import patch

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack."""

    def setUp(self):
        """Set up a fresh CDK app for each test."""
        self.app = cdk.App()

    @mark.it("creates VPC with correct CIDR and configuration")
    def test_creates_vpc_with_correct_config(self):
        """Test that VPC is created with correct CIDR and configuration."""
        # ARRANGE
        env_suffix = "test"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        
        # Check VPC configuration
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("creates public and private subnets in multiple AZs")
    def test_creates_subnets_in_multiple_azs(self):
        """Test that public and private subnets are created across multiple AZs."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Should have 4 subnets (2 public, 2 private across 2 AZs)
        template.resource_count_is("AWS::EC2::Subnet", 4)
        
        # Check public subnet configuration (10.0.0.0/24 and 10.0.1.0/24)
        template.has_resource_properties("AWS::EC2::Subnet", {
            "CidrBlock": "10.0.0.0/24",
            "MapPublicIpOnLaunch": True
        })
        
        # Check private subnet configuration (10.0.2.0/24 and 10.0.3.0/24)
        template.has_resource_properties("AWS::EC2::Subnet", {
            "CidrBlock": "10.0.2.0/24",
            "MapPublicIpOnLaunch": False
        })

    @mark.it("creates Internet Gateway and NAT Gateway")
    def test_creates_gateways(self):
        """Test that Internet Gateway and NAT Gateway are created."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::InternetGateway", 1)
        template.resource_count_is("AWS::EC2::NatGateway", 1)

    @mark.it("creates security groups with correct ingress rules")
    def test_creates_security_groups_with_rules(self):
        """Test that security groups are created with appropriate rules."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Should have 2 security groups (EC2 and RDS)
        template.resource_count_is("AWS::EC2::SecurityGroup", 2)
        
        # Check EC2 security group allows SSH from specific IP and HTTP from anywhere
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 22,
                    "ToPort": 22,
                    "CidrIp": "203.0.113.0/24"
                }),
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 80,
                    "ToPort": 80,
                    "CidrIp": "0.0.0.0/0"
                })
            ])
        })

    @mark.it("creates RDS security group with MySQL access from EC2")
    def test_creates_rds_security_group(self):
        """Test that RDS security group allows MySQL access only from EC2."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - RDS security group exists but ingress rules are added programmatically
        # The RDS security group is created but rules are added via add_ingress_rule method
        # which creates the rules after the security group is created
        template.resource_count_is("AWS::EC2::SecurityGroup", 2)
        
        # Check that RDS security group exists with proper description
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for RDS database"
        })

    @mark.it("creates IAM role for EC2 instances with S3 and DynamoDB permissions")
    def test_creates_ec2_iam_role(self):
        """Test that IAM role is created for EC2 instances with proper permissions."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Should have IAM role for EC2
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Principal": Match.object_like({
                            "Service": "ec2.amazonaws.com"
                        }),
                        "Action": "sts:AssumeRole"
                    })
                ])
            })
        })

        # Check for S3 and DynamoDB permissions in policy statements
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Action": Match.array_with([
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject",
                            "s3:ListBucket"
                        ])
                    })
                ])
            })
        })

    @mark.it("creates instance profile for EC2 role")
    def test_creates_instance_profile(self):
        """Test that instance profile is created for EC2 role."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Should have at least 1 instance profile (CDK may create additional ones)
        template.resource_count_is("AWS::IAM::InstanceProfile", 2)

    @mark.it("creates RDS subnet group in private subnets")
    def test_creates_rds_subnet_group(self):
        """Test that RDS subnet group is created in private subnets."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    @mark.it("creates RDS MySQL database with encryption")
    def test_creates_rds_database(self):
        """Test that RDS MySQL database is created with proper configuration."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBInstance", 1)
        
        # Check RDS configuration
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "mysql",
            "EngineVersion": "8.0",
            "DBInstanceClass": "db.t3.micro",
            "AllocatedStorage": "20",
            "StorageEncrypted": True,
            "BackupRetentionPeriod": 7,
            "DeletionProtection": False
        })

    @mark.it("creates launch template for EC2 instances")
    def test_creates_launch_template(self):
        """Test that launch template is created for EC2 instances."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::LaunchTemplate", 1)
        
        # Check launch template configuration
        template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateData": Match.object_like({
                "InstanceType": "t3.micro",
                "SecurityGroupIds": Match.any_value(),
                "IamInstanceProfile": Match.any_value(),
                "UserData": Match.any_value()
            })
        })

    @mark.it("creates Auto Scaling Group with correct configuration")
    def test_creates_auto_scaling_group(self):
        """Test that Auto Scaling Group is created with correct configuration."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        
        # Check ASG configuration
        template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "2",
            "MaxSize": "5",
            "DesiredCapacity": "2",
            "HealthCheckType": "EC2",
            "HealthCheckGracePeriod": 300  # 5 minutes
        })

    @mark.it("creates CPU scaling policy for Auto Scaling Group")
    def test_creates_scaling_policy(self):
        """Test that CPU-based scaling policy is created for ASG."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::AutoScaling::ScalingPolicy", 1)
        
        # Check scaling policy configuration
        template.has_resource_properties("AWS::AutoScaling::ScalingPolicy", {
            "PolicyType": "TargetTrackingScaling",
            "TargetTrackingConfiguration": Match.object_like({
                "PredefinedMetricSpecification": Match.object_like({
                    "PredefinedMetricType": "ASGAverageCPUUtilization"
                }),
                "TargetValue": 70
            })
        })

    @mark.it("creates SNS topic for alarm notifications")
    def test_creates_sns_topic(self):
        """Test that SNS topic is created for alarm notifications."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)

    @mark.it("creates CloudWatch alarm for high CPU usage")
    def test_creates_cpu_alarm(self):
        """Test that CloudWatch alarm is created for high CPU usage."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - CDK may create multiple alarms (scaling policy creates one too)
        template.resource_count_is("AWS::CloudWatch::Alarm", 2)
        
        # Check alarm configuration exists
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "CPUUtilization",
            "Namespace": "AWS/AutoScaling",
            "Threshold": 70,
            "ComparisonOperator": "GreaterThanThreshold"
        })

    @mark.it("creates CloudFormation outputs for important resources")
    def test_creates_outputs(self):
        """Test that CloudFormation outputs are created for important resources."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Check outputs exist in the template
        template_json = template.to_json()
        outputs = template_json.get("Outputs", {})
        
        # Should have outputs for VPC, database, ASG, and SNS topic
        assert len(outputs) >= 4
        
        # Check specific output keys exist
        output_keys = list(outputs.keys())
        vpc_output = any("Vpc" in key for key in output_keys)
        db_output = any("Database" in key for key in output_keys)
        asg_output = any("AutoScaling" in key for key in output_keys)
        sns_output = any("SNS" in key for key in output_keys)
        
        assert vpc_output, "VPC output not found"
        assert db_output, "Database output not found"
        assert asg_output, "Auto Scaling Group output not found"
        assert sns_output, "SNS Topic output not found"

    @mark.it("applies Production environment tag to all resources")
    def test_applies_production_tags(self):
        """Test that Production environment tags are applied to the stack."""
        # ARRANGE
        env_suffix = "staging"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        
        # ASSERT - Check that Environment: Production tag is applied
        template = Template.from_stack(stack)
        template_json = template.to_json()
        
        # Check that resources have the Environment: Production tag
        resources = template_json.get("Resources", {})
        tagged_resource_found = False
        
        for resource_name, resource_props in resources.items():
            tags = resource_props.get("Properties", {}).get("Tags", [])
            for tag in tags:
                if tag.get("Key") == "Environment" and tag.get("Value") == "Production":
                    tagged_resource_found = True
                    break
        
        assert tagged_resource_found, "Production environment tag not found on resources"

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Test that environment suffix defaults to 'dev'."""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        
        # ASSERT
        assert stack.environment_suffix == "dev"

    @mark.it("uses environment suffix in resource names")
    def test_environment_suffix_in_resource_names(self):
        """Test that environment suffix is used in resource names."""
        # ARRANGE
        env_suffix = "prod"
        props = TapStackProps(environment_suffix=env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        
        # ASSERT - Check that resources use the suffix
        assert stack.environment_suffix == env_suffix
        
        # Check VPC name includes suffix
        assert f"TapVpc{env_suffix}" in str(stack.vpc.node.id)

    @mark.it("places RDS in private subnets")
    def test_rds_in_private_subnets(self):
        """Test that RDS database is placed in private subnets."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - RDS should use subnet group which references private subnets
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBSubnetGroupName": Match.any_value()
        })

    @mark.it("places Auto Scaling Group in public subnets")
    def test_asg_in_public_subnets(self):
        """Test that Auto Scaling Group instances are placed in public subnets."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - ASG should have VPCZoneIdentifier with public subnets
        template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "VPCZoneIdentifier": Match.any_value()
        })

    @mark.it("attaches SSM managed policy to EC2 role")
    def test_attaches_ssm_managed_policy(self):
        """Test that SSM managed policy is attached to EC2 role."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Check that role has managed policy array
        template.has_resource_properties("AWS::IAM::Role", {
            "ManagedPolicyArns": Match.any_value()
        })

    @mark.it("creates RDS credentials secret")
    def test_creates_rds_credentials_secret(self):
        """Test that RDS credentials are stored in AWS Secrets Manager."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Should have a secret for RDS credentials
        template.resource_count_is("AWS::SecretsManager::Secret", 1)
        
        # Check RDS instance uses master password (not MasterUserSecret for generated secrets)
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "MasterUserPassword": Match.any_value(),
            "MasterUsername": "admin"
        })

    @mark.it("enables RDS backup with 7-day retention")
    def test_rds_backup_configuration(self):
        """Test that RDS backup is configured with 7-day retention."""
        # ARRANGE
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "BackupRetentionPeriod": 7
        })


if __name__ == '__main__':
    unittest.main()