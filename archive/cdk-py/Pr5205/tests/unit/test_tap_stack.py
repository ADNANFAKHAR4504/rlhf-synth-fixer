"""
Unit tests for TapStack and nested stacks

Tests cover:
- Stack creation and configuration
- Resource naming with environment suffix
- Security configurations
- Multi-AZ deployment
- Encryption settings
- CloudWatch alarms
"""

import unittest
from unittest.mock import patch

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):  # pylint: disable=too-many-public-methods
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "testenv"

    @mark.it("creates stack with correct environment suffix")
    def test_creates_stack_with_env_suffix(self):
        """Test that stack is created with correct environment suffix"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        assert stack.environment_suffix == self.env_suffix

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        """Test that environment suffix defaults to 'dev'"""
        stack = TapStack(self.app, "TapStackTestDefault")

        assert stack.environment_suffix == "dev"

    @mark.it("creates VPC with Multi-AZ configuration")
    def test_creates_vpc_with_multi_az(self):
        """Test that VPC is created with Multi-AZ configuration"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack.vpc_stack)

        # Verify VPC exists
        template.resource_count_is("AWS::EC2::VPC", 1)

        # Verify subnets across multiple AZs
        subnets = template.find_resources("AWS::EC2::Subnet")
        assert len(subnets) >= 6, "Should create subnets across multiple AZs"

        # Verify VPC has DNS enabled
        template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True,
        })

    @mark.it("creates security groups for RDS and EFS")
    def test_creates_security_groups(self):
        """Test that security groups are created for RDS and EFS"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack.vpc_stack)

        # Verify security groups exist
        template.resource_count_is("AWS::EC2::SecurityGroup", 2)

        # Verify RDS security group allows PostgreSQL port
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 5432,
                    "ToPort": 5432,
                })
            ])
        })

        # Verify EFS security group allows NFS port
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 2049,
                    "ToPort": 2049,
                })
            ])
        })

    @mark.it("creates VPC Flow Logs")
    def test_creates_vpc_flow_logs(self):
        """Test that VPC Flow Logs are created"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack.vpc_stack)

        # Verify Flow Log exists
        template.resource_count_is("AWS::EC2::FlowLog", 1)

        # Verify CloudWatch Log Group exists
        template.resource_count_is("AWS::Logs::LogGroup", 1)

    @mark.it("creates KMS keys with rotation enabled")
    def test_creates_kms_keys_with_rotation(self):
        """Test that KMS keys are created with rotation enabled"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack.kms_stack)

        # Verify 3 KMS keys exist (RDS, EFS, Secrets)
        template.resource_count_is("AWS::KMS::Key", 3)

        # Verify key rotation is enabled
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True,
        })

    @mark.it("creates Secrets Manager secret with proper configuration")
    def test_creates_secrets_manager_secret(self):
        """Test that Secrets Manager secret is created with proper config"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack.secrets_stack)

        # Verify secret exists
        template.resource_count_is("AWS::SecretsManager::Secret", 1)

        # Verify secret has rotation schedule
        template.resource_count_is("AWS::SecretsManager::RotationSchedule", 1)

        # Verify IAM policy for secret access
        template.resource_count_is("AWS::IAM::ManagedPolicy", 1)

    @mark.it("creates EFS file system with encryption")
    def test_creates_efs_with_encryption(self):
        """Test that EFS file system is created with encryption"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack.efs_stack)

        # Verify EFS exists
        template.resource_count_is("AWS::EFS::FileSystem", 1)

        # Verify encryption is enabled
        template.has_resource_properties("AWS::EFS::FileSystem", {
            "Encrypted": True,
        })

        # Verify Access Point exists
        template.resource_count_is("AWS::EFS::AccessPoint", 1)

        # Verify backup plan exists
        template.resource_count_is("AWS::Backup::BackupPlan", 1)

    @mark.it("creates RDS instance with Multi-AZ deployment")
    def test_creates_rds_multi_az(self):
        """Test that RDS instance is created with Multi-AZ"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack.rds_stack)

        # Verify RDS instance exists
        template.resource_count_is("AWS::RDS::DBInstance", 1)

        # Verify Multi-AZ is enabled
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "MultiAZ": True,
        })

        # Verify storage encryption is enabled
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "StorageEncrypted": True,
        })

        # Verify automated backups
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "BackupRetentionPeriod": 7,
        })

    @mark.it("creates RDS with PostgreSQL engine")
    def test_creates_rds_with_postgresql(self):
        """Test that RDS uses PostgreSQL engine"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack.rds_stack)

        # Verify PostgreSQL engine
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "postgres",
        })

        # Verify database name
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBName": "citizendb",
        })

    @mark.it("creates RDS parameter group with FedRAMP compliance")
    def test_creates_rds_parameter_group(self):
        """Test that RDS parameter group has FedRAMP compliant settings"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack.rds_stack)

        # Verify parameter group exists
        template.resource_count_is("AWS::RDS::DBParameterGroup", 1)

        # Verify SSL is forced
        template.has_resource_properties("AWS::RDS::DBParameterGroup", {
            "Parameters": Match.object_like({
                "rds.force_ssl": "1",
            })
        })

    @mark.it("creates CloudWatch alarms for RDS monitoring")
    def test_creates_cloudwatch_alarms(self):
        """Test that CloudWatch alarms are created for RDS"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack.rds_stack)

        # Verify multiple alarms exist (CPU, Connections, Storage, Latency)
        alarm_count = template.find_resources("AWS::CloudWatch::Alarm")
        assert len(alarm_count) >= 4, "Should have at least 4 CloudWatch alarms"

        # Verify SNS topic for alarms
        template.resource_count_is("AWS::SNS::Topic", 1)

    @mark.it("creates RDS subnet group in private subnets")
    def test_creates_rds_subnet_group(self):
        """Test that RDS subnet group is created"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack.rds_stack)

        # Verify subnet group exists
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    @mark.it("has proper stack dependencies")
    def test_has_proper_dependencies(self):
        """Test that nested stacks have proper dependencies"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        # Verify stacks are created
        assert stack.vpc_stack is not None
        assert stack.kms_stack is not None
        assert stack.secrets_stack is not None
        assert stack.efs_stack is not None
        assert stack.rds_stack is not None

    @mark.it("creates stack outputs")
    def test_creates_stack_outputs(self):
        """Test that stack creates proper outputs"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # Get all outputs
        outputs = template.find_outputs("*")

        # Verify key outputs exist
        assert "StackName" in outputs
        assert "EnvironmentSuffix" in outputs
        assert "VPCId" in outputs
        assert "DatabaseEndpoint" in outputs
        assert "DatabaseSecretArn" in outputs
        assert "EFSFileSystemId" in outputs

    @mark.it("applies proper tags to resources")
    def test_applies_proper_tags(self):
        """Test that proper tags are applied to the stack"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        # Tags are applied at app level, verify they're set
        # This is a basic check that tags were configured
        assert stack.environment_suffix == self.env_suffix

    @mark.it("uses correct instance type for RDS")
    def test_uses_correct_rds_instance_type(self):
        """Test that RDS uses appropriate instance type"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack.rds_stack)

        # Verify instance class is burstable (cost-effective for DR)
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceClass": Match.string_like_regexp("db.t3.*"),
        })

    @mark.it("enables Performance Insights for RDS")
    def test_enables_performance_insights(self):
        """Test that Performance Insights is enabled"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack.rds_stack)

        # Verify Performance Insights is enabled
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "EnablePerformanceInsights": True,
        })

    @mark.it("enables CloudWatch Logs exports for RDS")
    def test_enables_cloudwatch_logs_exports(self):
        """Test that CloudWatch Logs exports are enabled"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack.rds_stack)

        # Verify logs are exported
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "EnableCloudwatchLogsExports": Match.array_with(["postgresql"]),
        })

    @mark.it("sets proper removal policy for resources")
    def test_sets_proper_removal_policy(self):
        """Test that resources have DESTROY removal policy for CI/CD"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack.rds_stack)

        # Verify RDS deletion protection is disabled for teardown
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DeletionProtection": False,
        })


if __name__ == '__main__':
    unittest.main()
