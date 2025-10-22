"""Unit tests for TAP Stack."""
import os
import sys
import json

from cdktf import App, Testing
from lib.tap_stack import TapStack

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="test123",
            state_bucket="custom-state-bucket",
            state_bucket_region="eu-central-1",
            aws_region="eu-central-1",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None

    def test_synthesizes_valid_terraform_configuration(self):
        """Stack synthesizes valid Terraform configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestSynthesisStack",
            environment_suffix="test456",
            aws_region="eu-central-1"
        )

        # Synthesize the stack
        synth = Testing.synth(stack)

        # Verify synthesized output is valid JSON
        assert synth is not None

        # Parse the synthesized JSON
        config = json.loads(synth)

        # Verify provider configuration
        assert "provider" in config
        assert "aws" in config["provider"]


class TestRDSConfiguration:
    """Test suite for RDS configuration."""

    def test_rds_instance_created_with_correct_engine(self):
        """RDS instance is created with PostgreSQL engine."""
        app = App()
        stack = TapStack(
            app,
            "TestRDSEngineStack",
            environment_suffix="test789",
            aws_region="eu-central-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Find RDS instance resource
        assert "resource" in config
        assert "aws_db_instance" in config["resource"]

        db_instance = config["resource"]["aws_db_instance"]["postgres_db"]
        assert db_instance["engine"] == "postgres"

    def test_rds_instance_has_encryption_enabled(self):
        """RDS instance has storage encryption enabled."""
        app = App()
        stack = TapStack(
            app,
            "TestRDSEncryptionStack",
            environment_suffix="test101",
            aws_region="eu-central-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        db_instance = config["resource"]["aws_db_instance"]["postgres_db"]
        assert db_instance["storage_encrypted"] is True

    def test_rds_instance_not_publicly_accessible(self):
        """RDS instance is not publicly accessible."""
        app = App()
        stack = TapStack(
            app,
            "TestRDSAccessStack",
            environment_suffix="test202",
            aws_region="eu-central-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        db_instance = config["resource"]["aws_db_instance"]["postgres_db"]
        assert db_instance["publicly_accessible"] is False

    def test_rds_uses_managed_master_password(self):
        """RDS instance uses managed master user password."""
        app = App()
        stack = TapStack(
            app,
            "TestRDSPasswordStack",
            environment_suffix="test303",
            aws_region="eu-central-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        db_instance = config["resource"]["aws_db_instance"]["postgres_db"]
        assert db_instance["manage_master_user_password"] is True

    def test_rds_has_backup_retention(self):
        """RDS instance has backup retention configured."""
        app = App()
        stack = TapStack(
            app,
            "TestRDSBackupStack",
            environment_suffix="test404",
            aws_region="eu-central-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        db_instance = config["resource"]["aws_db_instance"]["postgres_db"]
        assert db_instance["backup_retention_period"] == 7


class TestKMSConfiguration:
    """Test suite for KMS configuration."""

    def test_kms_key_created(self):
        """KMS key is created for encryption."""
        app = App()
        stack = TapStack(
            app,
            "TestKMSKeyStack",
            environment_suffix="test505",
            aws_region="eu-central-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        assert "resource" in config
        assert "aws_kms_key" in config["resource"]
        assert "rds_kms_key" in config["resource"]["aws_kms_key"]

    def test_kms_key_rotation_enabled(self):
        """KMS key has automatic rotation enabled."""
        app = App()
        stack = TapStack(
            app,
            "TestKMSRotationStack",
            environment_suffix="test606",
            aws_region="eu-central-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        kms_key = config["resource"]["aws_kms_key"]["rds_kms_key"]
        assert kms_key["enable_key_rotation"] is True

    def test_kms_alias_created(self):
        """KMS alias is created."""
        app = App()
        stack = TapStack(
            app,
            "TestKMSAliasStack",
            environment_suffix="test707",
            aws_region="eu-central-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        assert "aws_kms_alias" in config["resource"]
        assert "rds_kms_alias" in config["resource"]["aws_kms_alias"]


class TestVPCConfiguration:
    """Test suite for VPC and networking configuration."""

    def test_vpc_created(self):
        """VPC is created for RDS."""
        app = App()
        stack = TapStack(
            app,
            "TestVPCStack",
            environment_suffix="test808",
            aws_region="eu-central-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        assert "aws_vpc" in config["resource"]
        assert "rds_vpc" in config["resource"]["aws_vpc"]

    def test_subnets_created_in_multiple_azs(self):
        """Subnets are created in multiple availability zones."""
        app = App()
        stack = TapStack(
            app,
            "TestSubnetsStack",
            environment_suffix="test909",
            aws_region="eu-central-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        assert "aws_subnet" in config["resource"]
        assert "rds_subnet_1" in config["resource"]["aws_subnet"]
        assert "rds_subnet_2" in config["resource"]["aws_subnet"]

    def test_db_subnet_group_created(self):
        """DB subnet group is created."""
        app = App()
        stack = TapStack(
            app,
            "TestDBSubnetGroupStack",
            environment_suffix="test010",
            aws_region="eu-central-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        assert "aws_db_subnet_group" in config["resource"]
        assert "rds_subnet_group" in config["resource"]["aws_db_subnet_group"]

    def test_security_group_created(self):
        """Security group is created for RDS."""
        app = App()
        stack = TapStack(
            app,
            "TestSecurityGroupStack",
            environment_suffix="test111",
            aws_region="eu-central-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        assert "aws_security_group" in config["resource"]
        assert "db_security_group" in config["resource"]["aws_security_group"]


class TestSecretsManagerConfiguration:
    """Test suite for Secrets Manager configuration."""

    def test_secrets_manager_secret_created(self):
        """Secrets Manager secret is created."""
        app = App()
        stack = TapStack(
            app,
            "TestSecretsStack",
            environment_suffix="test212",
            aws_region="eu-central-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        assert "aws_secretsmanager_secret" in config["resource"]
        assert "db_app_credentials" in config["resource"]["aws_secretsmanager_secret"]


class TestResourceNaming:
    """Test suite for resource naming conventions."""

    def test_resources_include_environment_suffix(self):
        """Resources include environment suffix in names."""
        app = App()
        test_suffix = "unique987"
        stack = TapStack(
            app,
            "TestNamingStack",
            environment_suffix=test_suffix,
            aws_region="eu-central-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Check RDS identifier includes suffix
        db_instance = config["resource"]["aws_db_instance"]["postgres_db"]
        assert test_suffix in db_instance["identifier"]

        # Check security group name includes suffix
        sg = config["resource"]["aws_security_group"]["db_security_group"]
        assert test_suffix in sg["name"]


class TestOutputs:
    """Test suite for stack outputs."""

    def test_stack_has_required_outputs(self):
        """Stack exports required outputs."""
        app = App()
        stack = TapStack(
            app,
            "TestOutputsStack",
            environment_suffix="test313",
            aws_region="eu-central-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Verify outputs exist
        assert "output" in config
        assert "db_endpoint" in config["output"]
        assert "db_port" in config["output"]
        assert "master_secret_arn" in config["output"]
        assert "app_secret_arn" in config["output"]
        assert "kms_key_id" in config["output"]
        assert "vpc_id" in config["output"]
        assert "security_group_id" in config["output"]
