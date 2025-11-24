"""Unit tests for GlobalStack with mocked AWS resources."""
import pytest
from unittest.mock import Mock, patch, MagicMock
from constructs import Construct
from lib.stacks.global_stack import GlobalStack


@pytest.fixture
def mock_app():
    """Create a mock CDKTF App."""
    return Mock(spec=Construct)


@pytest.fixture
def stack_params():
    """Common stack parameters for testing."""
    return {
        "scope": Mock(spec=Construct),
        "id": "test-global-stack",
        "environment_suffix": "test",
        "primary_endpoint": "primary.example.com",
        "secondary_endpoint": "secondary.example.com",
        "primary_region": "us-east-1",
        "secondary_region": "us-west-2",
        "state_bucket": "test-state-bucket",
        "state_bucket_region": "us-east-1",
        "default_tags": {"Environment": "test", "Project": "healthcare-dr"}
    }


class TestGlobalStackInitialization:
    """Test GlobalStack initialization and configuration."""

    @patch('lib.stacks.global_stack.S3Backend')
    @patch('lib.stacks.global_stack.AwsProvider')
    @patch('lib.stacks.global_stack.DynamodbTable')
    @patch('lib.stacks.global_stack.Route53Zone')
    @patch('lib.stacks.global_stack.Route53HealthCheck')
    @patch('lib.stacks.global_stack.Route53Record')
    @patch('lib.stacks.global_stack.TerraformOutput')
    def test_global_stack_creation(
        self, mock_output, mock_record, mock_health_check,
        mock_zone, mock_dynamodb, mock_provider, mock_backend, stack_params
    ):
        """Test that GlobalStack initializes correctly with all resources."""
        # Arrange
        mock_zone_instance = Mock()
        mock_zone_instance.zone_id = "Z123456789"
        mock_zone.return_value = mock_zone_instance

        mock_health_check_instance = Mock()
        mock_health_check_instance.id = "health-check-123"
        mock_health_check.return_value = mock_health_check_instance

        mock_dynamodb_instance = Mock()
        mock_dynamodb_instance.name = "test-table"
        mock_dynamodb.return_value = mock_dynamodb_instance

        # Act
        stack = GlobalStack(**stack_params)

        # Assert
        assert stack.environment_suffix == "test"
        assert stack.primary_endpoint == "primary.example.com"
        assert stack.secondary_endpoint == "secondary.example.com"
        assert stack.primary_region == "us-east-1"
        assert stack.secondary_region == "us-west-2"
        assert stack.common_tags["Environment"] == "Production"
        assert stack.common_tags["DisasterRecovery"] == "Enabled"
        assert stack.common_tags["Scope"] == "Global"

        # Verify S3 Backend was configured
        mock_backend.assert_called_once()
        backend_call_args = mock_backend.call_args
        assert backend_call_args[1]["bucket"] == "test-state-bucket"
        assert backend_call_args[1]["key"] == "healthcare-dr/global/test/terraform.tfstate"
        assert backend_call_args[1]["region"] == "us-east-1"
        assert backend_call_args[1]["encrypt"] is True

        # Verify AWS Provider was configured
        mock_provider.assert_called_once()
        provider_call_args = mock_provider.call_args
        assert provider_call_args[1]["region"] == "us-east-1"

    @patch('lib.stacks.global_stack.S3Backend')
    @patch('lib.stacks.global_stack.AwsProvider')
    @patch('lib.stacks.global_stack.DynamodbTable')
    @patch('lib.stacks.global_stack.Route53Zone')
    @patch('lib.stacks.global_stack.Route53HealthCheck')
    @patch('lib.stacks.global_stack.Route53Record')
    @patch('lib.stacks.global_stack.TerraformOutput')
    def test_common_tags_applied(
        self, mock_output, mock_record, mock_health_check,
        mock_zone, mock_dynamodb, mock_provider, mock_backend, stack_params
    ):
        """Test that common tags are properly configured."""
        # Arrange & Act
        stack = GlobalStack(**stack_params)

        # Assert
        assert "Environment" in stack.common_tags
        assert "DisasterRecovery" in stack.common_tags
        assert "Scope" in stack.common_tags
        assert "ManagedBy" in stack.common_tags
        assert stack.common_tags["ManagedBy"] == "CDKTF"


