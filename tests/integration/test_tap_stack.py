"""Integration tests for TapStack."""
import os
from cdktf import App
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.security_group import SecurityGroup

from lib.tap_stack import TapStack
from tap import SecureAwsEnvironment

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

# ---------- TEST 3 ----------
  def test_multi_region_deployment(self):
    """
    Test that SecureAwsEnvironment stacks are created for multiple regions.
    """
    # Mock environment variables for the test
    os.environ["DEV_ACCOUNT_ID"] = "123456789012"
    os.environ["PROD_ACCOUNT_ID"] = "123456789013"
    
    app = App()
    
    # Create a TapStack which should instantiate SecureAwsEnvironment stacks
    stack = TapStack(
      app,
      "MultiRegionTestStack",
      environment_suffix="test",
      aws_region="us-east-1",
    )
    
    # Verify the main stack was created
    assert stack is not None
    
    # Check that child stacks were created for each environment/region combination
    app_children = app.node.children
    secure_stacks = [
      child for child in app_children 
      if hasattr(child, 'node') and 'SecureStack' in child.node.id
    ]
    
    # Should have stacks for: dev-useast1, dev-euwest1, prod-useast1, prod-euwest1
    expected_stack_count = 4
    assert len(secure_stacks) == expected_stack_count, f"Expected {expected_stack_count} SecureAwsEnvironment stacks, found {len(secure_stacks)}"

# ---------- TEST 4 ----------
  def test_secure_environment_kms_encryption(self):
    """
    Test that KMS keys are created with proper rotation settings.
    """
    from cdktf_cdktf_provider_aws.kms_key import KmsKey
    
    app = App()
    secure_stack = SecureAwsEnvironment(
      app,
      "KMSTestStack",
      account_id="123456789012",
      region="us-east-1",
      environment="test",
    )
    
    # Find KMS key in the stack
    kms_key = next(
      (child for child in secure_stack.node.children if isinstance(child, KmsKey)),
      None,
    )
    
    assert kms_key is not None, "Expected KMS key to be created"
    assert kms_key.enable_key_rotation is True, "KMS key should have rotation enabled"

# ---------- TEST 5 ----------
  def test_s3_public_access_block(self):
    """
    Test that S3 buckets have PublicAccessBlock enabled.
    """
    from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
    
    app = App()
    secure_stack = SecureAwsEnvironment(
      app,
      "S3SecurityTestStack",
      account_id="123456789012",
      region="us-east-1",
      environment="test",
    )
    
    # Find S3 public access block
    public_access_block = next(
      (child for child in secure_stack.node.children if isinstance(child, S3BucketPublicAccessBlock)),
      None,
    )
    
    assert public_access_block is not None, "Expected S3 PublicAccessBlock to be created"
    assert public_access_block.block_public_acls is True, "Should block public ACLs"
    assert public_access_block.block_public_policy is True, "Should block public policies"
    assert public_access_block.ignore_public_acls is True, "Should ignore public ACLs"
    assert public_access_block.restrict_public_buckets is True, "Should restrict public buckets"

# ---------- TEST 6 ----------
  def test_guardduty_enabled(self):
    """
    Test that GuardDuty detector is enabled in each region.
    """
    from cdktf_cdktf_provider_aws.guardduty_detector import GuarddutyDetector
    
    app = App()  
    secure_stack = SecureAwsEnvironment(
      app,
      "GuardDutyTestStack",
      account_id="123456789012",
      region="us-east-1",
      environment="test",
    )
    
    # Find GuardDuty detector
    guardduty_detector = next(
      (child for child in secure_stack.node.children if isinstance(child, GuarddutyDetector)),
      None,
    )
    
    assert guardduty_detector is not None, "Expected GuardDuty detector to be created"
    assert guardduty_detector.enable is True, "GuardDuty detector should be enabled"

# ---------- TEST 7 ----------
  def test_rds_encryption_and_networking(self):
    """
    Test that RDS instances are properly encrypted and use DB subnet groups.
    """
    from cdktf_cdktf_provider_aws.db_instance import DbInstance
    from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
    
    app = App()
    secure_stack = SecureAwsEnvironment(
      app,
      "RDSTestStack", 
      account_id="123456789012",
      region="us-east-1",
      environment="test",
    )
    
    # Find RDS instance
    rds_instance = next(
      (child for child in secure_stack.node.children if isinstance(child, DbInstance)),
      None,
    )
    
    # Find DB subnet group
    db_subnet_group = next(
      (child for child in secure_stack.node.children if isinstance(child, DbSubnetGroup)),
      None,
    )
    
    assert rds_instance is not None, "Expected RDS instance to be created"
    assert db_subnet_group is not None, "Expected DB subnet group to be created"
    
    # Verify encryption settings
    assert rds_instance.storage_encrypted is True, "RDS should be encrypted"
    assert rds_instance.manage_master_user_password is True, "RDS should use Secrets Manager for password"
    
    # Verify networking
    assert rds_instance.db_subnet_group_name is not None, "RDS should use DB subnet group"
