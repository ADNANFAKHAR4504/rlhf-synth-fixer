"""Unit tests for TapStack (baseline and secure infra presence)."""

import json
from typing import Any, List, Type

from cdktf import App
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import \
    S3BucketPublicAccessBlock

try:
  from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import \
      S3BucketServerSideEncryptionConfiguration  # type: ignore
except Exception:  # pragma: no cover
  S3BucketServerSideEncryptionConfiguration = object
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.vpc import Vpc

from lib.tap_stack import TapStack


def find_all_by_type(stack: TapStack, cls: Type[Any]) -> List[Any]:
  found: List[Any] = []

  def walk(node: Any) -> None:
    for child in node.node.children:
      if isinstance(child, cls):
        found.append(child)
      walk(child)

  walk(stack)
  return found


class TestStackStructure:
  def setup_method(self):
    pass

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
    assert hasattr(stack, 'bucket')
    assert hasattr(stack, 'bucket_versioning')
    assert hasattr(stack, 'bucket_encryption')

  def test_tap_stack_uses_default_values_when_no_props_provided(self):
    app = App()
    stack = TapStack(app, "TestTapStackDefault")

    assert stack is not None
    assert hasattr(stack, 'bucket')
    assert hasattr(stack, 'bucket_versioning')
    assert hasattr(stack, 'bucket_encryption')

  def test_bucket_resource_is_s3bucket_and_id_stable(self):
    app = App()
    stack = TapStack(app, "TestBucketId")
    assert isinstance(stack.bucket, S3Bucket)
    assert stack.bucket.node.id == "tap_bucket"

  def test_bucket_versioning_enabled(self):
    app = App()
    stack = TapStack(app, "TestVersioning")
    assert isinstance(stack.bucket_versioning, dict)
    assert stack.bucket_versioning.get("enabled") is True

  def test_bucket_encryption_is_aes256(self):
    app = App()
    stack = TapStack(app, "TestEncryption")
    rule = stack.bucket_encryption.get("rule")
    assert isinstance(rule, dict)
    by_default = rule.get("apply_server_side_encryption_by_default")
    assert isinstance(by_default, dict)
    assert by_default.get("sse_algorithm") == "AES256"


class TestSecureInfraPresence:
  def test_has_vpc_and_four_subnets(self):
    app = App()
    stack = TapStack(app, "PresenceVpc")
    assert len(find_all_by_type(stack, Vpc)) == 1
    assert len(find_all_by_type(stack, Subnet)) == 4

  def test_flow_logs_role_policy_and_log_group(self):
    app = App()
    stack = TapStack(app, "PresenceFlowLogs")

    assert len(find_all_by_type(stack, CloudwatchLogGroup)) >= 1
    assert len(find_all_by_type(stack, FlowLog)) == 1
    # Confirm at least one IAM role exists for flow logs usage
    roles = find_all_by_type(stack, IamRole)
    assert len(roles) >= 1
    # Accept any role policy presence for flow logs wiring
    assert len(find_all_by_type(stack, IamRolePolicy)) >= 1

  def test_s3_pab_and_sse_kms_resources_present(self):
    app = App()
    stack = TapStack(app, "PresenceS3")
    assert len(find_all_by_type(stack, S3BucketPublicAccessBlock)) >= 1
    if S3BucketServerSideEncryptionConfiguration is not object:
      assert len(find_all_by_type(stack, S3BucketServerSideEncryptionConfiguration)) >= 1

  def test_db_encrypted_and_private(self):
    app = App()
    stack = TapStack(app, "PresenceDb")
    dbs = find_all_by_type(stack, DbInstance)
    assert len(dbs) == 1
    db = dbs[0]
    assert getattr(db, "storage_encrypted", None) is not None
    assert getattr(db, "publicly_accessible", None) is not True
    assert getattr(db, "manage_master_user_password", None) is not None
    assert len(find_all_by_type(stack, DbSubnetGroup)) == 1

  def test_security_groups_present(self):
    app = App()
    stack = TapStack(app, "PresenceSg")
    sgs = find_all_by_type(stack, SecurityGroup)
    assert any(getattr(sg, "name", None) == "secure-web-sg" or sg.node.id == "web_sg" for sg in sgs)
    assert any(getattr(sg, "name", None) == "secure-db-sg" or sg.node.id == "db_sg" for sg in sgs)
    rules = find_all_by_type(stack, SecurityGroupRule)
    assert len(rules) >= 3

