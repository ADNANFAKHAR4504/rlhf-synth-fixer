import unittest
import pulumi.runtime
from lib.tap_stack import TapStack, VPCInfrastructure, IAMInfrastructure, DynamoDBInfrastructure, LambdaInfrastructure, APIGatewayInfrastructure


class TestTapStackIntegration(unittest.TestCase):
  def test_stack_outputs_and_resources(self):
    stack = TapStack("test-stack", environment="dev")
    stack.setup_infrastructure()
    outputs = pulumi.runtime.serialize_properties({
        "Environment": stack.config.environment,
        "Region": stack.config.region
    })
    self.assertIn("Environment", outputs)
    self.assertIn("Region", outputs)
    self.assertEqual(outputs["Environment"], "dev")
    self.assertEqual(outputs["Region"], "us-west-2")

  def test_vpc_resources_created(self):
    cfg = TapStack("test-stack", args={}).config
    vpc = VPCInfrastructure(cfg)
    vpc.create_vpc()
    self.assertIsNotNone(vpc.vpc)
    self.assertTrue(len(vpc.public_subnets) > 0)
    self.assertTrue(len(vpc.private_subnets) > 0)

  def test_iam_role_created(self):
    cfg = TapStack("test-stack", args={}).config
    iam = IAMInfrastructure(cfg)
    role = iam.create_lambda_role()
    self.assertIsNotNone(role)

  def test_dynamodb_tables_created(self):
    cfg = TapStack("test-stack", args={}).config
    dynamo = DynamoDBInfrastructure(cfg)
    tables = dynamo.create_tables()
    self.assertIn("products", tables)
    self.assertIn("orders", tables)
    self.assertIn("users", tables)

  def test_lambda_functions_created(self):
    cfg = TapStack("test-stack", args={}).config
    vpc = VPCInfrastructure(cfg)
    vpc.create_vpc()
    iam = IAMInfrastructure(cfg)
    role = iam.create_lambda_role()
    dynamo = DynamoDBInfrastructure(cfg)
    tables = dynamo.create_tables()
    lambdas = LambdaInfrastructure(cfg, role, vpc, tables)
    functions = lambdas.create_lambda_functions()
    self.assertIn("products", functions)
    self.assertIn("orders", functions)
    self.assertIn("users", functions)

  def test_api_gateway_created(self):
    cfg = TapStack("test-stack", args={}).config
    lambdas = {"products": object(), "orders": object(), "users": object()}
    api = APIGatewayInfrastructure(cfg, lambdas)
    rest_api = api.create_api_gateway()
    self.assertIsNotNone(rest_api)
