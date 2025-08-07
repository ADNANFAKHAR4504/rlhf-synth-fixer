import unittest
from unittest.mock import MagicMock, patch
import pulumi
from lib.tap_stack import (
    Config, VPCInfrastructure, TapStackArgs, IAMInfrastructure,
    DynamoDBInfrastructure, LambdaInfrastructure,
    APIGatewayInfrastructure, TapStack
)
import warnings
warnings.filterwarnings(
    "ignore",
    category=DeprecationWarning,
    module="pulumi_aws")


class BasePulumiTest(unittest.TestCase):
  """Base class to ensure pulumi.export is always mocked for unit tests."""

  def setUp(self):
    patcher = patch("pulumi.export")
    self.addCleanup(patcher.stop)
    self.mock_export = patcher.start()
    self.mock_export.side_effect = lambda k, v=None: None  # no-op


# ---------- CONFIG TESTS ----------
class TestConfig(BasePulumiTest):
  def test_default_environment(self):
    cfg = Config()
    self.assertEqual(cfg.environment, "dev")
    self.assertEqual(cfg.region, "us-west-2")

  def test_resource_name_format_dev(self):
    cfg = Config(environment="dev")
    name = cfg.get_resource_name("lambda")
    self.assertTrue(name.endswith("dev"))

  def test_resource_name_format_prod(self):
    cfg = Config(environment="prod")
    name = cfg.get_resource_name("lambda")
    self.assertTrue(name.endswith("prod"))

  def test_dynamodb_capacity_all_envs_have_keys(self):
    for env in ["dev", "staging", "prod"]:
      cfg = Config(environment=env)
      cap = cfg.get_dynamodb_config()
      self.assertIn("read", cap)
      self.assertIn("write", cap)

  def test_cors_domains_staging(self):
    cfg = Config(environment="staging")
    domains = cfg.get_cors_domains()
    self.assertTrue(any("staging" in d for d in domains))

  def test_invalid_env_defaults(self):
    cfg = Config(environment="unknown-env")
    # should still store as provided
    self.assertEqual(cfg.environment, "unknown-env")


# ---------- IAM TESTS ----------
class TestIAMInfrastructure(BasePulumiTest):
  def setUp(self):
    super().setUp()
    self.cfg = Config()

  @patch("lib.tap_stack.aws.iam.Role", return_value=MagicMock(arn="role-arn"))
  @patch("lib.tap_stack.aws.iam.RolePolicyAttachment")
  @patch("lib.tap_stack.aws.iam.Policy",
         return_value=MagicMock(arn="policy-arn"))
  def test_iam_role_create_returns_role(self, *_):
    iam = IAMInfrastructure(self.cfg)
    role = iam.create_lambda_role()
    self.assertIsNotNone(role)

  def test_iam_role_name_format(self):
    role_name = self.cfg.get_resource_name("lambda-role")
    self.assertIn(self.cfg.environment, role_name)


# ---------- DYNAMODB TESTS ----------
class TestDynamoDBInfrastructure(BasePulumiTest):
  def setUp(self):
    super().setUp()
    self.cfg = Config()

  @patch("lib.tap_stack.aws.dynamodb.Table",
         return_value=MagicMock(name="table-name"))
  def test_dynamodb_tables_create_has_products(self, _):
    ddb = DynamoDBInfrastructure(self.cfg)
    tables = ddb.create_tables()
    self.assertIn("products", tables)

  @patch("lib.tap_stack.aws.dynamodb.Table",
         return_value=MagicMock(name="table-name"))
  def test_dynamodb_tables_create_has_orders(self, _):
    ddb = DynamoDBInfrastructure(self.cfg)
    tables = ddb.create_tables()
    self.assertIn("orders", tables)


# ---------- LAMBDA TESTS ----------
class TestLambdaInfrastructure(BasePulumiTest):
  def setUp(self):
    super().setUp()
    self.cfg = Config()
    self.vpc = MagicMock()
    self.vpc.private_subnets = [MagicMock(id="subnet-id")]
    self.vpc.security_group = MagicMock(id="sg-id")
    self.iam = MagicMock(arn="role-arn")
    self.tables = {
        "products": MagicMock(
            name="prod"), "orders": MagicMock(
            name="ord"), "users": MagicMock(
            name="usr")}

  @patch("lib.tap_stack.aws.lambda_.Function",
         return_value=MagicMock(invoke_arn="invoke-arn"))
  def test_lambda_functions_create_orders_exists(self, _):
    lambdas = LambdaInfrastructure(self.cfg, self.iam, self.vpc, self.tables)
    functions = lambdas.create_lambda_functions()
    self.assertIn("orders", functions)

  @patch("lib.tap_stack.aws.lambda_.Function",
         return_value=MagicMock(invoke_arn="invoke-arn"))
  def test_lambda_functions_create_users_exists(self, _):
    lambdas = LambdaInfrastructure(self.cfg, self.iam, self.vpc, self.tables)
    functions = lambdas.create_lambda_functions()
    self.assertIn("users", functions)


# ---------- API GATEWAY TESTS ----------
class TestAPIGatewayInfrastructure(BasePulumiTest):
  def setUp(self):
    super().setUp()
    self.cfg = Config()

  @patch("lib.tap_stack.aws.apigateway.RestApi",
         return_value=MagicMock(id="api-id", root_resource_id="root-id"))
  @patch("lib.tap_stack.aws.apigateway.Resource",
         return_value=MagicMock(id="res-id"))
  @patch("lib.tap_stack.aws.apigateway.Method")
  @patch("lib.tap_stack.aws.apigateway.Integration")
  def test_api_gateway_create_returns_value(self, *_):
    lambdas = {fn: MagicMock(invoke_arn="arn")
               for fn in ["products", "orders", "users"]}
    api = APIGatewayInfrastructure(self.cfg, lambdas)
    self.assertIsNotNone(api.create_api_gateway())

  def test_api_gateway_name_format(self):
    name = self.cfg.get_resource_name("api")
    self.assertIn(self.cfg.environment, name)


# ---------- TAPSTACK TESTS ----------
class TestTapStack(BasePulumiTest):
  @patch.object(VPCInfrastructure, "create_vpc")
  @patch.object(IAMInfrastructure, "create_lambda_role",
                return_value=MagicMock(arn="role-arn"))
  @patch.object(DynamoDBInfrastructure,
                "create_tables",
                return_value={"products": MagicMock(name="prod"),
                              "orders": MagicMock(name="ord"),
                              "users": MagicMock(name="usr")})
  @patch.object(LambdaInfrastructure,
                "create_lambda_functions",
                return_value={"products": MagicMock(invoke_arn="arn"),
                              "orders": MagicMock(invoke_arn="arn"),
                              "users": MagicMock(invoke_arn="arn")})
  @patch.object(APIGatewayInfrastructure, "create_api_gateway")
  def test_setup_infrastructure_exports_env_and_region(self, *_):
    stack = TapStack("test-stack", args=TapStackArgs("dev", "us-west-2"))
    self.mock_export.assert_any_call("Environment", "dev")
    self.mock_export.assert_any_call("Region", "us-west-2")
