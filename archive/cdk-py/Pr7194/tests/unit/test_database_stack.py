"""
Unit tests for DatabaseStack
Tests the single-region database infrastructure.
"""
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("DatabaseStack")
class TestDatabaseStack(unittest.TestCase):
    """Test cases for the DatabaseStack construct"""

    def setUp(self):
        """Set up a fresh CDK app and stack for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = TapStack(
            self.app,
            "TestStack",
            TapStackProps(environment_suffix=self.env_suffix)
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("creates VPC with correct configuration")
    def test_creates_vpc(self):
        """Test that VPC is created with proper CIDR and subnets"""
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16"
        })

    @mark.it("creates security group for database")
    def test_creates_security_group(self):
        """Test that security group is created for database access"""
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 1)
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": Match.string_like_regexp(".*PostgreSQL.*")
        })

    @mark.it("creates RDS database with db.r6g.large instance type")
    def test_creates_rds_instance_correct_type(self):
        """Test that RDS instance uses db.r6g.large as required"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceClass": "db.r6g.large",
            "Engine": "postgres",
            "MultiAZ": True
        })

    @mark.it("enables Multi-AZ for database")
    def test_enables_multi_az(self):
        """Test that database has Multi-AZ enabled"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "MultiAZ": True
        })

    @mark.it("configures 7-day backup retention")
    def test_configures_backup_retention(self):
        """Test that backup retention is set to 7 days"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "BackupRetentionPeriod": 7
        })

    @mark.it("enables storage encryption")
    def test_enables_encryption(self):
        """Test that storage encryption is enabled"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "StorageEncrypted": True
        })

    @mark.it("disables deletion protection for testing")
    def test_disables_deletion_protection(self):
        """Test that deletion protection is disabled"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "DeletionProtection": False
        })

    @mark.it("enables CloudWatch Logs export")
    def test_enables_cloudwatch_logs(self):
        """Test that PostgreSQL logs are exported to CloudWatch"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "EnableCloudwatchLogsExports": ["postgresql"]
        })

    @mark.it("creates Secrets Manager secret for credentials")
    def test_creates_secrets_manager_secret(self):
        """Test that database credentials are stored in Secrets Manager"""
        self.template.resource_count_is("AWS::SecretsManager::Secret", 1)

    @mark.it("creates parameter group with audit logging")
    def test_creates_parameter_group(self):
        """Test that parameter group has log_statement=all"""
        self.template.has_resource_properties("AWS::RDS::DBParameterGroup", {
            "Parameters": Match.object_like({
                "log_statement": "all"
            })
        })

    @mark.it("disables force_ssl in parameter group")
    def test_disables_force_ssl(self):
        """Test that force_ssl is disabled for legacy compatibility"""
        self.template.has_resource_properties("AWS::RDS::DBParameterGroup", {
            "Parameters": Match.object_like({
                "rds.force_ssl": "0"
            })
        })

    @mark.it("creates subnet group for database")
    def test_creates_subnet_group(self):
        """Test that DB subnet group is created"""
        self.template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    @mark.it("creates CloudWatch alarm for CPU utilization")
    def test_creates_cpu_alarm(self):
        """Test that CloudWatch alarm monitors database CPU"""
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "Namespace": "AWS/RDS",
            "MetricName": "CPUUtilization",
            "Threshold": 80
        })

    @mark.it("creates CloudWatch alarm for storage space")
    def test_creates_storage_alarm(self):
        """Test that storage space alarm is created"""
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "FreeStorageSpace",
            "Threshold": 10 * 1024 * 1024 * 1024
        })

    @mark.it("creates SNS topic for alarms")
    def test_creates_sns_topic(self):
        """Test that SNS topic is created for alarm notifications"""
        self.template.resource_count_is("AWS::SNS::Topic", 1)

    @mark.it("includes environment suffix in all resource names")
    def test_includes_env_suffix_in_names(self):
        """Test that all resources include environment suffix"""
        # Check database instance identifier
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceIdentifier": f"db-{self.env_suffix}"
        })

        # Check secret name
        self.template.has_resource_properties("AWS::SecretsManager::Secret", {
            "Name": f"db-credentials-{self.env_suffix}"
        })

    @mark.it("outputs database endpoint")
    def test_outputs_endpoint(self):
        """Test that database endpoint is exported"""
        outputs = self.template.to_json().get('Outputs', {})
        matching_outputs = [k for k in outputs.keys() if k.startswith('DatabaseStackDatabaseEndpoint')]
        self.assertTrue(len(matching_outputs) > 0, "Expected output starting with 'DatabaseStackDatabaseEndpoint'")

    @mark.it("outputs database port")
    def test_outputs_port(self):
        """Test that database port is exported"""
        outputs = self.template.to_json().get('Outputs', {})
        matching_outputs = [k for k in outputs.keys() if k.startswith('DatabaseStackDatabasePort')]
        self.assertTrue(len(matching_outputs) > 0, "Expected output starting with 'DatabaseStackDatabasePort'")

    @mark.it("outputs database secret ARN")
    def test_outputs_secret_arn(self):
        """Test that database secret ARN is exported"""
        outputs = self.template.to_json().get('Outputs', {})
        matching_outputs = [k for k in outputs.keys() if k.startswith('DatabaseStackDatabaseSecretArn')]
        self.assertTrue(len(matching_outputs) > 0, "Expected output starting with 'DatabaseStackDatabaseSecretArn'")

    @mark.it("outputs VPC ID")
    def test_outputs_vpc_id(self):
        """Test that VPC ID is exported"""
        outputs = self.template.to_json().get('Outputs', {})
        matching_outputs = [k for k in outputs.keys() if k.startswith('DatabaseStackVpcId')]
        self.assertTrue(len(matching_outputs) > 0, "Expected output starting with 'DatabaseStackVpcId'")

    @mark.it("creates NAT Gateway for private subnet connectivity")
    def test_creates_nat_gateway(self):
        """Test that NAT Gateway is created for private subnets"""
        self.template.resource_count_is("AWS::EC2::NatGateway", 1)

    @mark.it("uses PostgreSQL version 15")
    def test_uses_postgres_15(self):
        """Test that PostgreSQL version 15 is used"""
        self.template.has_resource_properties("AWS::RDS::DBParameterGroup", {
            "Family": Match.string_like_regexp("postgres15.*")
        })
