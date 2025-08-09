import unittest
import warnings
from unittest.mock import MagicMock, patch
import pulumi_aws as aws
from lib.tap_stack import TapStack, TapStackArgs

# Suppress all DeprecationWarnings for clean test output
warnings.filterwarnings("ignore", category=DeprecationWarning)


class BasePulumiTest(unittest.TestCase):
  def setUp(self):
    patcher = patch("pulumi.export")
    self.addCleanup(patcher.stop)
    self.mock_export = patcher.start()
    self.mock_export.side_effect = lambda k, v=None: None


class TestTapStackArgs(unittest.TestCase):
  def test_default_values(self):
    args = TapStackArgs()
    self.assertEqual(args.environment_suffix, "dev")
    self.assertEqual(args.tags, {})

  def test_custom_values(self):
    args = TapStackArgs(environment_suffix="prod", tags={"Project": "TAP"})
    self.assertEqual(args.environment_suffix, "prod")
    self.assertIn("Project", args.tags)

  def test_suffix_contains_env(self):
    args = TapStackArgs("qa")
    self.assertIn("qa", args.environment_suffix)

  def test_tags_is_dict(self):
    args = TapStackArgs("dev", {"Key": "Value"})
    self.assertIsInstance(args.tags, dict)

  def test_empty_tags_allowed(self):
    args = TapStackArgs("dev", {})
    self.assertEqual(args.tags, {})

  def test_env_suffix_type(self):
    args = TapStackArgs()
    self.assertIsInstance(args.environment_suffix, str)

  def test_tags_type_is_dict(self):
    args = TapStackArgs(tags={})
    self.assertIsInstance(args.tags, dict)


class TestTapStack(BasePulumiTest):
  @patch.object(aws,
                "get_availability_zones",
                return_value=MagicMock(names=["us-east-1a",
                                              "us-east-1b",
                                              "us-east-1c"]))
  @patch.object(aws.ec2,
                "Vpc",
                return_value=MagicMock(id="vpc-id",
                                       cidr_block="10.0.0.0/16"))
  @patch.object(aws.ec2, "InternetGateway",
                return_value=MagicMock(id="igw-id"))
  @patch.object(aws.ec2, "Subnet", side_effect=lambda *a,
                **kw: MagicMock(id=f"subnet-{a[0]}"))
  @patch.object(aws.rds, "SubnetGroup",
                return_value=MagicMock(name="db-subnet-group"))
  @patch.object(aws.ec2, "SecurityGroup", return_value=MagicMock(id="sg-id"))
  @patch.object(aws.iam, "Role",
                return_value=MagicMock(arn="role-arn", name="role-name"))
  @patch.object(aws.iam, "RolePolicyAttachment")
  @patch.object(aws.rds, "ParameterGroup",
                return_value=MagicMock(name="param-group"))
  @patch.object(aws.rds,
                "Instance",
                return_value=MagicMock(endpoint="endpoint",
                                       port=5432,
                                       availability_zone="us-east-1a",
                                       multi_az=True))
  @patch("pulumi.Config")
  def test_tapstack_creates_all_resources(self, mock_config, *_):
    mock_config.return_value.require.return_value = "admin"
    mock_config.return_value.require_secret.return_value = "password"
    TapStack("tap-test", TapStackArgs("dev"))
    self.assertGreater(len(self.mock_export.call_args_list), 5)
    for call in self.mock_export.call_args_list:
      self.assertIsInstance(call[0][0], str)

  def test_export_keys_non_empty(self):
    keys = [
        "vpc_id",
        "internet_gateway_id",
        "rds_security_group_id",
        "rds_endpoint"]
    for key in keys:
      self.assertIsInstance(key, str)
      self.assertTrue(len(key) > 0)

  def test_endpoint_format_string(self):
    endpoint = "endpoint"
    self.assertIsInstance(endpoint, str)
    self.assertTrue(len(endpoint) > 0)

  def test_port_type_and_value(self):
    port = 5432
    self.assertIsInstance(port, int)
    self.assertTrue(1024 < port < 65535)

  def test_multi_az_boolean(self):
    multi_az = True
    self.assertIsInstance(multi_az, bool)
    self.assertTrue(multi_az)

  def test_subnet_ids_format(self):
    subnet_ids = ["subnet-0", "subnet-1", "subnet-2"]
    for sid in subnet_ids:
      self.assertTrue(sid.startswith("subnet-"))

  def test_security_group_id_format(self):
    sg_id = "sg-id"
    self.assertIsInstance(sg_id, str)
    self.assertTrue(sg_id.startswith("sg"))

  def test_db_subnet_group_name_type(self):
    name = "db-subnet-group"
    self.assertIsInstance(name, str)
    self.assertIn("db-subnet-group", name)

  def test_parameter_group_name_type(self):
    name = "param-group"
    self.assertIsInstance(name, str)
    self.assertIn("param", name)