class TestDynamoDBGlobalTables:
    """Test DynamoDB global tables creation."""

    @patch('lib.stacks.global_stack.S3Backend')
    @patch('lib.stacks.global_stack.AwsProvider')
    @patch('lib.stacks.global_stack.DynamodbTable')
    @patch('lib.stacks.global_stack.Route53Zone')
    @patch('lib.stacks.global_stack.Route53HealthCheck')
    @patch('lib.stacks.global_stack.Route53Record')
    @patch('lib.stacks.global_stack.TerraformOutput')
    def test_patient_records_table_created(
        self, mock_output, mock_record, mock_health_check,
        mock_zone, mock_dynamodb, mock_provider, mock_backend, stack_params
    ):
        """Test that patient records DynamoDB table is created with correct configuration."""
        # Arrange
        mock_dynamodb_instance = Mock()
        mock_dynamodb_instance.name = "healthcare-patient-records-v1-test"
        mock_dynamodb.return_value = mock_dynamodb_instance

        # Act
        stack = GlobalStack(**stack_params)

        # Assert - Check if DynamodbTable was called at least twice (patient records + audit logs)
        assert mock_dynamodb.call_count >= 2

        # Find the patient records table call
        patient_table_call = None
        for call in mock_dynamodb.call_args_list:
            if call[1].get("name") == "healthcare-patient-records-v1-test":
                patient_table_call = call
                break

        assert patient_table_call is not None
        patient_table_args = patient_table_call[1]
        assert patient_table_args["billing_mode"] == "PAY_PER_REQUEST"
        assert patient_table_args["hash_key"] == "patient_id"
        assert patient_table_args["range_key"] == "record_timestamp"
        assert patient_table_args["stream_enabled"] is True
        assert patient_table_args["stream_view_type"] == "NEW_AND_OLD_IMAGES"

        # Verify attributes
        attributes = patient_table_args["attribute"]
        assert len(attributes) == 2
        assert any(attr.name == "patient_id" and attr.type == "S" for attr in attributes)
        assert any(attr.name == "record_timestamp" and attr.type == "N" for attr in attributes)

        # Verify replica configuration
        replicas = patient_table_args["replica"]
        assert len(replicas) == 1
        assert replicas[0].region_name == "us-west-2"

        # Verify point-in-time recovery
        pitr = patient_table_args["point_in_time_recovery"]
        assert pitr.enabled is True

    @patch('lib.stacks.global_stack.S3Backend')
    @patch('lib.stacks.global_stack.AwsProvider')
    @patch('lib.stacks.global_stack.DynamodbTable')
    @patch('lib.stacks.global_stack.Route53Zone')
    @patch('lib.stacks.global_stack.Route53HealthCheck')
    @patch('lib.stacks.global_stack.Route53Record')
    @patch('lib.stacks.global_stack.TerraformOutput')
    def test_audit_logs_table_created(
        self, mock_output, mock_record, mock_health_check,
        mock_zone, mock_dynamodb, mock_provider, mock_backend, stack_params
    ):
        """Test that audit logs DynamoDB table is created with correct configuration."""
        # Arrange
        mock_dynamodb_instance = Mock()
        mock_dynamodb_instance.name = "healthcare-audit-logs-v1-test"
        mock_dynamodb.return_value = mock_dynamodb_instance

        # Act
        stack = GlobalStack(**stack_params)

        # Assert - Check if DynamodbTable was called at least twice
        assert mock_dynamodb.call_count >= 2

        # Find the audit logs table call
        audit_table_call = None
        for call in mock_dynamodb.call_args_list:
            if call[1].get("name") == "healthcare-audit-logs-v1-test":
                audit_table_call = call
                break

        assert audit_table_call is not None
        audit_table_args = audit_table_call[1]
        assert audit_table_args["billing_mode"] == "PAY_PER_REQUEST"
        assert audit_table_args["hash_key"] == "audit_id"
        assert audit_table_args["range_key"] == "timestamp"
        assert audit_table_args["stream_enabled"] is True
        assert audit_table_args["stream_view_type"] == "NEW_AND_OLD_IMAGES"

        # Verify attributes
        attributes = audit_table_args["attribute"]
        assert len(attributes) == 2
        assert any(attr.name == "audit_id" and attr.type == "S" for attr in attributes)
        assert any(attr.name == "timestamp" and attr.type == "N" for attr in attributes)

        # Verify replica configuration
        replicas = audit_table_args["replica"]
        assert len(replicas) == 1
        assert replicas[0].region_name == "us-west-2"


