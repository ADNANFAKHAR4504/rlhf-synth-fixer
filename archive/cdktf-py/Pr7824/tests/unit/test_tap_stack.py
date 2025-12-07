"""Unit tests for TapStack."""

import os
import json
import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


@pytest.fixture
def stack_config():
    """Provide stack configuration for testing."""
    return {
        "environment_suffix": "test123",
        "aws_region": "us-east-1",
        "state_bucket_region": "us-east-1",
        "state_bucket": "iac-rlhf-tf-states",
        "default_tags": {
            "tags": {
                "Environment": "test",
                "Repository": "iac-test-automations",
                "Team": "synth",
            }
        },
    }


@pytest.fixture
def setup_environment():
    """Setup environment variables for testing."""
    # Save original CI value if it exists
    original_ci = os.environ.get("CI")
    original_github_actions = os.environ.get("GITHUB_ACTIONS")
    
    # Set required environment variables for testing
    os.environ["ENVIRONMENT"] = "dev"
    os.environ["TF_VAR_db_username"] = "testuser"
    os.environ["TF_VAR_db_password"] = "TestPassword123!"  # Test-only password for unit tests
    
    # Unset CI flags for unit tests to allow test password fallback
    if "CI" in os.environ:
        del os.environ["CI"]
    if "GITHUB_ACTIONS" in os.environ:
        del os.environ["GITHUB_ACTIONS"]
    
    yield
    
    # Cleanup - restore original values
    if "ENVIRONMENT" in os.environ:
        del os.environ["ENVIRONMENT"]
    if "TF_VAR_db_username" in os.environ:
        del os.environ["TF_VAR_db_username"]
    if "TF_VAR_db_password" in os.environ:
        del os.environ["TF_VAR_db_password"]
    
    # Restore original CI values
    if original_ci is not None:
        os.environ["CI"] = original_ci
    elif "CI" in os.environ:
        del os.environ["CI"]
        
    if original_github_actions is not None:
        os.environ["GITHUB_ACTIONS"] = original_github_actions
    elif "GITHUB_ACTIONS" in os.environ:
        del os.environ["GITHUB_ACTIONS"]


def parse_synthesized_stack(stack):
    """Helper function to parse synthesized CDKTF stack."""
    synth_output = Testing.synth(stack)
    # Testing.synth returns a JSON string, parse it
    if isinstance(synth_output, str):
        return json.loads(synth_output)
    return synth_output


