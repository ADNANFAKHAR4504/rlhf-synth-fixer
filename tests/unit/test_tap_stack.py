import unittest
from unittest.mock import MagicMock, patch
import pulumi
from lib.tap_stack import Config, VPCInfrastructure, IAMInfrastructure, DynamoDBInfrastructure, LambdaInfrastructure, APIGatewayInfrastructure, TapStack


class TestConfig(unittest.TestCase):
  def test_default_environment(self):
    cfg = Config()
    self.assertEqual(cfg.environment, "dev")
    self.assertEqual(cfg.region, "us-west-2")

  def test_resource_name_format(self):
    cfg = Config(environment="prod")
    self.assertTrue(cfg.get_resource_name("lambda").endswith("prod"))

  def test_dynamodb_capacity_envs(self):
    for env in ["dev", "staging", "prod"]:
      cfg = Config(environment=env)
      cap = cfg.get_dynamodb_config()
      self.assertIn("read", cap)
      self.assertIn("write", cap)

  def test_cors_domains(self):
    cfg = Config(environment="staging")
    self.assertTrue(any("staging" in d for d in cfg.get_cors_domains()))


class TestInfrastructure(unittest.TestCase):
  def setUp(self):
    self.cfg = Config()

  @patch("lib.tap_stack.aws.iam.Role", return_value=MagicMock(arn="role-arn"))
  @patch("lib.tap_stack.aws.iam.RolePolicyAttachment")
  @patch("lib.tap_stack.aws.iam.Policy",
         return_value=MagicMock(arn="policy-arn"))
  def test_iam_role_create(self, *_):
    iam = IAMInfrastructure(self.cfg)
    self.assertIsNotNone(iam.create_lambda_role())

  @patch("lib.tap_stack.aws.dynamodb.Table",
         return_value=MagicMock(name="table-name"))
  def test_dynamodb_tables_create(self, _):
    ddb = DynamoDBInfrastructure(self.cfg)
    self.assertIn("products", ddb.create_tables())

  @patch("lib.tap_stack.aws.lambda_.Function",
         return_value=MagicMock(invoke_arn="invoke-arn"))
  def test_lambda_functions_create(self, _):
    vpc = MagicMock()
    vpc.private_subnets = [MagicMock(id="subnet-id")]
    vpc.security_group = MagicMock(id="sg-id")
    iam = MagicMock(arn="role-arn")
    tables = {
        "products": MagicMock(
            name="prod"), "orders": MagicMock(
            name="ord"), "users": MagicMock(
            name="usr")}
    lambdas = LambdaInfrastructure(self.cfg, iam, vpc, tables)
    self.assertIn("orders", lambdas.create_lambda_functions())

  @patch("lib.tap_stack.aws.apigateway.RestApi",
         return_value=MagicMock(id="api-id", root_resource_id="root-id"))
  @patch("lib.tap_stack.aws.apigateway.Resource",
         return_value=MagicMock(id="res-id"))
  @patch("lib.tap_stack.aws.apigateway.Method")
  @patch("lib.tap_stack.aws.apigateway.Integration")
  def test_api_gateway_create(self, *_):
    lambdas = {fn: MagicMock(invoke_arn="arn")
               for fn in ["products", "orders", "users"]}
    api = APIGatewayInfrastructure(self.cfg, lambdas)
    self.assertIsNotNone(api.create_api_gateway())


class TestTapStack(unittest.TestCase):
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
  @patch("pulumi.export")
  def test_setup_infrastructure(self, mock_export, *_):
    stack = TapStack("test-stack", environment="dev", args={})
    stack.setup_infrastructure()
    self.assertEqual(stack.config.environment, "dev")
    mock_export.assert_any_call("Environment", "dev")
    mock_export.assert_any_call("Region", "us-west-2")
