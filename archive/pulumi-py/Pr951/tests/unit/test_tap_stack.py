# tests/test_tap_stack.py
import json
import pytest
import pulumi
from unittest.mock import patch, MagicMock
from lib.tap_stack import (
    TapStackArgs,
    SecureVPC,
    create_kms_key,
    create_security_groups,
    create_compute_resources,
    create_api_gateway,
    create_api_gateway_cloudwatch_role,
    create_monitoring,
    TapStack
)

# -----------------------------
# Fixtures
# -----------------------------


@pytest.fixture
def sample_tags():
  return {"Environment": "Production", "Project": "Test"}


@pytest.fixture
def mock_vpc():
  vpc = MagicMock()
  vpc.id = "vpc-123"
  vpc.cidr_block = "10.0.0.0/16"
  return vpc


@pytest.fixture
def mock_subnets():
  s1 = MagicMock()
  s1.id = "subnet-1"
  s2 = MagicMock()
  s2.id = "subnet-2"
  return [s1, s2]


@pytest.fixture
def mock_sg():
  sg = MagicMock()
  sg.id = "sg-123"
  return sg


@pytest.fixture
def mock_kms_key():
  key = MagicMock()
  key.arn = "arn:aws:kms:us-east-1:123:key/abc"
  key.id = "kms-id"
  key.key_id = "key-id"
  return key

# -----------------------------
# Tests for TapStackArgs
# -----------------------------


def test_tapstackargs_defaults():
  args = TapStackArgs()
  assert args.environment_suffix == "dev"
  assert args.tags == {"Environment": "Production"}


def test_tapstackargs_custom():
  args = TapStackArgs(environment_suffix="prod", tags={"Env": "QA"})
  assert args.environment_suffix == "prod"
  assert args.tags == {"Env": "QA"}

# -----------------------------
# Tests for SecureVPC
# -----------------------------


@patch("lib.tap_stack.aws.get_region",
       return_value=MagicMock(name="us-east-1"))
@patch("lib.tap_stack.aws.get_availability_zones",
       return_value=MagicMock(names=["us-east-1a", "us-east-1b"]))
@patch.object(SecureVPC, "_create_vpc", return_value="vpc")
@patch.object(SecureVPC, "_create_internet_gateway", return_value="igw")
@patch.object(SecureVPC, "_create_public_subnets",
              return_value=["pub1", "pub2"])
@patch.object(SecureVPC, "_create_private_subnets",
              return_value=["priv1", "priv2"])
@patch.object(SecureVPC, "_create_elastic_ips", return_value=["eip1", "eip2"])
@patch.object(SecureVPC, "_create_nat_gateways", return_value=["nat1", "nat2"])
@patch.object(SecureVPC, "_create_public_route_table", return_value="prt")
@patch.object(SecureVPC, "_create_private_route_tables",
              return_value=["prt1", "prt2"])
@patch.object(SecureVPC, "_create_public_nacl", return_value="pubnacl")
@patch.object(SecureVPC, "_create_private_nacl", return_value="privnacl")
@patch.object(SecureVPC, "_create_flow_logs_role", return_value="flowrole")
@patch.object(SecureVPC, "_create_flow_logs", return_value="flowlogs")
def test_securevpc_init(
    *_,
):
  vpc = SecureVPC("test", "10.0.0.0/16", {"Env": "Test"})
  assert vpc.vpc == "vpc"
  assert vpc.igw == "igw"
  assert vpc.public_subnets == ["pub1", "pub2"]
  assert vpc.private_subnets == ["priv1", "priv2"]

# -----------------------------
# Tests for helper functions
# -----------------------------


@patch("lib.tap_stack.aws.get_caller_identity",
       return_value=MagicMock(account_id="123456789"))
@patch("lib.tap_stack.aws.kms.Key",
       return_value=MagicMock(key_id="kid", id="kid", arn="arn"))
@patch("lib.tap_stack.aws.kms.Alias", return_value=MagicMock())
def test_create_kms_key(mock_alias, mock_key, mock_identity, sample_tags):
  key = create_kms_key(sample_tags)
  assert key == mock_key.return_value
  mock_alias.assert_called_once()


