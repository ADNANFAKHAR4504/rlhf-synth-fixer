"""Unit tests for the TAP CDK stack infrastructure."""

import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps
from lib.vpc_stack import VpcStack
from lib.security_stack import SecurityStack
from lib.compute_stack import ComputeStack
from lib.database_stack import DatabaseStack
from lib.storage_stack import StorageStack
from lib.monitoring_stack import MonitoringStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the main TapStack CDK stack."""

    def setUp(self):
        """Set up a fresh CDK app for each test."""
        self.app = cdk.App()

    @mark.it("creates all nested stacks with correct naming")
    def test_creates_all_nested_stacks(self):
        """Test that all nested stacks are created with proper naming."""
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app,
            f"TapStack{env_suffix}",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for nested stacks
        template.resource_count_is("AWS::CloudFormation::Stack", 6)
        
    @mark.it("creates outputs for application URL and database endpoint")
    def test_creates_stack_outputs(self):
        """Test that the stack creates the required outputs."""
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app,
            f"TapStack{env_suffix}",
            TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for outputs
        outputs = template.find_outputs("*")
        self.assertIn("ApplicationUrl", outputs)
        self.assertIn("DatabaseEndpoint", outputs)

    @mark.it("uses provided environment suffix for nested stacks")
    def test_uses_environment_suffix(self):
        """Test that environment suffix is properly used in nested stack names."""
        # ARRANGE
        env_suffix = "prod"
        stack = TapStack(
            self.app,
            f"TapStack{env_suffix}",
            TapStackProps(environment_suffix=env_suffix)
        )
        
        # ASSERT - Check that nested stacks have correct construct IDs
        nested_stacks = stack.node.find_all()
        stack_names = [child.node.id for child in nested_stacks if hasattr(child, 'nested_stack_resource')]
        
        self.assertIn(f"VpcStack{env_suffix}", stack_names)
        self.assertIn(f"SecurityStack{env_suffix}", stack_names)
        self.assertIn(f"StorageStack{env_suffix}", stack_names)
        self.assertIn(f"ComputeStack{env_suffix}", stack_names)
        self.assertIn(f"DatabaseStack{env_suffix}", stack_names)
        self.assertIn(f"MonitoringStack{env_suffix}", stack_names)


@mark.describe("VpcStack")
class TestVpcStack(unittest.TestCase):
    """Test cases for the VPC stack."""

    def setUp(self):
        """Set up a fresh CDK app for each test."""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")

    @mark.it("creates VPC with correct CIDR block")
    def test_creates_vpc_with_correct_cidr(self):
        """Test that VPC is created with the specified CIDR block."""
        # ARRANGE
        vpc_stack = VpcStack(self.stack, "VpcStackTest")
        template = Template.from_stack(vpc_stack)

        # ASSERT
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("creates subnets across two availability zones")
    def test_creates_subnets_in_two_azs(self):
        """Test that subnets are created across two AZs."""
        # ARRANGE
        vpc_stack = VpcStack(self.stack, "VpcStackTest")
        template = Template.from_stack(vpc_stack)

        # ASSERT - Should have 4 subnets (2 public, 2 private)
        template.resource_count_is("AWS::EC2::Subnet", 4)

    @mark.it("creates NAT gateways for high availability")
    def test_creates_nat_gateways(self):
        """Test that NAT gateways are created for HA."""
        # ARRANGE
        vpc_stack = VpcStack(self.stack, "VpcStackTest")
        template = Template.from_stack(vpc_stack)

        # ASSERT - Should have 2 NAT gateways for HA
        template.resource_count_is("AWS::EC2::NatGateway", 2)

    @mark.it("creates VPC flow logs")
    def test_creates_vpc_flow_logs(self):
        """Test that VPC flow logs are configured."""
        # ARRANGE
        vpc_stack = VpcStack(self.stack, "VpcStackTest")
        template = Template.from_stack(vpc_stack)

        # ASSERT
        template.has_resource("AWS::EC2::FlowLog", {
            "Properties": {
                "ResourceType": "VPC",
                "TrafficType": "ALL"
            }
        })


@mark.describe("SecurityStack")
class TestSecurityStack(unittest.TestCase):
    """Test cases for the Security stack."""

    def setUp(self):
        """Set up a fresh CDK app for each test."""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")
        vpc_stack = VpcStack(self.stack, "VpcStackTest")
        self.vpc = vpc_stack.vpc

    @mark.it("creates security groups for ALB, web tier, and database")
    def test_creates_security_groups(self):
        """Test that all required security groups are created."""
        # ARRANGE
        security_stack = SecurityStack(self.stack, "SecurityStackTest", vpc=self.vpc)
        template = Template.from_stack(security_stack)

        # ASSERT - Should have 3 security groups
        template.resource_count_is("AWS::EC2::SecurityGroup", 3)

    @mark.it("creates IAM role for EC2 instances")
    def test_creates_ec2_iam_role(self):
        """Test that IAM role is created for EC2 instances."""
        # ARRANGE
        security_stack = SecurityStack(self.stack, "SecurityStackTest", vpc=self.vpc)
        template = Template.from_stack(security_stack)

        # ASSERT
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        }
                    })
                ])
            }
        })

    @mark.it("creates instance profile for EC2")
    def test_creates_instance_profile(self):
        """Test that instance profile is created."""
        # ARRANGE
        security_stack = SecurityStack(self.stack, "SecurityStackTest", vpc=self.vpc)
        template = Template.from_stack(security_stack)

        # ASSERT
        template.resource_count_is("AWS::IAM::InstanceProfile", 1)


@mark.describe("ComputeStack")
class TestComputeStack(unittest.TestCase):
    """Test cases for the Compute stack."""

    def setUp(self):
        """Set up a fresh CDK app for each test."""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")
        vpc_stack = VpcStack(self.stack, "VpcStackTest")
        self.vpc = vpc_stack.vpc
        security_stack = SecurityStack(self.stack, "SecurityStackTest", vpc=self.vpc)
        self.web_sg = security_stack.web_security_group
        self.alb_sg = security_stack.alb_security_group
        self.instance_profile = security_stack.instance_profile

    @mark.it("creates Application Load Balancer")
    def test_creates_alb(self):
        """Test that ALB is created."""
        # ARRANGE
        compute_stack = ComputeStack(
            self.stack,
            "ComputeStackTest",
            vpc=self.vpc,
            web_security_group=self.web_sg,
            alb_security_group=self.alb_sg,
            instance_profile=self.instance_profile
        )
        template = Template.from_stack(compute_stack)

        # ASSERT
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Type": "application",
            "Scheme": "internet-facing"
        })

    @mark.it("creates Auto Scaling Group with correct capacity")
    def test_creates_asg(self):
        """Test that ASG is created with correct capacity settings."""
        # ARRANGE
        compute_stack = ComputeStack(
            self.stack,
            "ComputeStackTest",
            vpc=self.vpc,
            web_security_group=self.web_sg,
            alb_security_group=self.alb_sg,
            instance_profile=self.instance_profile
        )
        template = Template.from_stack(compute_stack)

        # ASSERT
        template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "2",
            "MaxSize": "10",
            "DesiredCapacity": "2"
        })

    @mark.it("creates launch template with t3.medium instances")
    def test_creates_launch_template(self):
        """Test that launch template is created with correct instance type."""
        # ARRANGE
        compute_stack = ComputeStack(
            self.stack,
            "ComputeStackTest",
            vpc=self.vpc,
            web_security_group=self.web_sg,
            alb_security_group=self.alb_sg,
            instance_profile=self.instance_profile
        )
        template = Template.from_stack(compute_stack)

        # ASSERT
        template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateData": Match.object_like({
                "InstanceType": "t3.medium",
                "Monitoring": {
                    "Enabled": True
                }
            })
        })


@mark.describe("DatabaseStack")
class TestDatabaseStack(unittest.TestCase):
    """Test cases for the Database stack."""

    def setUp(self):
        """Set up a fresh CDK app for each test."""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")
        vpc_stack = VpcStack(self.stack, "VpcStackTest")
        self.vpc = vpc_stack.vpc
        security_stack = SecurityStack(self.stack, "SecurityStackTest", vpc=self.vpc)
        self.db_sg = security_stack.db_security_group

    @mark.it("creates RDS MySQL database instance")
    def test_creates_rds_mysql(self):
        """Test that RDS MySQL instance is created."""
        # ARRANGE
        database_stack = DatabaseStack(
            self.stack,
            "DatabaseStackTest",
            vpc=self.vpc,
            db_security_group=self.db_sg
        )
        template = Template.from_stack(database_stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "mysql",
            "EngineVersion": Match.string_like_regexp("8\\.0\\..*"),
            "MultiAZ": True,
            "StorageEncrypted": True
        })

    @mark.it("creates database with automated backups")
    def test_creates_automated_backups(self):
        """Test that automated backups are configured."""
        # ARRANGE
        database_stack = DatabaseStack(
            self.stack,
            "DatabaseStackTest",
            vpc=self.vpc,
            db_security_group=self.db_sg
        )
        template = Template.from_stack(database_stack)

        # ASSERT
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "BackupRetentionPeriod": 7
        })

    @mark.it("creates secrets for database credentials")
    def test_creates_database_secret(self):
        """Test that Secrets Manager secret is created for database credentials."""
        # ARRANGE
        database_stack = DatabaseStack(
            self.stack,
            "DatabaseStackTest",
            vpc=self.vpc,
            db_security_group=self.db_sg
        )
        template = Template.from_stack(database_stack)

        # ASSERT
        template.has_resource("AWS::SecretsManager::Secret", {
            "Properties": {
                "Description": Match.string_like_regexp(".*[Dd]atabase.*")
            }
        })


@mark.describe("StorageStack")
class TestStorageStack(unittest.TestCase):
    """Test cases for the Storage stack."""

    def setUp(self):
        """Set up a fresh CDK app for each test."""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")

    @mark.it("creates S3 bucket for static assets")
    def test_creates_static_assets_bucket(self):
        """Test that S3 bucket for static assets is created."""
        # ARRANGE
        storage_stack = StorageStack(self.stack, "StorageStackTest")
        template = Template.from_stack(storage_stack)

        # ASSERT - Should have at least 2 buckets (static and analytics)
        buckets = template.find_resources("AWS::S3::Bucket")
        self.assertGreaterEqual(len(buckets), 2)

    @mark.it("enables versioning on buckets")
    def test_enables_bucket_versioning(self):
        """Test that bucket versioning is enabled."""
        # ARRANGE
        storage_stack = StorageStack(self.stack, "StorageStackTest")
        template = Template.from_stack(storage_stack)

        # ASSERT
        template.has_resource("AWS::S3::Bucket", {
            "Properties": Match.object_like({
                "VersioningConfiguration": {
                    "Status": "Enabled"
                }
            })
        })


@mark.describe("MonitoringStack")
class TestMonitoringStack(unittest.TestCase):
    """Test cases for the Monitoring stack."""

    def setUp(self):
        """Set up a fresh CDK app for each test."""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")
        
        # Create all required dependencies
        vpc_stack = VpcStack(self.stack, "VpcStackTest")
        security_stack = SecurityStack(self.stack, "SecurityStackTest", vpc=vpc_stack.vpc)
        compute_stack = ComputeStack(
            self.stack,
            "ComputeStackTest",
            vpc=vpc_stack.vpc,
            web_security_group=security_stack.web_security_group,
            alb_security_group=security_stack.alb_security_group,
            instance_profile=security_stack.instance_profile
        )
        database_stack = DatabaseStack(
            self.stack,
            "DatabaseStackTest",
            vpc=vpc_stack.vpc,
            db_security_group=security_stack.db_security_group
        )
        
        self.asg = compute_stack.asg
        self.database = database_stack.database
        self.alb = compute_stack.alb
        self.target_group = compute_stack.target_group

    @mark.it("creates SNS topic for alarms")
    def test_creates_sns_topic(self):
        """Test that SNS topic is created for alarm notifications."""
        # ARRANGE
        monitoring_stack = MonitoringStack(
            self.stack,
            "MonitoringStackTest",
            asg=self.asg,
            database=self.database,
            alb=self.alb,
            target_group=self.target_group
        )
        template = Template.from_stack(monitoring_stack)

        # ASSERT
        template.resource_count_is("AWS::SNS::Topic", 1)

    @mark.it("creates CloudWatch alarms")
    def test_creates_cloudwatch_alarms(self):
        """Test that CloudWatch alarms are created."""
        # ARRANGE
        monitoring_stack = MonitoringStack(
            self.stack,
            "MonitoringStackTest",
            asg=self.asg,
            database=self.database,
            alb=self.alb,
            target_group=self.target_group
        )
        template = Template.from_stack(monitoring_stack)

        # ASSERT - Should have multiple alarms
        template.resource_count_is("AWS::CloudWatch::Alarm", 5)

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        """Test that CloudWatch dashboard is created."""
        # ARRANGE
        monitoring_stack = MonitoringStack(
            self.stack,
            "MonitoringStackTest",
            asg=self.asg,
            database=self.database,
            alb=self.alb,
            target_group=self.target_group
        )
        template = Template.from_stack(monitoring_stack)

        # ASSERT
        template.has_resource("AWS::CloudWatch::Dashboard", {
            "Properties": {
                "DashboardName": Match.string_like_regexp("prod-webapp-monitoring.*")
            }
        })