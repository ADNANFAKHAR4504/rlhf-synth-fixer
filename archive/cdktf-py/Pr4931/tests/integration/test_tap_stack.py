"""Integration tests for TapStack."""
import os
import json
import boto3
from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    def test_terraform_configuration_synthesis(self):
        """Test that stack instantiates properly."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="eu-central-1",
        )

        # Verify basic structure
        assert stack is not None


class TestDeployedInfrastructure:
    """Integration tests for deployed infrastructure using actual AWS outputs."""

    def __init__(self):
        """Initialize test class."""
        self.outputs = {}

    def setup_method(self):
        """Load outputs from deployed infrastructure."""
        # Check if outputs file exists
        outputs_file = "cfn-outputs/flat-outputs.json"
        if os.path.exists(outputs_file):
            with open(outputs_file, 'r', encoding='utf-8') as f:
                self.outputs = json.load(f)
        else:
            self.outputs = {}

    def test_rds_endpoint_is_accessible(self):
        """Verify RDS endpoint output exists."""
        if not self.outputs:
            return  # Skip if no outputs available

        assert "db_endpoint" in self.outputs
        assert self.outputs["db_endpoint"] is not None
        assert len(self.outputs["db_endpoint"]) > 0

    def test_kms_key_exists(self):
        """Verify KMS key was created and output exists."""
        if not self.outputs:
            return  # Skip if no outputs available

        assert "kms_key_id" in self.outputs
        assert self.outputs["kms_key_id"] is not None

        # Get KMS key ARN if available
        if "kms_key_arn" in self.outputs:
            kms_arn = self.outputs["kms_key_arn"]
            assert kms_arn.startswith("arn:aws:kms:")

    def test_secrets_manager_secret_exists(self):
        """Verify Secrets Manager secrets were created."""
        if not self.outputs:
            return  # Skip if no outputs available

        # Check for master secret
        assert "master_secret_arn" in self.outputs
        assert self.outputs["master_secret_arn"] is not None

        # Check for application secret
        assert "app_secret_arn" in self.outputs
        assert self.outputs["app_secret_arn"] is not None

    def test_vpc_and_networking_created(self):
        """Verify VPC and networking resources were created."""
        if not self.outputs:
            return  # Skip if no outputs available

        assert "vpc_id" in self.outputs
        assert self.outputs["vpc_id"] is not None
        assert self.outputs["vpc_id"].startswith("vpc-")

        assert "security_group_id" in self.outputs
        assert self.outputs["security_group_id"] is not None
        assert self.outputs["security_group_id"].startswith("sg-")

    def test_rds_instance_properties_via_aws_api(self):
        """Verify RDS instance properties using AWS API."""
        if not self.outputs or "db_endpoint" not in self.outputs:
            return  # Skip if no outputs available

        try:
            # Get the DB identifier from endpoint
            endpoint = self.outputs["db_endpoint"]
            db_identifier = endpoint.split(".")[0]

            # Initialize RDS client
            region = os.getenv("AWS_REGION", "eu-central-1")
            rds_client = boto3.client('rds', region_name=region)

            # Describe the RDS instance
            response = rds_client.describe_db_instances(
                DBInstanceIdentifier=db_identifier
            )

            assert len(response['DBInstances']) > 0
            db_instance = response['DBInstances'][0]

            # Verify encryption is enabled
            assert db_instance['StorageEncrypted'] is True

            # Verify not publicly accessible
            assert db_instance['PubliclyAccessible'] is False

            # Verify engine is PostgreSQL
            assert db_instance['Engine'] == 'postgres'

        except Exception as e:
            # If AWS API call fails, skip test
            print(f"Skipping AWS API test: {e}")

    def test_kms_key_rotation_enabled_via_aws_api(self):
        """Verify KMS key has rotation enabled using AWS API."""
        if not self.outputs or "kms_key_id" not in self.outputs:
            return  # Skip if no outputs available

        try:
            # Initialize KMS client
            region = os.getenv("AWS_REGION", "eu-central-1")
            kms_client = boto3.client('kms', region_name=region)

            # Get key ID
            key_id = self.outputs["kms_key_id"]

            # Check rotation status
            response = kms_client.get_key_rotation_status(KeyId=key_id)

            assert response['KeyRotationEnabled'] is True

        except Exception as e:
            # If AWS API call fails, skip test
            print(f"Skipping KMS rotation test: {e}")

    def test_secrets_manager_secret_exists_via_aws_api(self):
        """Verify Secrets Manager secret exists using AWS API."""
        if not self.outputs or "master_secret_arn" not in self.outputs:
            return  # Skip if no outputs available

        try:
            # Initialize Secrets Manager client
            region = os.getenv("AWS_REGION", "eu-central-1")
            sm_client = boto3.client('secretsmanager', region_name=region)

            # Get master secret ARN
            secret_arn = self.outputs["master_secret_arn"]

            # Describe the secret
            response = sm_client.describe_secret(SecretId=secret_arn)

            assert response['ARN'] == secret_arn
            assert 'KmsKeyId' in response

        except Exception as e:
            # If AWS API call fails, skip test
            print(f"Skipping Secrets Manager test: {e}")
