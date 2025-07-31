"""Integration tests for TapStack."""
from cdktf import App #,  Testing

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
      aws_region="us-east-1",
    )

    # Verify basic structure
    assert stack is not None
  
# ---------- TEST 1 ----------
  def test_s3_bucket_versioning_and_encryption(self):
    """
    Ensure the S3 bucket created by TapStack has versioning enabled
    and uses AES-256 server-side encryption.
    """
    os.environ["ENVIRONMENT_SUFFIX"] = "int"
    app = App()
    stack = TapStack(
      app,
      "IntegrationTestStackBucket",
      environment_suffix="int",
      aws_region="us-east-1",
    )

    # Locate the first S3 bucket in the stack
    bucket = next(
      (c for c in stack.node.children if isinstance(c, S3Bucket)),
      None,
    )
    assert bucket is not None, "Expected an S3 bucket to be created"

    # Versioning must be enabled
    assert bucket.versioning["enabled"] is True, "S3 bucket versioning should be enabled"

    # Server-side encryption must use AES-256
    sse_rule = bucket.server_side_encryption_configuration["rule"]
    algorithm = sse_rule["apply_server_side_encryption_by_default"]["sse_algorithm"]
    assert algorithm == "AES256", "S3 bucket must use AES-256 encryption"

# ---------- TEST 2 ----------
  def test_no_ssh_security_group_has_no_ingress(self):
    """
    Validate that the dedicated 'no-SSH' security group has
    **zero** ingress rules (blocking SSH from the internet).
    """
    app = App()
    secure_stack = SecureAwsEnvironment(
      app,
      "SecureEnvTest",
      account_id="111111111111",
      region="us-east-1",
      environment="test",
    )

    # Locate the no-SSH security group
    no_ssh_sg = next(
        (
          sg
          for sg in secure_stack.node.children
          if isinstance(sg, SecurityGroup) and "no-ssh" in sg.name
        ),
        None,
    )
    assert no_ssh_sg is not None, "Expected 'no-SSH' security group to be created"

    # The group should have no ingress rules
    ingress_rules = getattr(no_ssh_sg, "ingress", [])
    assert len(ingress_rules or []) == 0, "'no-SSH' security group must have no ingress rules"
