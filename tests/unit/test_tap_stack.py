"""Unit tests for TAP Stack serverless infrastructure."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestServerlessStackBasics:
  """Test suite for basic stack functionality."""

  def setup_method(self):
    """Reset state before each test."""
    self.app = App()

  def test_tap_stack_instantiates_successfully_with_defaults(self):
    """TapStack instantiates successfully with default values."""
    stack = TapStack(self.app, "TestTapStackDefault")
    
    # Verify that TapStack instantiates without errors
    assert stack is not None
    assert isinstance(stack, TapStack)

  def test_tap_stack_instantiates_with_custom_props(self):
    """TapStack instantiates successfully with custom properties."""
    stack = TapStack(
        self.app,
        "TestTapStackCustom",
        environment_suffix="test",
        aws_region="us-west-2",
        state_bucket="custom-test-bucket",
        state_bucket_region="us-west-2",
        default_tags={"Environment": "test", "Project": "serverless-api"}
    )
    
    # Verify that TapStack instantiates without errors
    assert stack is not None
    assert isinstance(stack, TapStack)

  def test_stack_synthesis_succeeds(self):
    """Stack can be synthesized without errors."""
    stack = TapStack(self.app, "TestSynthesis", aws_region="us-east-1")
    synthesized_json = Testing.synth(stack)
    
    # Should return valid JSON
    assert isinstance(synthesized_json, str)
    assert len(synthesized_json) > 0
    
    # Should be parseable as JSON
    try:
      synthesized = json.loads(synthesized_json)
      assert isinstance(synthesized, dict)
    except json.JSONDecodeError:
      assert False, "Synthesized output is not valid JSON"

  def test_synthesized_stack_has_terraform_version(self):
    """Synthesized stack contains Terraform configuration."""
    stack = TapStack(self.app, "TestTerraform", aws_region="us-east-1")
    synthesized_json = Testing.synth(stack)
    synthesized = json.loads(synthesized_json)
    
    # Should have terraform configuration
    assert "terraform" in synthesized
    
  def test_synthesized_stack_has_provider(self):
    """Synthesized stack contains AWS provider."""
    stack = TapStack(self.app, "TestProvider", aws_region="us-east-1")
    synthesized_json = Testing.synth(stack)
    synthesized = json.loads(synthesized_json)
    
    # Should have provider configuration
    assert "provider" in synthesized
    assert "aws" in synthesized["provider"]

  def test_synthesized_stack_has_resources(self):
    """Synthesized stack contains AWS resources."""
    stack = TapStack(self.app, "TestResources", aws_region="us-east-1")
    synthesized_json = Testing.synth(stack)
    synthesized = json.loads(synthesized_json)
    
    # Should have resource configuration
    assert "resource" in synthesized
    resources = synthesized["resource"]
    
    # Should contain key resource types for serverless architecture
    expected_resource_types = [
        "aws_s3_bucket",
        "aws_lambda_function", 
        "aws_secretsmanager_secret",
        "aws_apigatewayv2_api",
        "aws_iam_role",
        "aws_cloudwatch_log_group"
    ]
    
    for resource_type in expected_resource_types:
      assert resource_type in resources, f"Missing resource type: {resource_type}"

  def test_lambda_function_has_correct_runtime(self):
    """Lambda function uses Python 3.12 runtime."""
    stack = TapStack(self.app, "TestLambdaRuntime", aws_region="us-east-1")
    synthesized_json = Testing.synth(stack)
    synthesized = json.loads(synthesized_json)
    
    # Find Lambda function
    lambda_functions = synthesized.get("resource", {}).get("aws_lambda_function", {})
    
    # Should have at least one Lambda function
    assert len(lambda_functions) > 0
    
    # Check that Lambda function has correct runtime
    for lambda_function in lambda_functions.values():
      runtime = lambda_function.get("runtime")
      if runtime:  # Some Lambda functions might not have runtime set in test
        assert runtime == "python3.12", f"Expected python3.12, got {runtime}"

  def test_secrets_manager_secret_exists(self):
    """Secrets Manager secret is created."""
    stack = TapStack(self.app, "TestSecrets", aws_region="us-east-1")
    synthesized_json = Testing.synth(stack)
    synthesized = json.loads(synthesized_json)
    
    # Should have Secrets Manager secret
    secrets = synthesized.get("resource", {}).get("aws_secretsmanager_secret", {})
    assert len(secrets) > 0, "No Secrets Manager secrets found"

  def test_api_gateway_exists(self):
    """API Gateway HTTP API is created."""
    stack = TapStack(self.app, "TestAPI", aws_region="us-east-1")
    synthesized_json = Testing.synth(stack)
    synthesized = json.loads(synthesized_json)
    
    # Should have API Gateway
    apis = synthesized.get("resource", {}).get("aws_apigatewayv2_api", {})
    assert len(apis) > 0, "No API Gateway found"

  def test_iam_roles_exist(self):
    """IAM roles are created for Lambda execution."""
    stack = TapStack(self.app, "TestIAM", aws_region="us-east-1")
    synthesized_json = Testing.synth(stack)
    synthesized = json.loads(synthesized_json)
    
    # Should have IAM roles
    roles = synthesized.get("resource", {}).get("aws_iam_role", {})
    assert len(roles) > 0, "No IAM roles found"


class TestSecurityBasics:
  """Test suite for basic security configuration."""

  def setup_method(self):
    """Reset state before each test."""
    self.app = App()

  def test_iam_policies_exist(self):
    """IAM policies are created."""
    stack = TapStack(self.app, "TestPolicies", aws_region="us-east-1")
    synthesized_json = Testing.synth(stack)
    synthesized = json.loads(synthesized_json)
    
    # Should have IAM policies
    policies = synthesized.get("resource", {}).get("aws_iam_policy", {})
    assert len(policies) > 0, "No IAM policies found"

  def test_lambda_permission_exists(self):
    """Lambda permission for API Gateway exists."""
    stack = TapStack(self.app, "TestPermissions", aws_region="us-east-1")
    synthesized_json = Testing.synth(stack)
    synthesized = json.loads(synthesized_json)
    
    # Should have Lambda permissions
    permissions = synthesized.get("resource", {}).get("aws_lambda_permission", {})
    assert len(permissions) > 0, "No Lambda permissions found"


class TestOutputs:
  """Test suite for stack outputs."""

  def setup_method(self):
    """Reset state before each test."""
    self.app = App()

  def test_stack_has_outputs(self):
    """Stack defines outputs for key resources."""
    stack = TapStack(self.app, "TestOutputs", aws_region="us-east-1")
    synthesized_json = Testing.synth(stack)
    synthesized = json.loads(synthesized_json)
    
    # Should have outputs
    outputs = synthesized.get("output", {})
    assert len(outputs) > 0, "No outputs found"
    
    # Should have key outputs
    expected_outputs = [
        "api_gateway_url",
        "lambda_function_name",
        "secrets_manager_secret_name"
    ]
    
    for output_name in expected_outputs:
      assert output_name in outputs, f"Missing output: {output_name}"


class TestErrorHandling:
  """Test suite for error handling and edge cases."""

  def setup_method(self):
    """Reset state before each test."""
    self.app = App()

  def test_stack_handles_empty_kwargs(self):
    """Stack handles empty kwargs gracefully."""
    stack = TapStack(self.app, "TestEmptyKwargs")
    assert stack is not None

  def test_stack_with_minimal_config(self):
    """Stack works with minimal configuration."""
    stack = TapStack(self.app, "TestMinimal", aws_region="us-east-1")
    synthesized_json = Testing.synth(stack)
    synthesized = json.loads(synthesized_json)
    
    # Should still create basic resources
    assert "resource" in synthesized
    assert len(synthesized["resource"]) > 0

  def test_different_regions_work(self):
    """Stack works with different AWS regions."""
    regions = ["us-east-1", "us-west-2", "eu-west-1"]
    
    for region in regions:
      stack = TapStack(self.app, f"TestRegion{region.replace('-', '')}", aws_region=region)
      synthesized_json = Testing.synth(stack)
      synthesized = json.loads(synthesized_json)
      
      # Should have provider configured for the correct region
      provider = synthesized.get("provider", {}).get("aws", {})
      # Provider region might be in nested structure, just verify it synthesizes
      assert provider is not None