class TestTapStack:
    """Test suite for TapStack infrastructure."""

    def test_stack_synthesis(self, stack_config, setup_environment):
        """Test that the stack synthesizes without errors."""
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)
        assert synthesized is not None

    def test_stack_has_aws_provider(self, stack_config, setup_environment):
        """Test that AWS provider is configured."""
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        # Check that provider configuration exists
        assert "provider" in synthesized
        assert "aws" in synthesized["provider"]

    def test_stack_has_s3_backend(self, stack_config, setup_environment):
        """Test that S3 backend is configured."""
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        # Check that backend configuration exists
        assert "terraform" in synthesized
        assert "backend" in synthesized["terraform"]
        assert "s3" in synthesized["terraform"]["backend"]

    def test_stack_creates_security_groups(self, stack_config, setup_environment):
        """Test that security groups are created."""
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        # Check for security group resources
        resources = synthesized.get("resource", {})
        assert "aws_security_group" in resources

    def test_stack_creates_iam_roles(self, stack_config, setup_environment):
        """Test that IAM roles are created."""
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        # Check for IAM role resources
        resources = synthesized.get("resource", {})
        assert "aws_iam_role" in resources

    def test_stack_creates_lambda_function(self, stack_config, setup_environment):
        """Test that Lambda function is created."""
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        # Check for Lambda function resource
        resources = synthesized.get("resource", {})
        assert "aws_lambda_function" in resources

    def test_stack_creates_rds_instance(self, stack_config, setup_environment):
        """Test that RDS instance is created."""
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        # Check for RDS instance resource
        resources = synthesized.get("resource", {})
        assert "aws_db_instance" in resources

    def test_stack_creates_dynamodb_table(self, stack_config, setup_environment):
        """Test that DynamoDB table is created."""
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        # Check for DynamoDB table resource
        resources = synthesized.get("resource", {})
        assert "aws_dynamodb_table" in resources

    def test_stack_creates_s3_bucket(self, stack_config, setup_environment):
        """Test that S3 bucket is created."""
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        # Check for S3 bucket resource
        resources = synthesized.get("resource", {})
        assert "aws_s3_bucket" in resources

    def test_stack_creates_api_gateway(self, stack_config, setup_environment):
        """Test that API Gateway is created."""
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        # Check for API Gateway resources
        resources = synthesized.get("resource", {})
        assert "aws_api_gateway_rest_api" in resources

    def test_stack_creates_cloudwatch_log_groups(self, stack_config, setup_environment):
        """Test that CloudWatch Log Groups are created."""
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        # Check for CloudWatch Log Group resources
        resources = synthesized.get("resource", {})
        assert "aws_cloudwatch_log_group" in resources

    def test_stack_has_outputs(self, stack_config, setup_environment):
        """Test that stack defines outputs."""
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        # Check for outputs
        assert "output" in synthesized
        outputs = synthesized["output"]

        # Verify expected outputs exist
        expected_outputs = [
            "api_gateway_url",
            "database_endpoint",
            "dynamodb_table_name",
            "s3_bucket_name",
            "lambda_function_name",
        ]

        for output_name in expected_outputs:
            assert output_name in outputs or any(
                output_name in key for key in outputs.keys()
            )

    def test_environment_suffix_in_resource_names(self, stack_config, setup_environment):
        """Test that environment suffix is used in resource names."""
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        # Get all resources
        resources = synthesized.get("resource", {})

        # Check that environment suffix appears in resource configurations
        suffix = stack_config["environment_suffix"]
        found_suffix = False

        for resource_type, resource_configs in resources.items():
            for resource_name, resource_config in resource_configs.items():
                # Check various name fields
                for field in ["name", "bucket", "function_name", "identifier"]:
                    if field in resource_config and suffix in str(resource_config[field]):
                        found_suffix = True
                        break
                if found_suffix:
                    break
            if found_suffix:
                break

        assert found_suffix, "Environment suffix not found in resource names"

    def test_dev_environment_configuration(self, stack_config, setup_environment):
        """Test dev environment specific configuration."""
        os.environ["ENVIRONMENT"] = "dev"
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        # Check Lambda memory size for dev (should be 256)
        resources = synthesized.get("resource", {})
        lambda_functions = resources.get("aws_lambda_function", {})

        for func_config in lambda_functions.values():
            assert func_config.get("memory_size") == 256

    def test_staging_environment_configuration(self, stack_config, setup_environment):
        """Test staging environment specific configuration."""
        os.environ["ENVIRONMENT"] = "staging"
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        # Check Lambda memory size for staging (should be 512)
        resources = synthesized.get("resource", {})
        lambda_functions = resources.get("aws_lambda_function", {})

        for func_config in lambda_functions.values():
            assert func_config.get("memory_size") == 512

    def test_prod_environment_configuration(self, stack_config, setup_environment):
        """Test prod environment specific configuration."""
        os.environ["ENVIRONMENT"] = "prod"
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        # Check Lambda memory size for prod (should be 1024)
        resources = synthesized.get("resource", {})
        lambda_functions = resources.get("aws_lambda_function", {})

        for func_config in lambda_functions.values():
            assert func_config.get("memory_size") == 1024

    def test_rds_skip_final_snapshot(self, stack_config, setup_environment):
        """Test that RDS instances have skip_final_snapshot enabled."""
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        resources = synthesized.get("resource", {})
        rds_instances = resources.get("aws_db_instance", {})

        for instance_config in rds_instances.values():
            assert instance_config.get("skip_final_snapshot") is True

    def test_s3_force_destroy_enabled(self, stack_config, setup_environment):
        """Test that S3 buckets have force_destroy enabled."""
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        resources = synthesized.get("resource", {})
        s3_buckets = resources.get("aws_s3_bucket", {})

        for bucket_config in s3_buckets.values():
            assert bucket_config.get("force_destroy") is True

    def test_tags_applied_to_resources(self, stack_config, setup_environment):
        """Test that common tags are applied to resources."""
        app = Testing.app()
        stack = TapStack(app, "TestStack", **stack_config)
        synthesized = parse_synthesized_stack(stack)

        resources = synthesized.get("resource", {})

        # Check a sample of resources for tags
        tagged_resources_found = False
        for resource_type, resource_configs in resources.items():
            for resource_config in resource_configs.values():
                if "tags" in resource_config:
                    tags = resource_config["tags"]
                    # Should have Environment, CostCenter, or ManagedBy tags
                    if any(key in tags for key in ["Environment", "CostCenter", "ManagedBy"]):
                        tagged_resources_found = True
                        break
            if tagged_resources_found:
                break

        assert tagged_resources_found, "No resources found with expected tags"

    def test_stack_without_default_tags(self, setup_environment):
        """Test that stack works without default_tags parameter."""
        minimal_config = {
            "environment_suffix": "test456",
            "aws_region": "us-east-1",
            "state_bucket_region": "us-east-1",
            "state_bucket": "iac-rlhf-tf-states",
        }
        app = Testing.app()
        stack = TapStack(app, "TestStack", **minimal_config)
        synthesized = parse_synthesized_stack(stack)
        # Should successfully synthesize even without default_tags
        assert synthesized is not None
        assert "resource" in synthesized