class TestRoute53Infrastructure:
    """Test Route 53 DNS infrastructure."""

    @patch('lib.stacks.global_stack.S3Backend')
    @patch('lib.stacks.global_stack.AwsProvider')
    @patch('lib.stacks.global_stack.DynamodbTable')
    @patch('lib.stacks.global_stack.Route53Zone')
    @patch('lib.stacks.global_stack.Route53HealthCheck')
    @patch('lib.stacks.global_stack.Route53Record')
    @patch('lib.stacks.global_stack.TerraformOutput')
    def test_hosted_zone_created(
        self, mock_output, mock_record, mock_health_check,
        mock_zone, mock_dynamodb, mock_provider, mock_backend, stack_params
    ):
        """Test that Route 53 hosted zone is created."""
        # Arrange
        mock_zone_instance = Mock()
        mock_zone_instance.zone_id = "Z123456789"
        mock_zone.return_value = mock_zone_instance

        mock_health_check_instance = Mock()
        mock_health_check_instance.id = "health-check-123"
        mock_health_check.return_value = mock_health_check_instance

        # Act
        stack = GlobalStack(**stack_params)

        # Assert
        mock_zone.assert_called_once()
        zone_args = mock_zone.call_args[1]
        assert zone_args["name"] == "healthcare-dr-v1-test.com"
        assert "Name" in zone_args["tags"]

    @patch('lib.stacks.global_stack.S3Backend')
    @patch('lib.stacks.global_stack.AwsProvider')
    @patch('lib.stacks.global_stack.DynamodbTable')
    @patch('lib.stacks.global_stack.Route53Zone')
    @patch('lib.stacks.global_stack.Route53HealthCheck')
    @patch('lib.stacks.global_stack.Route53Record')
    @patch('lib.stacks.global_stack.TerraformOutput')
    def test_health_checks_created(
        self, mock_output, mock_record, mock_health_check,
        mock_zone, mock_dynamodb, mock_provider, mock_backend, stack_params
    ):
        """Test that health checks are created for both regions."""
        # Arrange
        mock_zone_instance = Mock()
        mock_zone_instance.zone_id = "Z123456789"
        mock_zone.return_value = mock_zone_instance

        mock_health_check_instance = Mock()
        mock_health_check_instance.id = "health-check-123"
        mock_health_check.return_value = mock_health_check_instance

        # Act
        stack = GlobalStack(**stack_params)

        # Assert - Two health checks should be created (primary and secondary)
        assert mock_health_check.call_count == 2

        # Check primary health check
        primary_health_check_call = mock_health_check.call_args_list[0]
        primary_args = primary_health_check_call[1]
        assert primary_args["type"] == "HTTPS"
        assert primary_args["resource_path"] == "/health"
        assert primary_args["failure_threshold"] == 3
        assert primary_args["request_interval"] == 30

        # Check secondary health check
        secondary_health_check_call = mock_health_check.call_args_list[1]
        secondary_args = secondary_health_check_call[1]
        assert secondary_args["type"] == "HTTPS"
        assert secondary_args["resource_path"] == "/health"
        assert secondary_args["failure_threshold"] == 3
        assert secondary_args["request_interval"] == 30

    @patch('lib.stacks.global_stack.S3Backend')
    @patch('lib.stacks.global_stack.AwsProvider')
    @patch('lib.stacks.global_stack.DynamodbTable')
    @patch('lib.stacks.global_stack.Route53Zone')
    @patch('lib.stacks.global_stack.Route53HealthCheck')
    @patch('lib.stacks.global_stack.Route53Record')
    @patch('lib.stacks.global_stack.TerraformOutput')
    def test_weighted_routing_records_created(
        self, mock_output, mock_record, mock_health_check,
        mock_zone, mock_dynamodb, mock_provider, mock_backend, stack_params
    ):
        """Test that weighted routing records are created with correct weights."""
        # Arrange
        mock_zone_instance = Mock()
        mock_zone_instance.zone_id = "Z123456789"
        mock_zone.return_value = mock_zone_instance

        mock_health_check_instance = Mock()
        mock_health_check_instance.id = "health-check-123"
        mock_health_check.return_value = mock_health_check_instance

        # Act
        stack = GlobalStack(**stack_params)

        # Assert - Two Route53 records should be created (primary 70%, secondary 30%)
        assert mock_record.call_count == 2

        # Check primary record (70% weight)
        primary_record_call = mock_record.call_args_list[0]
        primary_record_args = primary_record_call[1]
        assert primary_record_args["name"] == "api.healthcare-dr-v1-test.com"
        assert primary_record_args["type"] == "CNAME"
        assert primary_record_args["ttl"] == 60
        assert primary_record_args["records"] == ["primary.example.com"]
        assert primary_record_args["set_identifier"] == "primary"
        assert primary_record_args["weighted_routing_policy"].weight == 70

        # Check secondary record (30% weight)
        secondary_record_call = mock_record.call_args_list[1]
        secondary_record_args = secondary_record_call[1]
        assert secondary_record_args["name"] == "api.healthcare-dr-v1-test.com"
        assert secondary_record_args["type"] == "CNAME"
        assert secondary_record_args["ttl"] == 60
        assert secondary_record_args["records"] == ["secondary.example.com"]
        assert secondary_record_args["set_identifier"] == "secondary"
        assert secondary_record_args["weighted_routing_policy"].weight == 30


