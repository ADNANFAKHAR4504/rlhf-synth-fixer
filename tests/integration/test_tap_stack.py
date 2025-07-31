"""Integration tests for TapStack."""
import os
import sys
import json

from cdktf import App, Testing
from lib.tap_stack import TapStack
from tap import SecureAwsEnvironment

# Adjust path to import TapStack and SecureAwsEnvironment correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

class TestTurnAroundPromptAPIIntegrationTests:
  """Turn Around Prompt API Integration Tests."""

  def setup_method(self):
    """Set environment variables before each test."""
    os.environ["DEV_ACCOUNT_ID"] = "111111111111" # Mock account ID for dev
    os.environ["PROD_ACCOUNT_ID"] = "222222222222" # Mock account ID for prod

  def teardown_method(self):
    """Clean up environment variables after each test."""
    if "DEV_ACCOUNT_ID" in os.environ:
      del os.environ["DEV_ACCOUNT_ID"]
    if "PROD_ACCOUNT_ID" in os.environ:
      del os.environ["PROD_ACCOUNT_ID"]
  
# ---------- TEST 1 ----------
  def test_s3_bucket_versioning_and_encryption(self):
    """
    Ensure the S3 bucket created by TapStack has versioning enabled
    and uses AES-256 server-side encryption.
    """
    app = App()
    stack = TapStack(
      app,
      "IntegrationTestStackBucket",
      environment_suffix="int",
      aws_region="us-east-1",
    )

    synth_str = Testing.synth(stack)
    synth = json.loads(synth_str)
    
    tap_bucket_config = synth.get("resource", {}).get("aws_s3_bucket", {}).get("tap_bucket")

    assert tap_bucket_config is not None, "tap_bucket resource not found in synthesized output"
    
    assert tap_bucket_config.get("versioning", {}).get("enabled") is True, \
      "S3 bucket versioning should be enabled"

    sse_config = tap_bucket_config.get("server_side_encryption_configuration", {})
    sse_rule = sse_config.get("rule", {})
    sse_default = sse_rule.get("apply_server_side_encryption_by_default", {})
    algorithm = sse_default.get("sse_algorithm")
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
      account_id=os.environ["DEV_ACCOUNT_ID"],
      region="us-east-1",
      environment="test",
    )

    synth_str = Testing.synth(secure_stack)
    synth = json.loads(synth_str)

    no_ssh_sg_config = None
    for _, sg_props in synth.get("resource", {}).get("aws_security_group", {}).items():
      if "no-ssh" in sg_props.get("name", "").lower():
        no_ssh_sg_config = sg_props
        break
    
    assert no_ssh_sg_config is not None, "Expected 'no-SSH' security group to be created"

    ingress_rules = no_ssh_sg_config.get("ingress", [])
    assert len(ingress_rules) == 0, "'no-SSH' security group must have no ingress rules"

# ---------- TEST 3 ----------
  def test_secure_environment_kms_encryption(self):
    """
    Test that KMS keys are created with proper rotation settings.
    """
    app = App()
    secure_stack = SecureAwsEnvironment(
      app,
      "KMSTestStack",
      account_id=os.environ["DEV_ACCOUNT_ID"],
      region="us-east-1",
      environment="test",
    )
    
    synth_str = Testing.synth(secure_stack)
    synth = json.loads(synth_str)

    kms_key_config = None
    for _, key_props in synth.get("resource", {}).get("aws_kms_key", {}).items():
      kms_key_config = key_props
      break

    assert kms_key_config is not None, "Expected KMS key to be created"
    assert kms_key_config.get("enable_key_rotation") is True, \
      "KMS key should have rotation enabled" # Changed '== True' to 'is True'

# ---------- TEST 4 ----------
  def test_s3_public_access_block(self):
    """
    Test that S3 buckets have PublicAccessBlock enabled.
    """
    app = App()
    secure_stack = SecureAwsEnvironment(
      app,
      "S3SecurityTestStack",
      account_id=os.environ["DEV_ACCOUNT_ID"],
      region="us-east-1",
      environment="test",
    )
    
    synth_str = Testing.synth(secure_stack)
    synth = json.loads(synth_str)

    public_access_block_config = None
    for _, block_props in synth.get("resource", {}).get("aws_s3_bucket_public_access_block",\
      {}).items():
      public_access_block_config = block_props
      break

    assert public_access_block_config is not None, "Expected S3 PublicAccessBlock to be created"
    assert public_access_block_config.get("block_public_acls") is \
      True, "Should block public ACLs"
    assert public_access_block_config.get("block_public_policy") is True, \
      "Should block public bucket policies"
    assert public_access_block_config.get("ignore_public_acls") is True, \
      "Should ignore public ACLs"
    assert public_access_block_config.get("restrict_public_buckets") is True,\
      "Should restrict public buckets"

# ---------- TEST 5 ----------
  def test_guardduty_enabled(self):
    """
    Test that GuardDuty detector is enabled in each region.
    """
    app = App()
    secure_stack = SecureAwsEnvironment(
      app,
      "GuardDutyTestStack",
      account_id=os.environ["DEV_ACCOUNT_ID"],
      region="us-east-1",
      environment="test",
    )
    
    synth_str = Testing.synth(secure_stack)
    synth = json.loads(synth_str)

    guardduty_detector_config = None
    for _, detector_props in synth.get("resource", {}).get("aws_guardduty_detector", {}).items():
      guardduty_detector_config = detector_props
      break

    assert guardduty_detector_config is not None, "Expected GuardDuty detector to be created"
    assert guardduty_detector_config.get("enable") is True, "GuardDuty detector should be enabled"

# ---------- TEST 6 ----------
  def test_rds_encryption_and_networking(self):
    """
    Test that RDS instances are properly encrypted and use DB subnet groups.
    """
    app = App()
    secure_stack = SecureAwsEnvironment(
      app,
      "RDSTestStack",
      account_id=os.environ["DEV_ACCOUNT_ID"],
      region="us-east-1",
      environment="test",
    )
    
    synth_str = Testing.synth(secure_stack)
    synth = json.loads(synth_str)

    rds_instance_config = None
    for _, instance_props in synth.get("resource", {}).get("aws_db_instance", {}).items(): 
      rds_instance_config = instance_props
      break

    db_subnet_group_config = None
    for _, subnet_group_props in synth.get("resource", {}).get("aws_db_subnet_group", {}).items():
      db_subnet_group_config = subnet_group_props
      break

    assert rds_instance_config is not None, "Expected RDS instance to be created"
    assert db_subnet_group_config is not None, \
      "Expected DB subnet group to be created"
    
    assert rds_instance_config.get("storage_encrypted") is True, \
      "RDS should be encrypted" 
    assert rds_instance_config.get("db_subnet_group_name") is not None, \
      "RDS should use a DB subnet group"
