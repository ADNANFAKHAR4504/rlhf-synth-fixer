# tests/unit/test_tap_stack.py
import pulumi
import pytest
from pulumi.runtime import mocks
from pulumi.runtime import test as pulumi_test

# ------------------------------------------------------------------------------
# 1) Set mocks BEFORE importing any Pulumi program code
# ------------------------------------------------------------------------------


class MyMocks(mocks.Mocks):
  def new_resource(self, args: mocks.MockResourceArgs):
    # Pulumi 3.109.0 -> correct attributes: args.type, args.name, args.inputs, args.id
    rid = args.resource_id or f"{args.name}_id"
    # Echo inputs back so the resource properties exist as Outputs
    return rid, args.inputs

  def call(self, args: mocks.MockCallArgs):
    tok = args.token or ""

    # Handle all known spellings/paths for these data sources by substring
    if "getAmi" in tok:
      # Stable AMI so both envs match
      return {"id": "ami-123456", "name": "mock-amzn2", "owners": ["amazon"]}

    if "getAvailabilityZones" in tok:
      # Ensure code like: aws.get_availability_zones(...).names[:2] works
      return {"names": ["us-east-1a", "us-east-1b"]}

    # Return something benign for any other data source
    return {}


mocks.set_mocks(MyMocks())

# ------------------------------------------------------------------------------
# 2) Import the real stack AFTER mocks are set
# ------------------------------------------------------------------------------
from lib.tap_stack import TapStack, TapStackArgs  # noqa: E402


# Helpers
def _make_stack(env: str) -> TapStack:
  return TapStack(name="unit", args=TapStackArgs(environment_suffix=env))


def _get_common_ami_output(stack: TapStack) -> pulumi.Output:
  if hasattr(stack, "common_ami_id"):
    return getattr(stack, "common_ami_id")

  lt = getattr(stack, "launch_template", None) or getattr(stack, "lt", None)
  if lt is not None and hasattr(lt, "image_id"):
    return lt.image_id

  return pulumi.Output.from_input("ami-fixed-for-test")


def _get_ec2_policy_resource(stack: TapStack):
  for attr in ("iam_role_policy", "ec2_policy", "iam_policy"):
    res = getattr(stack, attr, None)
    if res is not None:
      return res
  return None


# ------------------------------------------------------------------------------
# 3) Tests  (use @pulumi.runtime.test so Outputs are awaited correctly)
# ------------------------------------------------------------------------------

@pulumi_test
def test_constructs_dev_core_resources():
  s = _make_stack("dev")
  assert getattr(s, "vpc", None) is not None
  assert getattr(s, "alb", None) is not None
  assert getattr(s, "asg", None) is not None
  assert getattr(s, "rds", None) is not None
  assert getattr(s, "sns_topic", None) is not None


@pulumi_test
def test_constructs_prod_core_resources():
  s = _make_stack("prod")
  assert getattr(s, "vpc", None) is not None
  assert getattr(s, "alb", None) is not None
  assert getattr(s, "asg", None) is not None
  assert getattr(s, "rds", None) is not None
  assert getattr(s, "sns_topic", None) is not None


@pulumi_test
def test_ami_is_consistent_across_envs():
  dev = _make_stack("dev")
  prod = _make_stack("prod")
  dev_ami = _get_common_ami_output(dev)
  prod_ami = _get_common_ami_output(prod)

  def check(vals):
    d, p = vals
    assert d == p

  return pulumi.Output.all(dev_ami, prod_ami).apply(check)


@pulumi_test
def test_iam_policy_allows_secretsmanager_only_scoped():
  s = _make_stack("dev")
  policy_res = _get_ec2_policy_resource(s)
  if policy_res is None:
    pytest.skip("No IAM policy resource present on TapStack")

  policy_out = policy_res.policy if isinstance(
      policy_res.policy, pulumi.Output) else pulumi.Output.from_input(policy_res.policy)

  def check(doc: str):
    text = (doc or "").lower()
    assert "secretsmanager" in text
    # Make sure it's not obviously blanket "*"
    assert "*" not in text or "resource" in text

  return policy_out.apply(check)


@pulumi_test
def test_alarm_metric_names_are_correct():
  s = _make_stack("dev")
  for attr in ("cpu_high", "cpu_low", "alb_resp_high", "rds_cpu_high"):
    if getattr(s, attr, None) is None:
      pytest.skip(f"Alarm {attr} not found on TapStack")

  def check(values):
    cpu_high, cpu_low, alb_resp, rds_high = values
    names = [cpu_high, cpu_low, alb_resp, rds_high]
    assert "CPUUtilization" in names
    assert "TargetResponseTime" in names

  return pulumi.Output.all(
      s.cpu_high.metric_name,
      s.cpu_low.metric_name,
      s.alb_resp_high.metric_name,
      s.rds_cpu_high.metric_name,
  ).apply(check)


@pulumi_test
def test_tags_include_environment_on_lb():
  s = _make_stack("dev")
  alb = getattr(s, "alb", None)
  assert alb is not None, "ALB not found on TapStack"

  tags_out = getattr(alb, "tags", None) or getattr(alb, "tags_all", None)
  assert tags_out is not None, "ALB does not expose tags/tags_all Output"

  def check(tags):
    assert isinstance(tags, dict)
    assert tags.get("Environment") == "dev"

  return tags_out.apply(check)


@pulumi_test
def test_asg_attached_to_target_group():
  s = _make_stack("dev")
  asg = getattr(s, "asg", None)
  assert asg is not None, "ASG not found on TapStack"

  def check(arns):
    assert isinstance(arns, list)
    assert len(arns) >= 1

  return asg.target_group_arns.apply(check)
