"""Unit tests for TAP Stack."""
import os
import sys, json
from cdktf import App, Testing
from lib.tap_stack import TapStack

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

class TestStackStructure:
  """Test suite for Stack Structure."""

  def setup_method(self):
    """Reset mocks before each test."""
    # Clear any previous test state if needed
    pass

  def test_tap_stack_instantiates_successfully_via_props(self):
    """TapStack instantiates successfully via props."""
    app = App() # Instantiate App directly in the test method
    stack = TapStack(
      app,
      "TestTapStackWithProps",
      environment_suffix="prod",
      state_bucket="custom-state-bucket",
      state_bucket_region="us-west-2",
      aws_region="us-west-2",
    )

    assert stack is not None

  def test_tap_stack_uses_default_values_when_no_props_provided(self):
    """TapStack uses default values when no props provided."""
    app = App() # Instantiate App directly in the test method
    stack = TapStack(app, "TestTapStackDefault")

    assert stack is not None


class TestTapStack:
  def setup_method(self):
    # No need to set self.app here anymore
    pass

  def test_tap_stack_instantiates_successfully_with_props(self):
    app = App() # Instantiate App directly in the test method
    stack = TapStack(
      app,
      "TestTapStack",
      environment_suffix="prod",
      state_bucket="my-state-bucket",
      state_bucket_region="us-west-2",
      aws_region="us-west-2",
      default_tags={
        "Environment": "prod",
        "Project": "TAP",
        "Owner": "DevOps"
      }
    )
    assert stack is not None

  def test_tap_stack_s3_bucket_created(self):
    app = App()
    stack = TapStack(app, "StackWithBucket")
    synth_str = Testing.synth(stack)
    synth = json.loads(synth_str)
    resources = synth.get("resource", {})
    assert any("aws_s3_bucket" in k for k in resources), "S3 bucket not created"

  def test_s3_bucket_has_versioning_and_encryption(self):
    app = App()
    stack = TapStack(app, "SecureS3Stack", environment_suffix="test")
    synth_str = Testing.synth(stack)
    synth = json.loads(synth_str)

    # Directly look for the 'tap_bucket' resource
    tap_bucket_config = synth.get("resource", {}).get("aws_s3_bucket", {}).get("tap_bucket")

    assert tap_bucket_config is not None, "tap_bucket resource not found"
    assert tap_bucket_config.get("versioning", {}).get("enabled") is True
    assert tap_bucket_config.get("server_side_encryption_configuration", {}) \
                          .get("rule", {}) \
                          .get("apply_server_side_encryption_by_default", {}) \
                          .get("sse_algorithm") == "AES256"

  def test_s3_backend_uses_lockfile(self):
    app = App()
    stack = TapStack(app, "LockTestStack", environment_suffix="dev")
    synth_str = Testing.synth(stack)
    synth = json.loads(synth_str)
    assert synth["terraform"]["backend"]["s3"]["use_lockfile"] is True

  def test_aws_provider_is_configured(self):
    app = App()
    stack = TapStack(app, "ProviderTestStack", aws_region="eu-central-1")
    synth_str = Testing.synth(stack)
    synth = json.loads(synth_str)
    providers = synth.get("provider", {})
    assert "aws" in providers
    assert providers["aws"][0]["region"] == "eu-central-1"

  def test_secure_aws_environment_stacks_are_instantiated(self):
    app = App()
    stack = TapStack(app, "NestedStacksTest")
    synth_str = Testing.synth(stack) 
    synth = json.loads(synth_str)

    # --- DEBUGGING PRINT ---
    print("\n--- Synthesized Terraform JSON for NestedStacksTest (Full App) ---")
    print(json.dumps(synth, indent=2))
    print("------------------------------------------------------------------\n")
    # --- END DEBUGGING PRINT ---

    # Define the expected full Terraform logical IDs and their corresponding Name tags
    expected_vpcs_and_tags = {
        "aws_vpc.SecureStack-dev-us-east-1_Vpc-us-east-1": "main-vpc-dev-us-east-1",
        "aws_vpc.SecureStack-dev-euwest1_Vpc-eu-west-1": "main-vpc-dev-eu-west-1",
        "aws_vpc.SecureStack-prod-us-east-1_Vpc-us-east-1": "main-vpc-prod-us-east-1",
        "aws_vpc.SecureStack-prod-euwest1_Vpc-eu-west-1": "main-vpc-prod-eu-west-1",
    }

    found_vpcs = {key: False for key in expected_vpcs_and_tags.keys()}

    # Iterate through all resources in the synthesized output
    resources_by_type = synth.get("resource", {})

    for tf_logical_id, expected_name_tag in expected_vpcs_and_tags.items():
        # Split the logical ID to get the resource type (e.g., 'aws_vpc') and the specific ID
        resource_type_prefix = tf_logical_id.split('.')[0]
        specific_logical_id = tf_logical_id.split('.', 1)[1] # Get everything after the first dot

        if resource_type_prefix in resources_by_type and \
           specific_logical_id in resources_by_type[resource_type_prefix]:
            res_config = resources_by_type[resource_type_prefix][specific_logical_id]
            actual_name_tag = res_config.get("tags", {}).get("Name")
            if actual_name_tag == expected_name_tag:
                found_vpcs[tf_logical_id] = True
            else:
                print(f"Mismatch for {tf_logical_id}: Expected Name='{expected_name_tag}', Got='{actual_name_tag}'")
        else:
            print(f"VPC with logical ID '{tf_logical_id}' not found in synthesized output.")

    # Assert that all expected VPCs were found and had the correct Name tag
    assert found_vpcs["aws_vpc.SecureStack-dev-us-east-1_Vpc-us-east-1"], \
        "VPC for dev/us-east-1 SecureAwsEnvironment not found or tag mismatch"
    assert found_vpcs["aws_vpc.SecureStack-dev-euwest1_Vpc-eu-west-1"], \
        "VPC for dev/eu-west-1 SecureAwsEnvironment not found or tag mismatch"
    assert found_vpcs["aws_vpc.SecureStack-prod-us-east-1_Vpc-us-east-1"], \
        "VPC for prod/us-east-1 SecureAwsEnvironment not found or tag mismatch"
    assert found_vpcs["aws_vpc.SecureStack-prod-euwest1_Vpc-eu-west-1"], \
        "VPC for prod/eu-west-1 SecureAwsEnvironment not found or tag mismatch"
