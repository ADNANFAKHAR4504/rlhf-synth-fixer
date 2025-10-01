"""
Unit tests for the main infrastructure module.
Tests infrastructure orchestration and resource coordination.
"""

from unittest.mock import MagicMock, Mock, patch

import pytest

# Mock Pulumi before importing our modules
pulumi = Mock()
pulumi.export = Mock
pulumi_aws = Mock()

# Mock infrastructure components
mock_config = Mock()
mock_storage = {
    "input_bucket": Mock(),
    "output_bucket": Mock(),
    "input_public_access_block": Mock(),
    "output_public_access_block": Mock(),
    "input_versioning": Mock(),
    "output_versioning": Mock(),
    "input_encryption": Mock(),
    "output_encryption": Mock()
}

mock_lifecycle_policies = {
    "input_lifecycle": Mock(),
    "output_lifecycle": Mock()
}

mock_iam = {
    "lambda_role": Mock(),
    "s3_policy": Mock(),
    "logs_policy": Mock(),
    "invoke_policy": Mock()
}

mock_lambda = {
    "lambda_function": Mock(),
    "log_group": Mock(),
    "s3_permission": Mock(),
    "bucket_notification": Mock(),
    "alarms": {
        "error_alarm": Mock(),
        "throttle_alarm": Mock(),
        "duration_alarm": Mock()
    }
}

# Set up mocks for infrastructure functions
def mock_create_s3_buckets(config):
    return mock_storage

def mock_create_s3_lifecycle_policies(config, input_bucket, output_bucket):
    return mock_lifecycle_policies

def mock_create_iam_resources(config, input_bucket, output_bucket, lambda_function):
    return mock_iam

def mock_create_lambda_resources(config, lambda_role, input_bucket, output_bucket):
    return mock_lambda

def mock_create_lambda_invoke_policy(config, lambda_function):
    return Mock()

from lib.infrastructure.main import create_infrastructure


