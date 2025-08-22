# tests/integration/test_tap_stack.py
import os
import socket

import boto3
import pytest
from botocore.exceptions import BotoCoreError, ClientError

REGION = os.getenv("AWS_REGION") or os.getenv(
    "AWS_DEFAULT_REGION") or "us-east-1"

# ---- Helpers ---------------------------------------------------------------


def safe_get(d, key, default=None):
  return d.get(key, default) if isinstance(d, dict) else default


@pytest.fixture(scope="module")
def ec2_client():
  return boto3.client("ec2", region_name=REGION)


@pytest.fixture(scope="module")
def asg_client():
  return boto3.client("autoscaling", region_name=REGION)


def _elb_client():
  return boto3.client("elbv2", region_name=REGION)


def _rds_client():
  return boto3.client("rds", region_name=REGION)


def _sns_client():
  return boto3.client("sns", region_name=REGION)


def _sm_client():
  return boto3.client("secretsmanager", region_name=REGION)


def _first(predicate, iterable):
  for x in iterable:
    if predicate(x):
      return x
  return None


def _find_dev_asg(asg):
  """
  Robustly locate the ASG for 'dev'.
  Strategies:
    1. name startswith 'dev-asg-'
    2. tag Name=dev-asg
    3. attached to target group 'dev-tg-*'
  """
  groups = []
  paginator = asg.get_paginator("describe_auto_scaling_groups")
  for page in paginator.paginate():
    groups.extend(page.get("AutoScalingGroups", []))

  # 1) prefix match
  g = _first(lambda x: safe_get(x, "AutoScalingGroupName",
             "").startswith("dev-asg-"), groups)
  if g:
    return g

  # 2) tag match
  def _has_name_tag(x):
    for t in safe_get(x, "Tags", []):
      if t.get("Key") in ("Name", "name") and t.get("Value") == "dev-asg":
        return True
    return False
  g = _first(_has_name_tag, groups)
  if g:
    return g

  # 3) attached to target group
  elb = _elb_client()
  tgs = []
  tg_p = elb.get_paginator("describe_target_groups")
  for pg in tg_p.paginate():
    tgs.extend(pg.get("TargetGroups", []))
  dev_tg = _first(lambda t: safe_get(
      t, "TargetGroupName", "").startswith("dev-tg-"), tgs)
  if dev_tg:
    arn = dev_tg.get("TargetGroupArn")
    g = _first(lambda x: arn in safe_get(x, "TargetGroupARNs", []), groups)
    if g:
      return g

  return None

# ---- Core Infra Tests ------------------------------------------------------


def test_alb_exists_and_resolves():
  """
  Verify ALB exists, has DNS, resolves, and is application type.
  """
  elb = _elb_client()

  lbs, marker = [], None
  while True:
    kwargs = {}
    if marker:
      kwargs["Marker"] = marker
    resp = elb.describe_load_balancers(**kwargs)
    lbs.extend(resp.get("LoadBalancers", []))
    marker = resp.get("NextMarker")
    if not marker:
      break

  cand = _first(lambda lb: lb.get(
      "LoadBalancerName", "").startswith("dev-alb-"), lbs)
  assert cand, "Could not find ALB (prefix 'dev-alb-')"

  dns = cand.get("DNSName")
  assert dns, "ALB DNSName missing"
  try:
    socket.gethostbyname(dns)
  except Exception as e:
    pytest.fail(f"ALB DNS '{dns}' did not resolve: {e}")

  assert cand.get("Type") == "application"
  assert cand.get("Scheme") in ("internet-facing", "internal")


def test_secrets_exist():
  """
  Ensure Secrets Manager secrets dev-db-secret-* and dev-app-config-* exist and are active.
  """
  sm = _sm_client()
  paginator = sm.get_paginator("list_secrets")
  found_db, found_app = None, None

  try:
    for page in paginator.paginate():
      for s in page.get("SecretList", []):
        name = s.get("Name", "")
        if name.startswith("dev-db-secret-"):
          found_db = s
        if name.startswith("dev-app-config-"):
          found_app = s
      if found_db and found_app:
        break
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"list_secrets failed: {e}")

  assert found_db, "Secret dev-db-secret-* missing"
  assert found_app, "Secret dev-app-config-* missing"

  for s in (found_db, found_app):
    try:
      desc = sm.describe_secret(SecretId=s["ARN"])
      assert desc.get("ARN")
      assert not desc.get("DeletedDate")
    except (ClientError, BotoCoreError) as e:
      pytest.fail(f"describe_secret failed for {s.get('Name')}: {e}")


def test_rds_secure_config():
  """
  Validate security posture of RDS 'dev-db'.
  """
  rds = _rds_client()
  db_id = "dev-db"
  try:
    resp = rds.describe_db_instances(DBInstanceIdentifier=db_id)
  except rds.exceptions.DBInstanceNotFoundFault:
    pytest.fail(f"RDS '{db_id}' not found")
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"describe_db_instances failed: {e}")

  dbs = resp.get("DBInstances", [])
  assert dbs, "No DBInstances returned"
  db = dbs[0]

  assert db.get("DBInstanceIdentifier") == db_id
  assert not db.get("PubliclyAccessible", True)
  assert db.get("StorageEncrypted", False)
  assert db.get("KmsKeyId")
  assert safe_get(db, "DBSubnetGroup", {}).get("DBSubnetGroupName")


