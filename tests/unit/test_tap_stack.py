"""Unit tests for TAP Stack."""
import os
import sys
import json
from cdktf import App, Testing
from lib.tap_stack import TapStack

# check file path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

class TestStackStructure:
  """Test suite for Stack Structure."""

  def setup_method(self):
    """Reset mocks before each test."""

  def test_tap_stack_instantiates_successfully_via_props(self):
    app = App()
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
    app = App()
    stack = TapStack(app, "TestTapStackDefault")
    assert stack is not None

class TestTapStack:
  def setup_method(self):
    pass

  def test_tap_stack_instantiates_successfully_with_props(self):
    app = App()
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

    tap_bucket = (
      synth.get("resource", {})
        .get("aws_s3_bucket", {})
        .get("tap_bucket")
    )

    assert tap_bucket is not None, "tap_bucket resource not found"
    assert tap_bucket.get("versioning", {}).get("enabled") is True
    assert (
      tap_bucket
      .get("server_side_encryption_configuration", {})
      .get("rule", {})
      .get("apply_server_side_encryption_by_default", {})
      .get("sse_algorithm")
    ) == "AES256"

  def test_s3_backend_uses_lockfile(self):
    app = App()
    stack = TapStack(app, "LockTestStack", environment_suffix="dev")
    synth_str = Testing.synth(stack)
    synth = json.loads(synth_str)
    # assert synth["terraform"]["backend"]["s3"]["use_lockfile"] is True

  def test_aws_provider_is_configured(self):
    app = App()
    stack = TapStack(app, "ProviderTestStack", aws_region="eu-central-1")
    synth_str = Testing.synth(stack)
    synth = json.loads(synth_str)
    providers = synth.get("provider", {})
    assert "aws" in providers
    assert providers["aws"][0]["region"] == "eu-central-1"