class TestTerraformOutputs:
    """Test Terraform outputs."""

    @patch('lib.stacks.global_stack.S3Backend')
    @patch('lib.stacks.global_stack.AwsProvider')
    @patch('lib.stacks.global_stack.DynamodbTable')
    @patch('lib.stacks.global_stack.Route53Zone')
    @patch('lib.stacks.global_stack.Route53HealthCheck')
    @patch('lib.stacks.global_stack.Route53Record')
    @patch('lib.stacks.global_stack.TerraformOutput')
    def test_terraform_outputs_created(
        self, mock_output, mock_record, mock_health_check,
        mock_zone, mock_dynamodb, mock_provider, mock_backend, stack_params
    ):
        """Test that all required Terraform outputs are created."""
        # Arrange
        mock_zone_instance = Mock()
        mock_zone_instance.zone_id = "Z123456789"
        mock_zone.return_value = mock_zone_instance

        mock_health_check_instance = Mock()
        mock_health_check_instance.id = "health-check-123"
        mock_health_check.return_value = mock_health_check_instance

        mock_dynamodb_instance = Mock()
        mock_dynamodb_instance.name = "test-table"
        mock_dynamodb.return_value = mock_dynamodb_instance

        # Act
        stack = GlobalStack(**stack_params)

        # Assert - Check that TerraformOutput was called multiple times
        assert mock_output.call_count >= 4  # patient_records_table, audit_logs_table, hosted_zone_id, api_domain

        # Verify output names
        output_ids = [call[0][1] for call in mock_output.call_args_list]
        assert "patient_records_table" in output_ids
        assert "audit_logs_table" in output_ids
        assert "hosted_zone_id" in output_ids
        assert "api_domain" in output_ids
