import re
import time
import unittest
from typing import Optional, Tuple, Any, Dict, List

import boto3
from botocore.exceptions import ClientError


def _safe_get(d: Optional[Dict[str, Any]], key: str, default=None):
  return d.get(key, default) if isinstance(d, dict) else default


def _safe_get_list(d: Optional[Dict[str, Any]], key: str) -> List[Any]:
  val = _safe_get(d, key, [])
  return val if isinstance(val, list) else []


def _safe_get_str(d: Optional[Dict[str, Any]], key: str) -> str:
  val = _safe_get(d, key, "")
  return val if isinstance(val, str) else ""


class TestTapStackIntegration(unittest.TestCase):
  @classmethod
  def setUpClass(cls):
    cls.session = boto3.Session(region_name="us-east-1")
    cls.s3 = cls.session.client("s3")
    cls.rds = cls.session.client("rds")
    cls.iam = cls.session.client("iam")

    cls.app_bucket, cls.logging_bucket, cls.env_in_name, cls.stack_suffix = cls._discover_buckets()

    cls.default_policy_name = f"default-policy-{cls.env_in_name}" if cls.env_in_name else None
    cls.app_role_expected_prefix = f"app-role-{cls.env_in_name}" if cls.env_in_name else None
    cls.db_role_expected_prefix = f"db-role-{cls.env_in_name}" if cls.env_in_name else None

  @classmethod
  def _discover_buckets(cls) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
    try:
      all_buckets = _safe_get_list(cls.s3.list_buckets(), "Buckets")
    except ClientError as e:
      print(f"[Discovery] list_buckets failed: {e}")
      return None, None, None, None

    pat = re.compile(
        r"^tap-(?P<kind>app|logging)-(?P<env>[a-z0-9\-]+)-(?P<suffix>[a-z0-9\-]+)$")
    apps, logs = {}, {}
    for b in all_buckets:
      name = _safe_get_str(b, "Name")
      if not name:
        continue
      m = pat.match(name)
      if not m:
        continue
      kind = m.group("kind")
      env = m.group("env")
      suffix = m.group("suffix")
      if kind == "app":
        apps[(env, suffix)] = name
      elif kind == "logging":
        logs[(env, suffix)] = name

    for key in apps.keys():
      if key in logs:
        return apps[key], logs[key], key[0], key[1]

    return next(iter(apps.values()), None), next(iter(logs.values()), None), None, None

  def test_01_buckets_exist_and_kms_encrypted(self):
    self.assertTrue(self.app_bucket, "App bucket not discovered")
    self.assertTrue(self.logging_bucket, "Logging bucket not discovered")

    for bucket in (self.app_bucket, self.logging_bucket):
      try:
        enc = self.s3.get_bucket_encryption(Bucket=bucket)
      except ClientError as e:
        self.fail(f"Failed to fetch encryption for {bucket}: {e}")

      sse_cfg = _safe_get(enc, "ServerSideEncryptionConfiguration", {})
      rules = _safe_get_list(sse_cfg, "Rules")
      algos = []
      for r in rules:
        default_rule = _safe_get(r, "ApplyServerSideEncryptionByDefault", {})
        algo = _safe_get_str(default_rule, "SSEAlgorithm")
        if algo:
          algos.append(algo)

      self.assertIn("aws:kms", algos,
                    f"Bucket {bucket} is not using KMS SSE by default")

  def test_02_app_bucket_logging_to_logging_bucket(self):
    self.assertTrue(self.app_bucket, "App bucket not discovered")
    self.assertTrue(self.logging_bucket, "Logging bucket not discovered")

    logging_cfg = None
    for _ in range(6):
      try:
        resp = self.s3.get_bucket_logging(Bucket=self.app_bucket)
        logging_cfg = _safe_get(resp, "LoggingEnabled")
        if logging_cfg:
          break
      except ClientError:
        pass
      time.sleep(2)

    self.assertIsInstance(
        logging_cfg, dict, "Server access logging not enabled on app bucket")
    target_bucket = _safe_get_str(logging_cfg, "TargetBucket")
    target_prefix = _safe_get_str(logging_cfg, "TargetPrefix")
    self.assertEqual(target_bucket, self.logging_bucket)
    self.assertTrue(target_prefix.startswith("app-bucket-logs/"))

  def test_03_rds_postgres_private_and_encrypted(self):
    try:
      paginator = self.rds.get_paginator("describe_db_instances")
    except Exception as e:
      self.fail(f"Failed to get RDS paginator: {e}")

    found = False
    try:
      for page in paginator.paginate():
        for db in _safe_get_list(page, "DBInstances"):
          if _safe_get_str(db, "Engine") != "postgres":
            continue
          if _safe_get_str(db, "DBName") != "appdb":
            continue
          if not _safe_get(db, "StorageEncrypted", False):
            continue
          if _safe_get(db, "PubliclyAccessible", True):
            continue
          self.assertTrue(_safe_get_str(db, "KmsKeyId"),
                          "Encrypted DB must have a KMS KeyId")
          found = True
          break
        if found:
          break
    except ClientError as e:
      self.fail(f"RDS describe failed: {e}")

    self.assertTrue(
        found, "No matching private, encrypted Postgres 'appdb' instance found")

  def test_04_iam_default_policy_attached_to_app_and_db_roles(self):
    self.assertTrue(self.env_in_name,
                    "Could not infer <env> from bucket names")
    expected_policy_name = f"default-policy-{self.env_in_name}"

    policy_arn = None
    try:
      paginator = self.iam.get_paginator("list_policies")
      for page in paginator.paginate(Scope="Local"):
        for p in _safe_get_list(page, "Policies"):
          if _safe_get_str(p, "PolicyName") == expected_policy_name:
            policy_arn = _safe_get_str(p, "Arn")
            break
        if policy_arn:
          break
    except ClientError as e:
      self.fail(f"IAM list_policies failed: {e}")

    self.assertTrue(policy_arn, f"Policy {expected_policy_name} not found")

    app_role_ok, db_role_ok = False, False
    try:
      roles = []
      paginator = self.iam.get_paginator("list_roles")
      for page in paginator.paginate():
        roles.extend(_safe_get_list(page, "Roles"))

      def _has_policy(role_name: str) -> bool:
        try:
          attached = self.iam.list_attached_role_policies(RoleName=role_name)
          attached_arns = [
              _safe_get_str(a, "PolicyArn")
              for a in _safe_get_list(attached, "AttachedPolicies")
          ]
          return policy_arn in attached_arns
        except self.iam.exceptions.NoSuchEntityException:
          return False

      for r in roles:
        rn = _safe_get_str(r, "RoleName")
        if rn.startswith(f"app-role-{self.env_in_name}"):
          if _has_policy(rn):
            app_role_ok = True
        if rn.startswith(f"db-role-{self.env_in_name}"):
          if _has_policy(rn):
            db_role_ok = True
        if app_role_ok and db_role_ok:
          break
    except ClientError as e:
      self.fail(f"IAM role inspection failed: {e}")

    self.assertTrue(
        app_role_ok, f"{expected_policy_name} not attached to any app-role-{self.env_in_name}* role")
    self.assertTrue(
        db_role_ok, f"{expected_policy_name} not attached to any db-role-{self.env_in_name}* role")

  def test_05_bucket_naming_scheme(self):
    self.assertTrue(self.app_bucket)
    self.assertTrue(self.logging_bucket)

    pat = re.compile(
        r"^tap-(?P<kind>app|logging)-(?P<env>[a-z0-9\-]+)-(?P<suffix>[a-z0-9\-]+)$")

    if isinstance(self.app_bucket, str):
      m_app = pat.match(self.app_bucket)
    else:
      m_app = None
    if isinstance(self.logging_bucket, str):
      m_log = pat.match(self.logging_bucket)
    else:
      m_log = None

    self.assertIsNotNone(m_app, f"Invalid app bucket name: {self.app_bucket}")
    self.assertIsNotNone(
        m_log, f"Invalid logging bucket name: {self.logging_bucket}")

    if m_app and m_log:
      self.assertEqual(m_app.group("env"), m_log.group("env"))
      self.assertEqual(m_app.group("suffix"), m_log.group("suffix"))
