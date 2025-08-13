# tests/integration/test_tap_stack.py
"""
Integration tests for Task 2 TapStack (Pulumi):
- S3 buckets exist and are KMS-encrypted
- App bucket has server-access logging to logging bucket
- RDS postgres instance is private and encrypted
- IAM default policy is attached to app/db roles
- Naming scheme: tap-app-<env>-<suffix> and tap-logging-<env>-<suffix> share the same <suffix>
"""

import os
import re
import time
import unittest
from typing import Optional, Tuple

import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
  @classmethod
  def setUpClass(cls):
    cls.region = os.getenv("AWS_REGION", "us-east-1")
    cls.environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
    cls.session = boto3.Session(region_name=cls.region)
    cls.s3 = cls.session.client("s3")
    cls.iam = cls.session.client("iam")
    cls.rds = cls.session.client("rds")

    print(
        f"\n[Task 2 Integration] Region={cls.region}, ENV_SUFFIX={cls.environment_suffix}")

    # Resolve buckets once for reuse
    cls.app_bucket, cls.logging_bucket = cls._find_task2_buckets()

    print(f"[Task 2 Integration] App bucket: {cls.app_bucket or 'NOT FOUND'}")
    print(
        f"[Task 2 Integration] Logging bucket: {cls.logging_bucket or 'NOT FOUND'}")

  @classmethod
  def _bucket_in_region(cls, bucket: str) -> bool:
    """Return True if bucket is in the test region (or None for us-east-1)."""
    if not bucket:
      return False
    try:
      resp = cls.s3.get_bucket_location(Bucket=bucket)
      loc = resp.get("LocationConstraint")
      # For us-east-1, AWS returns None
      return (loc is None and cls.region == "us-east-1") or (loc == cls.region)
    except ClientError:
      return False

  @classmethod
  def _find_task2_buckets(cls) -> Tuple[Optional[str], Optional[str]]:
    """
    Find app and logging buckets by Task 2 naming scheme:
    - tap-app-<env>-<suffix>
    - tap-logging-<env>-<same suffix>
    """
    try:
      buckets = cls.s3.list_buckets().get("Buckets", [])
    except ClientError:
      return None, None

    env = cls.environment_suffix
    app_pat = re.compile(rf"^tap-app-{re.escape(env)}-(.+)$")
    log_pat = re.compile(rf"^tap-logging-{re.escape(env)}-(.+)$")

    candidates_app = []
    candidates_log = []

    for b in buckets:
      name = b.get("Name")
      if not name:
        continue
      if app_pat.match(name) and cls._bucket_in_region(name):
        candidates_app.append(name)
      if log_pat.match(name) and cls._bucket_in_region(name):
        candidates_log.append(name)

    # Find a pair that shares the same suffix
    for a in candidates_app:
      m_app = app_pat.match(a)
      if not m_app:
        continue
      a_suffix = m_app.group(1)
      for l in candidates_log:
        m_log = log_pat.match(l)
        if m_log and m_log.group(1) == a_suffix:
          return a, l

    return (candidates_app[0] if candidates_app else None,
            candidates_log[0] if candidates_log else None)

  def _skip_if_no_deployment(self):
    if not self.app_bucket or not self.logging_bucket:
      self.skipTest("Task 2 deployment not detected (buckets missing)")

  # ---------- Tests ----------

  def test_01_s3_buckets_exist_and_encrypted(self):
    """Both buckets exist in region and have KMS default encryption."""
    self._skip_if_no_deployment()

    for bucket in (self.app_bucket, self.logging_bucket):
      self.assertTrue(bucket, "Bucket name is None")
      try:
        enc = self.s3.get_bucket_encryption(Bucket=bucket)
        rules = enc.get("ServerSideEncryptionConfiguration",
                        {}).get("Rules", [])
        algos = [
            r.get("ApplyServerSideEncryptionByDefault", {}).get("SSEAlgorithm")
            for r in rules
        ]
        self.assertIn("aws:kms", algos,
                      f"Bucket {bucket} not using KMS SSE by default")
      except ClientError as e:
        self.fail(f"Failed to get bucket encryption for {bucket}: {e}")

  def test_02_app_bucket_logging_configured(self):
    """App bucket must log to the logging bucket with the expected prefix."""
    self._skip_if_no_deployment()

    logging_cfg = None
    for _ in range(5):
      try:
        resp = self.s3.get_bucket_logging(Bucket=self.app_bucket)
        logging_cfg = resp.get("LoggingEnabled") if resp else None
        if logging_cfg:
          break
      except ClientError:
        pass
      time.sleep(2)

    self.assertIsNotNone(
        logging_cfg, "Server access logging not enabled on app bucket yet")

    if logging_cfg:
      target_bucket = logging_cfg.get("TargetBucket")
      target_prefix = logging_cfg.get("TargetPrefix", "")
      self.assertEqual(
          target_bucket, self.logging_bucket,
          f"Logging TargetBucket must be the logging bucket ({self.logging_bucket})"
      )
      self.assertTrue(
          isinstance(target_prefix, str) and target_prefix.startswith(
              "app-bucket-logs/"),
          f"Unexpected TargetPrefix: {target_prefix}"
      )

  def test_03_rds_instance_private_and_encrypted(self):
    """At least one RDS postgres instance for this stack is private and encrypted."""
    try:
      paginator = self.rds.get_paginator("describe_db_instances")
      found_ok = False
      for page in paginator.paginate():
        for db in page.get("DBInstances", []):
          if db.get("Engine") != "postgres":
            continue
          if db.get("DBName") != "appdb":
            continue
          if not db.get("StorageEncrypted"):
            continue
          if db.get("PubliclyAccessible"):
            continue
          self.assertTrue(db.get("KmsKeyId"),
                          "RDS instance missing KMS Key ID")
          found_ok = True
          break
        if found_ok:
          break
      self.assertTrue(
          found_ok, "No matching private, encrypted postgres RDS instance found")
    except ClientError as e:
      self.fail(f"Failed describing RDS instances: {e}")

  def test_04_iam_policy_attached_to_roles(self):
    """Default IAM policy must be attached to app-role-dev and db-role-dev."""
    role_names = ["app-role-dev", "db-role-dev"]
    policy_name = "default-policy-dev"

    try:
      paginator = self.iam.get_paginator("list_policies")
      policy_arn = None
      for page in paginator.paginate(Scope="Local"):
        for p in page.get("Policies", []):
          if p.get("PolicyName") == policy_name:
            policy_arn = p.get("Arn")
            break
        if policy_arn:
          break

      self.assertIsNotNone(
          policy_arn, f"Policy {policy_name} not found in account")

      if policy_arn:
        for rn in role_names:
          attached = self.iam.list_attached_role_policies(
              RoleName=rn).get("AttachedPolicies", [])
          attached_arns = [a.get("PolicyArn") for a in attached]
          self.assertIn(
              policy_arn, attached_arns,
              f"Policy {policy_name} not attached to role {rn}"
          )
    except ClientError as e:
      self.fail(f"IAM check failed: {e}")

  def test_05_bucket_naming_conventions(self):
    """Validate naming pattern and shared suffix."""
    self._skip_if_no_deployment()

    env = self.environment_suffix
    self.assertTrue(
        isinstance(self.app_bucket, str) and self.app_bucket.startswith(
            f"tap-app-{env}-"),
        f"App bucket name invalid: {self.app_bucket}"
    )
    self.assertTrue(
        isinstance(self.logging_bucket, str) and self.logging_bucket.startswith(
            f"tap-logging-{env}-"),
        f"Logging bucket name invalid: {self.logging_bucket}"
    )

    app_suffix = self.app_bucket.split(
        f"tap-app-{env}-", 1)[-1] if self.app_bucket else ""
    log_suffix = self.logging_bucket.split(
        f"tap-logging-{env}-", 1)[-1] if self.logging_bucket else ""
    self.assertEqual(
        app_suffix, log_suffix,
        f"App and logging bucket suffixes should match ({app_suffix} != {log_suffix})"
    )
