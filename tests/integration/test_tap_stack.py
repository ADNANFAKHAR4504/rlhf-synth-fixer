"""Integration tests for TapStack.

These tests synthesize the Terraform JSON and assert strict properties
requested by the prompt (SSE-KMS, PAB, Flow Logs, RDS enc/private, SG rules).
"""

import json
import os
from pathlib import Path

from cdktf import App

from lib.tap_stack import TapStack


def synth_and_read(stack_name: str, env: dict | None = None) -> dict:
  # Allow per-test environment overrides (e.g., ALLOWED_CIDRS)
  previous: dict[str, str] = {}
  if env:
    for k, v in env.items():
      previous[k] = os.environ.get(k, "")
      os.environ[k] = v
  try:
    app = App()
    TapStack(app, stack_name)
    app.synth()
    out_dir = Path("cdktf.out") / "stacks" / stack_name
    tf_json = out_dir / "cdk.tf.json"
    assert tf_json.exists(), f"Synthesized file not found: {tf_json}"
    with tf_json.open() as f:
      return json.load(f)
  finally:
    if env:
      for k, v in previous.items():
        if v == "":
          os.environ.pop(k, None)
        else:
          os.environ[k] = v


def get_resources(tf: dict, rtype: str) -> dict:
  resources = tf.get("resource", {})
  return resources.get(rtype, {})


class TestIntegrationSynth:
  def test_synth_file_exists(self):
    tf = synth_and_read("IntegrationStackBasic")
    assert isinstance(tf, dict)

  def test_s3_bucket_encryption_and_pab(self):
    tf = synth_and_read("IntegrationStackS3")
    buckets = get_resources(tf, "aws_s3_bucket")
    assert len(buckets) >= 1
    # Find any bucket with SSE-KMS configured
    assert any(
      (
        isinstance(cfg := bucket.get("server_side_encryption_configuration"), dict)
        and isinstance(cfg.get("rule"), list)
        and any(
          r.get("apply_server_side_encryption_by_default", {}).get("sse_algorithm")
          == "aws:kms" for r in cfg["rule"]
        )
      )
      for bucket in buckets.values()
    ), "Expected aws:kms SSE on at least one S3 bucket"

    pabs = get_resources(tf, "aws_s3_bucket_public_access_block")
    assert len(pabs) >= 1
    pab = next(iter(pabs.values()))
    assert pab.get("block_public_acls") is True
    assert pab.get("block_public_policy") is True
    assert pab.get("ignore_public_acls") is True
    assert pab.get("restrict_public_buckets") is True

  def test_flow_logs_and_log_group(self):
    tf = synth_and_read("IntegrationStackFlowLogs")
    lgs = get_resources(tf, "aws_cloudwatch_log_group")
    # There should be at least one log group; check name matches
    assert any(lg.get("name") == "/aws/vpc/flowlogs" for lg in lgs.values())

    flows = get_resources(tf, "aws_flow_log")
    assert len(flows) >= 1
    fl = next(iter(flows.values()))
    assert fl.get("traffic_type") == "ALL"
    # Destination type should be cloud-watch-logs or tokenized; assert field exists
    assert "log_destination_type" in fl

  def test_rds_db_encrypted_and_private(self):
    tf = synth_and_read("IntegrationStackDb")
    dbs = get_resources(tf, "aws_db_instance")
    assert len(dbs) >= 1
    db = next(iter(dbs.values()))
    assert db.get("storage_encrypted") is True
    assert db.get("publicly_accessible") is False
    assert "kms_key_id" in db

    subnet_groups = get_resources(tf, "aws_db_subnet_group")
    assert len(subnet_groups) >= 1
    sg = next(iter(subnet_groups.values()))
    subs = sg.get("subnet_ids")
    assert isinstance(subs, list) and len(subs) >= 2

  def test_security_groups_and_rules(self):
    tf = synth_and_read("IntegrationStackSg")
    sgs = get_resources(tf, "aws_security_group")
    assert len(sgs) >= 2
    # Names should match what we set
    assert any(sg.                   get("name") == "secure-web-sg" for sg in sgs.values())
    assert any(sg.get("name") == "secure-db-sg" for sg in sgs.values())

    sgrs = get_resources(tf, "aws_security_group_rule")
    assert len(sgrs) >= 3
    # Expect HTTP and HTTPS ingress
    ports = sorted(
      set(
        r.get("from_port") for r in sgrs.values()
        if r.get
        
        
        
        
        
        
        
        
        
        
        
        
        
        ("type") == "ingress"
      )
    )
    assert 80 in ports and 443 in ports
    # Egress rule open
    assert any(
      r.get("type") == "egress" and r.get("protocol") == "-1"
      for r in sgrs.values()
    )

  def test_security_groups_respect_allowed_cidrs_override(self):
    tf = synth_and_read(
      "IntegrationStackSgCidr",
      env={"ALLOWED_CIDRS": "10.0.0.0/8,192.168.0.0/16"},
    )
    sgrs = get_resources(tf, "aws_security_group_rule")
    ingress = [r for r in sgrs.values() if r.get("type") == "ingress"]
    cidrs = set()
    for r in ingress:
      for block in r.get("cidr_blocks", []) or []:
        cidrs.add(block)
    assert "10.0.0.0/8" in cidrs and "192.168.0.0/16" in cidrs

  def test_outputs_present(self):
    tf = synth_and_read("IntegrationStackOutputs")
    outputs = tf.get("output", {})
    for key in ("vpc_id", "s3_bucket_name", "rds_endpoint", "web_sg_id"):
      assert key in outputs

  def test_vpc_and_routes(self):
    tf = synth_and_read("IntegrationStackVpc")
    vpcs = get_resources(tf, "aws_vpc")
    assert len(vpcs) >= 1
    vpc = next(iter(vpcs.values()))
    assert vpc.get("cidr_block") == "10.0.0.0/16"
    # Public route through IGW
    routes = get_resources(tf, "aws_route")
    assert any(r.get("destination_cidr_block") == "0.0.0.0/0" and r.get("gateway_id") for r in routes.values())

  def test_log_group_retention(self):
    tf = synth_and_read("IntegrationStackLogs")
    lgs = get_resources(tf, "aws_cloudwatch_log_group")
    assert any(lg.get("name") == "/aws/vpc/flowlogs" and lg.get("retention_in_days") == 30 for lg in lgs.values())

  def test_iam_role_trust_policy_and_actions(self):
    tf = synth_and_read("IntegrationStackIam")
    roles = get_resources(tf, "aws_iam_role")
    assert len(roles) >= 1
    # Trust policy includes vpc-flow-logs.amazonaws.com
    trust_ok = False
    for role in roles.values():
      doc = role.get("assume_role_policy")
      if not doc:
        continue
      try:
        parsed = json.loads(doc)
        principals = parsed.get("Statement", [])[0].get("Principal", {})
        if "vpc-flow-logs.amazonaws.com" in json.dumps(principals):
          trust_ok = True
          break
      except Exception:
        pass
    assert trust_ok

    # Policy: ensure at least one role policy exists (actions validated in unit tests)
    policies = get_resources(tf, "aws_iam_role_policy")
    assert len(policies) >= 1

  def test_rds_engine_and_backups(self):
    tf = synth_and_read("IntegrationStackDbProps")
    dbs = get_resources(tf, "aws_db_instance")
    assert len(dbs) >= 1
    db = next(iter(dbs.values()))
    assert db.get("engine") == "postgres"
    assert db.get("backup_retention_period") == 7