def test_sns_topic_exists():
  """
  Confirm SNS topic 'dev-infra-alerts' exists and is accessible.
  """
  sns = _sns_client()
  paginator = sns.get_paginator("list_topics")
  arn = None

  try:
    for page in paginator.paginate():
      for t in page.get("Topics", []):
        t_arn = t.get("TopicArn", "")
        if t_arn.endswith(":dev-infra-alerts"):
          arn = t_arn
          break
      if arn:
        break
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"list_topics failed: {e}")

  assert arn, "SNS topic dev-infra-alerts not found"

  try:
    attrs = sns.get_topic_attributes(TopicArn=arn).get("Attributes", {})
    assert "Owner" in attrs and "Policy" in attrs
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"get_topic_attributes failed for {arn}: {e}")

# ---- Security Groups -------------------------------------------------------


def test_alb_security_group_exists(ec2_client):
  """
  Ensure ALB has SGs attached with ingress rules.
  """
  elb = _elb_client()
  lbs, marker = [], None
  while True:
    kwargs = {}
    if marker:
      kwargs["Marker"] = marker
    resp = elb.describe_load_balancers(**kwargs)
    lbs.extend(resp.get("LoadBalancers", []))
    marker = resp.get("NextMarker")
    if not marker:
      break
  alb = _first(lambda lb: safe_get(
      lb, "LoadBalancerName", "").startswith("dev-alb-"), lbs)
  assert alb, "Could not find dev ALB"

  sg_ids = safe_get(alb, "SecurityGroups", [])
  assert sg_ids, "ALB has no Security Groups"

  try:
    resp = ec2_client.describe_security_groups(GroupIds=sg_ids)
    sgs = safe_get(resp, "SecurityGroups", [])
    assert sgs
    has_ingress = any(safe_get(s, "IpPermissions", []) for s in sgs)
    assert has_ingress, "ALB SGs missing ingress rules"
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"describe_security_groups failed for ALB SGs: {e}")


def test_rds_security_group_exists(ec2_client):
  """
  Ensure RDS 'dev-db' has SGs attached.
  """
  rds = _rds_client()
  try:
    resp = rds.describe_db_instances(DBInstanceIdentifier="dev-db")
    db = safe_get(resp, "DBInstances", [None])[0]
    assert db
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"describe_db_instances failed: {e}")

  vpc_sgs = [g.get("VpcSecurityGroupId") for g in safe_get(
      db, "VpcSecurityGroups", []) if g.get("VpcSecurityGroupId")]
  assert vpc_sgs, "RDS has no SGs"

  try:
    resp = ec2_client.describe_security_groups(GroupIds=vpc_sgs)
    assert safe_get(resp, "SecurityGroups", [])
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"describe_security_groups failed for RDS SGs: {e}")


def test_ec2_security_group_exists(ec2_client, asg_client):
  """
  Ensure ASG LaunchTemplate has SGs attached.
  """
  asg = _find_dev_asg(asg_client)
  assert asg, "ASG not found"

  lt_ref = safe_get(asg, "LaunchTemplate", {})
  lt_id = lt_ref.get("LaunchTemplateId")
  lt_ver = str(lt_ref.get("Version") or "$Default")
  assert lt_id, "ASG missing Launch Template"

  try:
    ver_resp = ec2_client.describe_launch_template_versions(
        LaunchTemplateId=lt_id,
        Versions=[lt_ver],
    )
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"describe_launch_template_versions failed: {e}")

  versions = safe_get(ver_resp, "LaunchTemplateVersions", [])
  assert versions
  lt_data = safe_get(versions[0], "LaunchTemplateData", {})

  sg_ids = list(safe_get(lt_data, "SecurityGroupIds", []) or [])
  if not sg_ids:
    nis = safe_get(lt_data, "NetworkInterfaces", [])
    if nis:
      sg_ids = list(safe_get(nis[0], "Groups", []) or [])

  assert sg_ids, "No SGs in LaunchTemplate"

  try:
    resp = ec2_client.describe_security_groups(GroupIds=sg_ids)
    assert safe_get(resp, "SecurityGroups", [])
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"describe_security_groups failed for EC2 SGs: {e}")

# ---- Scaling Policies ------------------------------------------------------


def test_autoscaling_policies_exist(asg_client):
  """
  Ensure ASG has scale-up and scale-down policies.
  """
  asg = _find_dev_asg(asg_client)
  assert asg, "ASG not found"

  asg_name = asg["AutoScalingGroupName"]
  try:
    resp = asg_client.describe_policies(AutoScalingGroupName=asg_name)
    policies = safe_get(resp, "ScalingPolicies", [])
  except (ClientError, BotoCoreError) as e:
    pytest.fail(f"describe_policies failed: {e}")

  names = [safe_get(p, "PolicyName", "") for p in policies]
  assert names, "No scaling policies found"
  assert any(n.startswith("dev-scale-up")
             for n in names), "Scale-up policy missing"
  assert any(n.startswith("dev-scale-down")
             for n in names), "Scale-down policy missing"
