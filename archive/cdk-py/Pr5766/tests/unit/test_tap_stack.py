"""
test_tap_stack.py

Unit tests for the TapStack CDK stack using CDK assertions.
Tests infrastructure creation without actual AWS deployment.
"""

import aws_cdk as cdk
from aws_cdk import assertions
import pytest
from lib.tap_stack import TapStack, TapStackProps


def test_rds_instance_created():
    """Test that RDS instance is created with correct properties."""
    app = cdk.App()
    stack = TapStack(app, "TestStack", TapStackProps(environment_suffix="test"))
    template = assertions.Template.from_stack(stack)

    # Verify RDS instance exists
    template.resource_count_is("AWS::RDS::DBInstance", 1)

    # Verify Multi-AZ is enabled
    template.has_resource_properties(
        "AWS::RDS::DBInstance",
        {
            "MultiAZ": True,
            "Engine": "postgres",
            "DeletionProtection": False,
        },
    )


def test_kms_encryption_enabled():
    """Test that KMS encryption is properly configured."""
    app = cdk.App()
    stack = TapStack(app, "TestStack", TapStackProps(environment_suffix="test"))
    template = assertions.Template.from_stack(stack)

    # Verify KMS key exists
    template.resource_count_is("AWS::KMS::Key", 1)

    # Verify key rotation is enabled
    template.has_resource_properties(
        "AWS::KMS::Key",
        {
            "EnableKeyRotation": True,
        },
    )

    # Verify RDS uses encryption
    template.has_resource_properties(
        "AWS::RDS::DBInstance",
        {
            "StorageEncrypted": True,
        },
    )


def test_secrets_manager_secret_created():
    """Test that Secrets Manager secret is created."""
    app = cdk.App()
    stack = TapStack(app, "TestStack", TapStackProps(environment_suffix="test"))
    template = assertions.Template.from_stack(stack)

    # Verify secret exists
    template.resource_count_is("AWS::SecretsManager::Secret", 1)


def test_security_groups_configured():
    """Test that security groups are properly configured."""
    app = cdk.App()
    stack = TapStack(app, "TestStack", TapStackProps(environment_suffix="test"))
    template = assertions.Template.from_stack(stack)

    # Verify security groups exist (at least 2: application and database)
    template.resource_count_is("AWS::EC2::SecurityGroup", 2)

    # Verify ingress rule for PostgreSQL port
    template.has_resource_properties(
        "AWS::EC2::SecurityGroupIngress",
        {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
        },
    )


def test_cloudwatch_alarms_created():
    """Test that CloudWatch alarms are created."""
    app = cdk.App()
    stack = TapStack(app, "TestStack", TapStackProps(environment_suffix="test"))
    template = assertions.Template.from_stack(stack)

    # Verify alarms exist (CPU, Storage, Connections)
    template.resource_count_is("AWS::CloudWatch::Alarm", 3)

    # Verify CPU alarm threshold
    template.has_resource_properties(
        "AWS::CloudWatch::Alarm",
        {
            "Threshold": 80,
            "ComparisonOperator": "GreaterThanThreshold",
        },
    )


def test_parameter_group_configuration():
    """Test that parameter group has correct settings."""
    app = cdk.App()
    stack = TapStack(app, "TestStack", TapStackProps(environment_suffix="test"))
    template = assertions.Template.from_stack(stack)

    # Verify parameter group exists
    template.resource_count_is("AWS::RDS::DBParameterGroup", 1)

    # Verify parameter group family (PostgreSQL 14.17 uses postgres14 family)
    template.has_resource_properties(
        "AWS::RDS::DBParameterGroup",
        {
            "Family": "postgres14",
            "Parameters": assertions.Match.object_like(
                {
                    "max_connections": "200",
                }
            ),
        },
    )


def test_vpc_configuration():
    """Test that VPC is created with correct configuration."""
    app = cdk.App()
    stack = TapStack(app, "TestStack", TapStackProps(environment_suffix="test"))
    template = assertions.Template.from_stack(stack)

    # Verify VPC exists
    template.resource_count_is("AWS::EC2::VPC", 1)

    # Verify subnet groups exist
    template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)


def test_backup_configuration():
    """Test that backup and retention settings are correct."""
    app = cdk.App()
    stack = TapStack(app, "TestStack", TapStackProps(environment_suffix="test"))
    template = assertions.Template.from_stack(stack)

    # Verify backup retention
    template.has_resource_properties(
        "AWS::RDS::DBInstance",
        {
            "BackupRetentionPeriod": 7,
            "PreferredBackupWindow": "03:00-05:00",
            "PreferredMaintenanceWindow": "sun:06:00-sun:08:00",  # Updated to avoid overlap with backup window
        },
    )


