from lib.tap_stack import TapStackArgs, TapStack
import pulumi
import pulumi.runtime
import os
import sys
import unittest
from unittest.mock import Mock
import types

# === Set Pulumi test mode environment variable ===
os.environ["PULUMI_TEST_MODE"] = "true"

# === Register Pulumi mocks ===


class MyMocks(pulumi.runtime.Mocks):
  def new_resource(self, type_, name, inputs, provider, id_):
    return [f"{name}-id", inputs]

  def call(self, token, args, provider):
    return {}


pulumi.runtime.set_mocks(MyMocks())

# === Helper: Create fake Pulumi AWS modules ===


def create_mock_package(name):
  mod = types.ModuleType(name)
  mod.__path__ = []  # mark as package
  return mod


# === Stub Pulumi AWS modules ===
sys.modules["pulumi_aws"] = create_mock_package("pulumi_aws")
sys.modules["pulumi_aws.ec2"] = create_mock_package("pulumi_aws.ec2")
sys.modules["pulumi_aws.rds"] = create_mock_package("pulumi_aws.rds")
sys.modules["pulumi_aws.iam"] = create_mock_package("pulumi_aws.iam")
sys.modules["pulumi_aws.apigateway"] = create_mock_package(
    "pulumi_aws.apigateway")

# === Attach mocks to stub modules ===
sys.modules["pulumi_aws.ec2"].Vpc = Mock(return_value=Mock(id="vpc-123"))
sys.modules["pulumi_aws.ec2"].Subnet = Mock(return_value=Mock(id="subnet-123"))
sys.modules["pulumi_aws.ec2"].SecurityGroup = Mock(
    return_value=Mock(id="sg-123"))
sys.modules["pulumi_aws.rds"].Instance = Mock(
    return_value=Mock(endpoint="db-endpoint", id="db-123"))
sys.modules["pulumi_aws.iam"].Role = Mock(
    return_value=Mock(arn="arn:aws:iam::123:role/test"))

sys.modules["pulumi_aws.apigateway"].RestApi = Mock(
    return_value=Mock(id="api-123"))
sys.modules["pulumi_aws.apigateway"].Deployment = Mock()
sys.modules["pulumi_aws.apigateway"].Stage = Mock()
sys.modules["pulumi_aws.apigateway"].Resource = Mock()
sys.modules["pulumi_aws.apigateway"].Method = Mock()
sys.modules["pulumi_aws.apigateway"].Integration = Mock()
sys.modules["pulumi_aws.apigateway"].IntegrationResponse = Mock()
sys.modules["pulumi_aws.apigateway"].MethodResponse = Mock()

# === Test class ===


class TestTapStackComponents(unittest.TestCase):
  def setUp(self):
    self.test_args = TapStackArgs(
        environment_suffix="test",
        tags={"Environment": "test", "Project": "tap-stack"}
    )

  def test_tap_stack_initialization(self):
    stack = TapStack(
        name="tap-test",
        args=self.test_args,
        opts=pulumi.ResourceOptions(),
    )

    # IAM Component
    self.assertIsNotNone(stack.iam_component)
    self.assertTrue(hasattr(stack.iam_component, "lambda_role"))
    self.assertEqual(stack.iam_component.lambda_role.arn,
                     "arn:aws:iam::123:role/test")

    # Compute Component
    self.assertIsNotNone(stack.compute_component)
    self.assertTrue(hasattr(stack.compute_component, "vpc"))
    self.assertEqual(stack.compute_component.vpc.id, "vpc-123")
    self.assertTrue(hasattr(stack.compute_component, "private_subnet_ids"))
    self.assertTrue(hasattr(stack.compute_component, "lambda_sg"))
    self.assertEqual(stack.compute_component.lambda_sg.id, "sg-123")

    # Database Component
    self.assertIsNotNone(stack.database_component)
    self.assertTrue(hasattr(stack.database_component, "rds_instance"))
    self.assertEqual(
        stack.database_component.rds_instance.endpoint, "db-endpoint")

    # Serverless Component
    self.assertIsNotNone(stack.serverless_component)
    self.assertTrue(hasattr(stack.serverless_component, "lambda_function"))
    self.assertTrue(hasattr(stack.serverless_component, "api"))
    self.assertEqual(stack.serverless_component.api.id, "api-123")


if __name__ == "__main__":
  unittest.main(verbosity=2, buffer=True)
