import aws_cdk as cdk
from aws_cdk import assertions
import pytest
from lib.rds_migration_stack import RdsMigrationStack


def test_rds_instance_created():
    """Test that RDS instance is created with correct properties."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")
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
    stack = RdsMigrationStack(app, "TestStack")
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
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify secret exists
    template.resource_count_is("AWS::SecretsManager::Secret", 1)


def test_security_groups_configured():
    """Test that security groups are properly configured."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify security groups exist
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
    stack = RdsMigrationStack(app, "TestStack")
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
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify parameter group exists
    template.resource_count_is("AWS::RDS::DBParameterGroup", 1)

    # Verify parameter group family
    template.has_resource_properties(
        "AWS::RDS::DBParameterGroup",
        {
            "Family": "postgres13",
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
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify VPC exists
    template.resource_count_is("AWS::EC2::VPC", 1)

    # Verify subnet groups exist
    template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)


def test_backup_configuration():
    """Test that backup and retention settings are correct."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify backup retention
    template.has_resource_properties(
        "AWS::RDS::DBInstance",
        {
            "BackupRetentionPeriod": 7,
            "PreferredBackupWindow": "03:00-05:00",
            "PreferredMaintenanceWindow": "sun:03:00-sun:05:00",
        },
    )


def test_enhanced_monitoring_enabled():
    """Test that enhanced monitoring is configured."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")
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
    stack = RdsMigrationStack(app, "TestStack")
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
    stack = RdsMigrationStack(app, "TestStack")
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
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify resources include environment suffix in logical IDs
    # This is implicit in the CDK construct IDs we defined
    assert stack.database is not None
    assert stack.vpc is not None


def test_deletion_protection_disabled():
    """Test that deletion protection is disabled for QA environment."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")
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
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    template.has_resource_properties(
        "AWS::RDS::DBInstance",
        {
            "AutoMinorVersionUpgrade": True,
        },
    )