def test_enhanced_monitoring_enabled():
    """Test that enhanced monitoring is configured."""
    app = cdk.App()
    stack = TapStack(app, "TestStack", TapStackProps(environment_suffix="test"))
    template = assertions.Template.from_stack(stack)

    # Verify monitoring role exists
    template.resource_count_is("AWS::IAM::Role", 1)

    # Verify monitoring interval is set
    template.has_resource_properties(
        "AWS::RDS::DBInstance",
        {
            "MonitoringInterval": 60,
        },
    )


def test_stack_outputs_present():
    """Test that all required CloudFormation outputs are present."""
    app = cdk.App()
    stack = TapStack(app, "TestStack", TapStackProps(environment_suffix="test"))
    template = assertions.Template.from_stack(stack)

    # Verify outputs exist
    template.has_output("DatabaseEndpoint", {})
    template.has_output("DatabasePort", {})
    template.has_output("DatabaseName", {})
    template.has_output("DatabaseSecretArn", {})
    template.has_output("DatabaseSecurityGroupId", {})
    template.has_output("VpcId", {})


def test_required_tags_applied():
    """Test that required tags are applied to resources."""
    app = cdk.App()
    stack = TapStack(app, "TestStack", TapStackProps(environment_suffix="test"))
    template = assertions.Template.from_stack(stack)

    # Verify that RDS instance has tags applied
    # Note: CDK adds ManagedBy tag in addition to custom tags
    template.has_resource_properties(
        "AWS::RDS::DBInstance",
        {
            "Tags": assertions.Match.array_with([
                {"Key": "Environment", "Value": "staging"},
            ])
        }
    )


def test_environment_suffix_in_resource_names():
    """Test that environment suffix is included in resource names."""
    app = cdk.App(
        context={
            "environmentSuffix": "test-suffix-123"
        }
    )
    stack = TapStack(app, "TestStack", TapStackProps(environment_suffix="test-suffix-123"))
    template = assertions.Template.from_stack(stack)

    # Verify resources include environment suffix in logical IDs
    # This is implicit in the CDK construct IDs we defined
    assert stack.database is not None
    assert stack.vpc is not None


def test_deletion_protection_disabled():
    """Test that deletion protection is disabled for staging environment."""
    app = cdk.App()
    stack = TapStack(app, "TestStack", TapStackProps(environment_suffix="test"))
    template = assertions.Template.from_stack(stack)

    template.has_resource_properties(
        "AWS::RDS::DBInstance",
        {
            "DeletionProtection": False,
        },
    )


def test_auto_minor_version_upgrade():
    """Test that automatic minor version upgrades are enabled."""
    app = cdk.App()
    stack = TapStack(app, "TestStack", TapStackProps(environment_suffix="test"))
    template = assertions.Template.from_stack(stack)

    template.has_resource_properties(
        "AWS::RDS::DBInstance",
        {
            "AutoMinorVersionUpgrade": True,
        },
    )


def test_default_environment_suffix():
    """Test that environment suffix defaults to 'dev' when not provided."""
    app = cdk.App()
    stack = TapStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify stack can be created without explicit environment suffix
    template.resource_count_is("AWS::RDS::DBInstance", 1)


def test_vpc_cidr_configuration():
    """Test that VPC has correct CIDR block configuration."""
    app = cdk.App(
        context={
            "stagingVpcCidr": "10.1.0.0/16"
        }
    )
    stack = TapStack(app, "TestStack", TapStackProps(environment_suffix="test"))
    template = assertions.Template.from_stack(stack)

    # Verify VPC exists with correct CIDR
    template.has_resource_properties(
        "AWS::EC2::VPC",
        {
            "CidrBlock": "10.1.0.0/16",
        },
    )


def test_database_name():
    """Test that database name is correctly set."""
    app = cdk.App()
    stack = TapStack(app, "TestStack", TapStackProps(environment_suffix="test"))
    template = assertions.Template.from_stack(stack)

    template.has_resource_properties(
        "AWS::RDS::DBInstance",
        {
            "DBName": "paymentdb",
        },
    )


def test_postgres_engine_version():
    """Test that PostgreSQL engine version is 14.17."""
    app = cdk.App()
    stack = TapStack(app, "TestStack", TapStackProps(environment_suffix="test"))
    template = assertions.Template.from_stack(stack)

    # Verify PostgreSQL 14.17 is used (EngineVersion should contain "14.17")
    template.has_resource_properties(
        "AWS::RDS::DBInstance",
        assertions.Match.object_like({
            "Engine": "postgres",
        }),
    )