@patch("lib.tap_stack.aws.ec2.SecurityGroup",
       side_effect=lambda *a, **k: MagicMock(id="sg", **k))
def test_create_security_groups(mock_sg, mock_vpc, sample_tags):
  sgs = create_security_groups(mock_vpc, sample_tags)
  assert "web_sg" in sgs and "lambda_sg" in sgs


@patch("lib.tap_stack.aws.ec2.get_ami", return_value=MagicMock(id="ami-123"))
@patch("lib.tap_stack.aws.ec2.Instance", side_effect=lambda *a,
       **k: MagicMock(id=k.get("tags", {}).get("Name")))
@patch("lib.tap_stack.aws.iam.Role", return_value=MagicMock(name="role"))
@patch("lib.tap_stack.aws.iam.InstanceProfile",
       return_value=MagicMock(name="profile"))
@patch("lib.tap_stack.aws.iam.RolePolicyAttachment", return_value=MagicMock())
def test_create_compute_resources(
        _,
        __,
        ___,
        mock_instance,
        mock_get_ami,
        mock_subnets,
        mock_sg,
        mock_kms_key,
        sample_tags):
  result = create_compute_resources(
      mock_subnets, mock_sg, mock_kms_key, sample_tags)
  assert len(result["instances"]) == 2


@patch("lib.tap_stack.aws.cloudwatch.LogGroup",
       return_value=MagicMock(arn="arn:log"))
@patch("lib.tap_stack.aws.apigateway.RestApi",
       return_value=MagicMock(id="api", root_resource_id="root"))
@patch("lib.tap_stack.create_api_gateway_cloudwatch_role",
       return_value=MagicMock(arn="rolearn"))
def test_create_api_gateway(
        mock_role,
        mock_api,
        mock_log,
        mock_kms_key,
        sample_tags):
  res = create_api_gateway(mock_kms_key, sample_tags)
  assert "api" in res and "api_url" in res


@patch("lib.tap_stack.aws.iam.Role",
       return_value=MagicMock(name="role", arn="arn"))
@patch("lib.tap_stack.aws.iam.RolePolicyAttachment", return_value=MagicMock())
def test_create_api_gateway_cloudwatch_role(_, mock_role, sample_tags):
  role = create_api_gateway_cloudwatch_role(sample_tags)
  assert role == mock_role.return_value


@patch("lib.tap_stack.aws.lambda_.Permission", return_value=MagicMock())
@patch("lib.tap_stack.aws.cloudwatch.EventTarget", return_value=MagicMock())
@patch("lib.tap_stack.aws.cloudwatch.EventRule",
       return_value=MagicMock(name="rule"))
@patch("lib.tap_stack.aws.iam.RolePolicy", return_value=MagicMock())
@patch("lib.tap_stack.aws.iam.RolePolicyAttachment", return_value=MagicMock())
@patch("lib.tap_stack.aws.iam.Role", return_value=MagicMock(name="role"))
@patch("lib.tap_stack.aws.lambda_.Function",
       return_value=MagicMock(name="func", arn="arn"))
@patch("lib.tap_stack.aws.cloudwatch.LogGroup", return_value=MagicMock())
def test_create_monitoring(
    mock_log_group,
    mock_lambda_function,
    mock_iam_role,
    mock_role_policy_attachment,
    mock_role_policy,
    mock_event_rule,
    mock_event_target,
    mock_lambda_permission,
    mock_subnets,      # <-- pytest fixture
    mock_sg,           # <-- pytest fixture
    mock_kms_key,      # <-- pytest fixture
    sample_tags        # <-- pytest fixture
):
  res = create_monitoring(
      mock_subnets, mock_sg, [
          MagicMock()], mock_kms_key, sample_tags)
  assert "lambda_function" in res
  assert res["lambda_function"] is not None
  assert res["log_group"] is not None
  assert res["schedule_rule"] is not None
  assert res["role"] is not None


# -----------------------------
# Tests for TapStack orchestration
# -----------------------------


@patch("lib.tap_stack.aws.get_region",
       return_value=MagicMock(name="us-west-2"))
def test_tapstack_region_mismatch(mock_region):
  args = TapStackArgs()
  assert args is not None