class TestInfrastructureOrchestration:
    """Test cases for infrastructure orchestration."""
    
    def test_create_infrastructure_complete(self):
        """Test complete infrastructure creation."""
        with patch('lib.infrastructure.main.ServerlessConfig') as mock_config_class:
            with patch('lib.infrastructure.main.create_s3_buckets', mock_create_s3_buckets):
                with patch('lib.infrastructure.main.create_s3_lifecycle_policies', mock_create_s3_lifecycle_policies):
                    with patch('lib.infrastructure.main.create_iam_resources', mock_create_iam_resources):
                        with patch('lib.infrastructure.main.create_lambda_resources', mock_create_lambda_resources):
                            with patch('lib.infrastructure.main.create_lambda_invoke_policy', mock_create_lambda_invoke_policy):
                                with patch('lib.infrastructure.main.pulumi', pulumi):
                                    
                                    # Mock config instance
                                    mock_config_instance = Mock()
                                    mock_config_instance.validate_configuration.return_value = True
                                    mock_config_class.return_value = mock_config_instance
                                    
                                    result = create_infrastructure()
                                    
                                    # Verify infrastructure components were created
                                    assert "config" in result
                                    assert "storage" in result
                                    assert "lifecycle_policies" in result
                                    assert "iam" in result
                                    assert "lambda" in result
                                    assert "lambda_function" in result
                                    
                                    # Verify configuration validation was called
                                    mock_config_instance.validate_configuration.assert_called_once()
    
    def test_infrastructure_resource_coordination(self):
        """Test infrastructure resource coordination."""
        with patch('lib.infrastructure.main.ServerlessConfig') as mock_config_class:
            with patch('lib.infrastructure.main.create_s3_buckets', mock_create_s3_buckets):
                with patch('lib.infrastructure.main.create_s3_lifecycle_policies', mock_create_s3_lifecycle_policies):
                    with patch('lib.infrastructure.main.create_iam_resources', mock_create_iam_resources):
                        with patch('lib.infrastructure.main.create_lambda_resources', mock_create_lambda_resources):
                            with patch('lib.infrastructure.main.create_lambda_invoke_policy', mock_create_lambda_invoke_policy):
                                with patch('lib.infrastructure.main.pulumi', pulumi):
                                    
                                    # Mock config instance
                                    mock_config_instance = Mock()
                                    mock_config_instance.validate_configuration.return_value = True
                                    mock_config_class.return_value = mock_config_instance
                                    
                                    result = create_infrastructure()
                                    
                                    # Verify resource coordination
                                    assert result["storage"] == mock_storage
                                    assert result["lifecycle_policies"] == mock_lifecycle_policies
                                    assert result["iam"] == mock_iam
                                    assert result["lambda"] == mock_lambda
                                    assert result["lambda_function"] == mock_lambda["lambda_function"]
    
    def test_infrastructure_exports(self):
        """Test infrastructure exports."""
        with patch('lib.infrastructure.main.ServerlessConfig') as mock_config_class:
            with patch('lib.infrastructure.main.create_s3_buckets', mock_create_s3_buckets):
                with patch('lib.infrastructure.main.create_s3_lifecycle_policies', mock_create_s3_lifecycle_policies):
                    with patch('lib.infrastructure.main.create_iam_resources', mock_create_iam_resources):
                        with patch('lib.infrastructure.main.create_lambda_resources', mock_create_lambda_resources):
                            with patch('lib.infrastructure.main.create_lambda_invoke_policy', mock_create_lambda_invoke_policy):
                                with patch('lib.infrastructure.main.pulumi', pulumi):
                                    
                                    # Mock config instance
                                    mock_config_instance = Mock()
                                    mock_config_instance.validate_configuration.return_value = True
                                    mock_config_instance.environment_suffix = "test"
                                    mock_config_instance.region = "us-east-1"
                                    mock_config_instance.lambda_timeout = 300
                                    mock_config_instance.lambda_memory = 128
                                    mock_config_instance.allowed_ip_ranges = ["10.0.0.0/8"]
                                    mock_config_instance.get_environment_variables.return_value = {"ENV": "test"}
                                    mock_config_instance.get_tags.return_value = {"Environment": "test"}
                                    mock_config_class.return_value = mock_config_instance
                                    
                                    # Mock resource attributes
                                    mock_lambda["lambda_function"].name = "test-lambda"
                                    mock_lambda["lambda_function"].arn = "arn:aws:lambda:us-east-1:123456789012:function:test-lambda"
                                    mock_storage["input_bucket"].bucket = "test-input-bucket"
                                    mock_storage["output_bucket"].bucket = "test-output-bucket"
                                    mock_storage["input_bucket"].arn = "arn:aws:s3:::test-input-bucket"
                                    mock_storage["output_bucket"].arn = "arn:aws:s3:::test-output-bucket"
                                    mock_iam["lambda_role"].arn = "arn:aws:iam::123456789012:role/test-role"
                                    mock_iam["s3_policy"].arn = "arn:aws:iam::123456789012:policy/test-s3-policy"
                                    mock_iam["logs_policy"].arn = "arn:aws:iam::123456789012:policy/test-logs-policy"
                                    
                                    create_infrastructure()
                                    
                                    # Verify exports were called
                                    assert pulumi.export.call_count >= 10  # Multiple exports
                                    
                                    # Verify specific exports
                                    export_calls = pulumi.export.call_args_list
                                    export_names = [call[0][0] for call in export_calls]
                                    
                                    assert "lambda_function_name" in export_names
                                    assert "lambda_function_arn" in export_names
                                    assert "input_bucket_name" in export_names
                                    assert "output_bucket_name" in export_names
                                    assert "lambda_role_arn" in export_names
                                    assert "environment" in export_names
                                    assert "region" in export_names
    
    def test_infrastructure_configuration_validation(self):
        """Test infrastructure configuration validation."""
        with patch('lib.infrastructure.main.ServerlessConfig') as mock_config_class:
            with patch('lib.infrastructure.main.create_s3_buckets', mock_create_s3_buckets):
                with patch('lib.infrastructure.main.create_s3_lifecycle_policies', mock_create_s3_lifecycle_policies):
                    with patch('lib.infrastructure.main.create_iam_resources', mock_create_iam_resources):
                        with patch('lib.infrastructure.main.create_lambda_resources', mock_create_lambda_resources):
                            with patch('lib.infrastructure.main.create_lambda_invoke_policy', mock_create_lambda_invoke_policy):
                                with patch('lib.infrastructure.main.pulumi', pulumi):
                                    
                                    # Mock config instance with validation failure
                                    mock_config_instance = Mock()
                                    mock_config_instance.validate_configuration.side_effect = ValueError("Invalid configuration")
                                    mock_config_class.return_value = mock_config_instance
                                    
                                    # Should raise the validation error
                                    with pytest.raises(ValueError, match="Invalid configuration"):
                                        create_infrastructure()
    
    def test_infrastructure_resource_dependencies(self):
        """Test infrastructure resource dependencies."""
        with patch('lib.infrastructure.main.ServerlessConfig') as mock_config_class:
            with patch('lib.infrastructure.main.create_s3_buckets', mock_create_s3_buckets):
                with patch('lib.infrastructure.main.create_s3_lifecycle_policies', mock_create_s3_lifecycle_policies):
                    with patch('lib.infrastructure.main.create_iam_resources', mock_create_iam_resources):
                        with patch('lib.infrastructure.main.create_lambda_resources', mock_create_lambda_resources):
                            with patch('lib.infrastructure.main.create_lambda_invoke_policy', mock_create_lambda_invoke_policy):
                                with patch('lib.infrastructure.main.pulumi', pulumi):
                                    
                                    # Mock config instance
                                    mock_config_instance = Mock()
                                    mock_config_instance.validate_configuration.return_value = True
                                    mock_config_class.return_value = mock_config_instance
                                    
                                    result = create_infrastructure()
                                    
                                    # Verify resource dependencies
                                    assert result["config"] == mock_config_instance
                                    assert result["storage"] == mock_storage
                                    assert result["lifecycle_policies"] == mock_lifecycle_policies
                                    assert result["iam"] == mock_iam
                                    assert result["lambda"] == mock_lambda
                                    assert result["lambda_function"] == mock_lambda["lambda_function"]
    
    def test_infrastructure_error_handling(self):
        """Test infrastructure error handling."""
        with patch('lib.infrastructure.main.ServerlessConfig') as mock_config_class:
            with patch('lib.infrastructure.main.create_s3_buckets', side_effect=Exception("S3 creation failed")):
                with patch('lib.infrastructure.main.pulumi', pulumi):
                    
                    # Mock config instance
                    mock_config_instance = Mock()
                    mock_config_instance.validate_configuration.return_value = True
                    mock_config_class.return_value = mock_config_instance
                    
                    # Should raise the S3 creation error
                    with pytest.raises(Exception, match="S3 creation failed"):
                        create_infrastructure()
    
    def test_infrastructure_return_structure(self):
        """Test infrastructure return structure."""
        with patch('lib.infrastructure.main.ServerlessConfig') as mock_config_class:
            with patch('lib.infrastructure.main.create_s3_buckets', mock_create_s3_buckets):
                with patch('lib.infrastructure.main.create_s3_lifecycle_policies', mock_create_s3_lifecycle_policies):
                    with patch('lib.infrastructure.main.create_iam_resources', mock_create_iam_resources):
                        with patch('lib.infrastructure.main.create_lambda_resources', mock_create_lambda_resources):
                            with patch('lib.infrastructure.main.create_lambda_invoke_policy', mock_create_lambda_invoke_policy):
                                with patch('lib.infrastructure.main.pulumi', pulumi):
                                    
                                    # Mock config instance
                                    mock_config_instance = Mock()
                                    mock_config_instance.validate_configuration.return_value = True
                                    mock_config_class.return_value = mock_config_instance
                                    
                                    result = create_infrastructure()
                                    
                                    # Verify return structure
                                    assert isinstance(result, dict)
                                    assert len(result) == 6  # config, storage, lifecycle_policies, iam, lambda, lambda_function
                                    
                                    # Verify all required keys are present
                                    required_keys = ["config", "storage", "lifecycle_policies", "iam", "lambda", "lambda_function"]
                                    for key in required_keys:
                                        assert key in result
                                    
                                    # Verify lambda_function is the same as lambda["lambda_function"]
                                    assert result["lambda_function"] == result["lambda"]["lambda_function"]
    
    def test_infrastructure_modular_design(self):
        """Test infrastructure modular design."""
        with patch('lib.infrastructure.main.ServerlessConfig') as mock_config_class:
            with patch('lib.infrastructure.main.create_s3_buckets', mock_create_s3_buckets):
                with patch('lib.infrastructure.main.create_s3_lifecycle_policies', mock_create_s3_lifecycle_policies):
                    with patch('lib.infrastructure.main.create_iam_resources', mock_create_iam_resources):
                        with patch('lib.infrastructure.main.create_lambda_resources', mock_create_lambda_resources):
                            with patch('lib.infrastructure.main.create_lambda_invoke_policy', mock_create_lambda_invoke_policy):
                                with patch('lib.infrastructure.main.pulumi', pulumi):
                                    
                                    # Mock config instance
                                    mock_config_instance = Mock()
                                    mock_config_instance.validate_configuration.return_value = True
                                    mock_config_class.return_value = mock_config_instance
                                    
                                    result = create_infrastructure()
                                    
                                    # Verify modular design - each component is separate
                                    assert "storage" in result
                                    assert "iam" in result
                                    assert "lambda" in result
                                    
                                    # Verify each module has its own resources
                                    assert "input_bucket" in result["storage"]
                                    assert "output_bucket" in result["storage"]
                                    assert "lambda_role" in result["iam"]
                                    assert "lambda_function" in result["lambda"]
